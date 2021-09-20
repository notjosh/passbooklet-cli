import { run, subcommands } from 'cmd-ts';
import read from './read';
import modify from './modify';

const packageJson = require('../../package.json');

const cli = async (args: string[]) => {
  const app = subcommands({
    name: packageJson.name,
    cmds: { modify, read },
  });
  await run(app, args);
};

export default cli;
