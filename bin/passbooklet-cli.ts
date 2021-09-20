import cli from '../src/cli/index.js';

(async () => {
  try {
    await cli(process.argv.slice(2));
  } catch (e) {
    console.error(e);
  }
})();
