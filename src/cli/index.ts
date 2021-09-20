import { run, subcommands } from 'cmd-ts';
import read from './read.js';
import modify from './modify.js';
import verify from './verify.js';

import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const packageJson = JSON.parse(
  fs.readFileSync(__dirname + '/../../package.json', 'utf-8')
);

const cli = async (args: string[]) => {
  const app = subcommands({
    name: packageJson.name,
    cmds: { modify, read, verify },
  });
  await run(app, args);
};

export default cli;
