import { command, positional, string } from 'cmd-ts';
import Passbook from '../model/passbook/index.js';

const verify = command({
  name: 'verify',
  description: 'Verify the signature & manifest in a .pkpass file',
  args: {
    inputPath: positional({
      type: string,
      displayName: 'Input file path',
      description: 'Path to .pkpass file',
    }),
  },
  handler: async ({ inputPath }) => {
    const passbook = await Passbook.fromFile(inputPath);

    const errors = await passbook.validate();

    if (errors.length > 0) {
      console.error(errors.join('\n'));
    }

    console.log({ errors });

    /*
    reference from Apple, via: https://github.com/soulaway/WalletCompanionFiles/blob/d893d92a5a220a84288be25c3ce1b3d02159783d/WalletCompanionFiles/signpass/signpass/PassSigner.m

    Signature valid.
    Certificates: (
        0: Apple Worldwide Developer Relations Certification Authority
        1: Pass Type ID: pass.jan.klausa.did.something
    )
    Trust chain is valid.
    */

    // validate manifest

    // validate signature
  },
});

export default verify;
