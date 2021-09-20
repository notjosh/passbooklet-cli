import { command, positional, string } from 'cmd-ts';
import Passbook from '../model/passbook';

const read = command({
  name: 'modify',
  description: 'Read all keys and values from a .pkpass',
  args: {
    inputPath: positional({
      type: string,
      displayName: 'Input file path',
      description: 'Path to .pkpass file',
    }),
  },
  handler: async ({ inputPath }) => {
    const passbook = await Passbook.fromFile(inputPath);

    console.log('Existing values');
    console.log('---------------');

    const entries = Object.entries(await passbook.flattened());
    for (const [key, value] of entries) {
      console.log(`${key}: ${value}`);
    }
  },
});

export default read;
