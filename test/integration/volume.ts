import { createFsFromVolume as memfsCreateFsFromVolume } from 'memfs';
import { Volume } from 'memfs/lib/volume';
import { InputFileSystem, OutputFileSystem } from 'webpack';

export const createFsFromVolume = memfsCreateFsFromVolume as unknown as (
  ...args: Parameters<typeof memfsCreateFsFromVolume>
) => Volume & InputFileSystem & OutputFileSystem;

export { Volume };
