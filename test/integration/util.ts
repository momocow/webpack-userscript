import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

import express, { static as expressStatic } from 'express';
import { Configuration, webpack } from 'webpack';

import { createFsFromVolume, Volume } from './volume';

export const GLOBAL_FIXTURES_DIR = path.join(__dirname, 'fixtures');

export interface CompilerFileSystems {
  intermediateFileSystem?: Volume;
}

export async function compile(
  input: Volume,
  config: Configuration,
  { intermediateFileSystem }: CompilerFileSystems = {},
): Promise<Volume> {
  const output = new Volume();
  const compiler = webpack(config);

  compiler.inputFileSystem = createFsFromVolume(input);
  compiler.outputFileSystem = createFsFromVolume(output);
  compiler.intermediateFileSystem =
    intermediateFileSystem ?? (compiler.outputFileSystem as Volume);

  const stats = await promisify(compiler.run.bind(compiler))();
  await promisify(compiler.close.bind(compiler))();

  if (stats?.hasErrors() || stats?.hasWarnings()) {
    const details = stats.toJson();

    if (details.errorsCount) {
      console.error(details.errors);
    }
    if (details.warningsCount) {
      console.error(details.warnings);
    }

    throw new Error('invalid fixtures');
  }

  return output;
}

export interface WatchStep {
  output: Volume;
  writeFile: (
    file: string,
    body: string,
    encode?: BufferEncoding,
  ) => Promise<void>;
}

export async function watchCompile(
  input: Volume,
  config: Configuration,
  handle: (ctx: WatchStep) => Promise<boolean>,
): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    const watchDir = await mkdtemp(
      path.join(tmpdir(), 'webpack-userscript_test_'),
    );

    for (const [file, body] of Object.entries(input.toJSON())) {
      if (body === null) {
        continue;
      }

      await writeFile(path.join(watchDir, file), body, 'utf-8');
    }

    const output = new Volume();
    const compiler = webpack({
      ...config,
      context:
        typeof config.context === 'string'
          ? path.join(watchDir, config.context)
          : undefined,
    });

    compiler.outputFileSystem = createFsFromVolume(output);

    const watching = compiler.watch({}, async (err, stats) => {
      if (err) {
        await close();
        reject(err);

        return;
      }

      if (stats?.hasErrors() || stats?.hasWarnings()) {
        const details = stats.toJson();

        if (details.errorsCount) {
          console.error(details.errors);
        }
        if (details.warningsCount) {
          console.error(details.warnings);
        }

        await close();
        reject(new Error('invalid fixtures'));

        return;
      }

      try {
        const conti = await handle({
          output,
          writeFile: writeFileInWatchDir,
        });

        if (!conti) {
          await close();
          resolve();
        }
      } catch (err) {
        await close();
        reject(err);
      }
    });

    const closeWatching = promisify(watching.close.bind(watching));
    const closeCompiler = promisify(compiler.close.bind(compiler));

    const close = async (): Promise<void> => {
      await closeWatching();
      await closeCompiler();
      await rm(watchDir, { recursive: true, force: true });
    };

    const writeFileInWatchDir = (
      file: string,
      body: string,
      encode?: BufferEncoding,
    ): Promise<void> => writeFile(path.join(watchDir, file), body, encode);
  });
}

export interface ServeStatic {
  port: number;
  close: () => Promise<void>;
}

export async function servceStatic(root: string): Promise<ServeStatic> {
  return new Promise((resolve, reject) => {
    const app = express();
    app.use(expressStatic(root));
    const server = app
      .listen(() => {
        const { port } = server.address() as AddressInfo;
        resolve({ port, close: promisify(server.close.bind(server)) });
      })
      .on('error', (err) => {
        reject(err);
      });
  });
}

export function escapeRegex(str: string): string {
  return str.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
}

export function findTags(
  tag: string,
  value: string,
  content: string,
): string[] {
  return (
    content.match(
      new RegExp(`// @${escapeRegex(tag)} ${escapeRegex(value)}\n`, 'g'),
    ) ?? []
  );
}

export function template<T extends Record<string, string>>(
  tpl: string,
): (data: T) => string {
  return function (data: T): string {
    return tpl.replace(
      /\$\{([^}]+)\}/g,
      (matched, matchedKey) => data[matchedKey] ?? matched,
    );
  };
}

export function readJSON(vol: Volume, file: string): unknown {
  return JSON.parse(vol.readFileSync(file).toString('utf-8'));
}
