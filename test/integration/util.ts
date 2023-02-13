import { AddressInfo } from 'node:net';
import path from 'node:path';
import { promisify } from 'node:util';

import express, { static as expressStatic } from 'express';
import { createFsFromVolume } from 'memfs';
import { Configuration, webpack } from 'webpack';

import { Volume } from './volume';

export const GLOBAL_FIXTURES_DIR = path.join(__dirname, 'fixtures');

export async function compile(
  input: Volume,
  webpackConfig: Configuration,
): Promise<Volume> {
  const compiler = webpack(webpackConfig);

  const output = new Volume();
  compiler.inputFileSystem = createFsFromVolume(input);
  compiler.intermediateFileSystem = compiler.outputFileSystem =
    createFsFromVolume(output);

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
