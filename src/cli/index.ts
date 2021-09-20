import { configFromEnv } from '../bootstrap';

import {
  array,
  boolean,
  command,
  flag,
  multioption,
  option,
  optional,
  positional,
  run,
  string,
} from 'cmd-ts';
import Passbook from '../model/passbook';

const packageJson = require('../../package.json');

const {
  TEAM_IDENTIFIER,
  PASS_TYPE_IDENTIFIER,
  WWDR_CERTIFICATE_PATH,
  CERTIFICATE_PATH,
} = process.env;

const cli = async (args: string[]) => {
  const app = command({
    name: packageJson.name,
    args: {
      inputPath: positional({
        type: string,
        displayName: 'Input file path',
        description: 'Path to .pkpass file',
      }),
      outputPath: option({
        type: optional(string),
        long: 'output',
        short: 'o',
        description: 'Path to output file',
      }),
      hasDump: flag({
        type: boolean,
        long: 'dump',
        short: 'd',
      }),
      updates: multioption({
        type: array(string),
        long: 'update',
        short: 'u',
      }),
    },
    handler: async ({ inputPath, hasDump, updates, outputPath }) => {
      const config = configFromEnv();
      const passbook = await Passbook.fromFile(inputPath);

      if (hasDump) {
        console.log('Existing values');
        console.log('---------------');

        const entries = Object.entries(await passbook.flattened());
        for (const [key, value] of entries) {
          console.log(`${key}: ${value}`);
        }

        console.log('');
      }

      // rewrite some keys in the pass
      await passbook.update(updates);

      if (outputPath != null) {
        await passbook.save(outputPath, {
          teamIdentifier: config.TEAM_IDENTIFIER,
          passTypeIdentifier: config.PASS_TYPE_IDENTIFIER,
          wwdrCertificatePath: config.WWDR_CERTIFICATE_PATH,
          certificatePath: config.CERTIFICATE_PATH,
        });

        console.log(`written to ${outputPath}`);
      }
    },
  });

  await run(app, args);
};

export default cli;
