import cli from '../src/cli/index.js';

// catch uncaught node exceptions
process.on('uncaughtException', (err) => {
  console.error(err);
  process.exit(1);
});

(async () => {
  try {
    await cli(process.argv.slice(2));
  } catch (e) {
    console.log('Error:');
    console.error(e);
  }
})();
