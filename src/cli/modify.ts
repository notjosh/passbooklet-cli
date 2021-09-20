import { array, command, multioption, positional, string } from 'cmd-ts';
import { configFromEnv } from '../bootstrap.js';
import Passbook from '../model/passbook/index.js';

const modify = command({
  name: 'modify',
  args: {
    inputPath: positional({
      type: string,
      displayName: 'Input file path',
      description: 'Path to .pkpass file',
    }),
    outputPath: positional({
      type: string,
      displayName: 'Output file path',
      description: 'Path to output file',
    }),
    updates: multioption({
      type: array(string),
      long: 'update',
      short: 'u',
      description: 'Key/value to update (i.e. "-u somekey=newvalue")',
    }),
  },
  handler: async ({ inputPath, outputPath, updates }) => {
    const config = configFromEnv();
    const passbook = await Passbook.fromFile(inputPath);

    // rewrite some keys in the pass
    await passbook.update(updates);

    // TODO: validate JSON values are still valid (i.e. strings still strings, constants still constants)

    await passbook.save(outputPath, {
      teamIdentifier: config.TEAM_IDENTIFIER,
      passTypeIdentifier: config.PASS_TYPE_IDENTIFIER,
      wwdrCertificatePath: config.WWDR_CERTIFICATE_PATH,
      certificatePath: config.CERTIFICATE_PATH,
    });

    console.log(`written to ${outputPath}`);
  },
});

export default modify;
