import { readFile } from 'fs/promises';
import { type Certificate } from 'pkijs';
import certificateFromBuffer from './certificate-from-buffer';
import readPEM, { PEMContentKind } from './read-pem';

// note: only expects one Certificate in a file. and is
// therefore quite fragile for general usage, clearly.
export default async (path: string): Promise<Certificate> => {
  const contents = await readFile(path, 'utf-8');
  const buffer = await readPEM(contents, PEMContentKind.Certificate);
  return certificateFromBuffer(buffer);
};
