const process = require('process');
const io = require('socket.io-client');
const readline = require('readline');
const yargs = require('yargs');
const {hideBin} = require('yargs/helpers');
function printCommandUsage() {
  console.info('Use [EVENT_NAME, ARG1, ARG2, ...] to send an event (in one line).');
}

async function main() {
  const options = yargs(hideBin(process.argv))
    .option('url', {
      description: 'URL of the server',
      type: 'string',
      required: true,
    })
    .help()
    .usage('Socket.IO command line tool.\n' +
      'Usage: URL\n' +
      '  URL: The URL of the Socket.IO server. E.g. ws://localhost:4175')
    .alias('help', 'h');
  const argv = await options.argv;
  const url = argv['url'];
  const rl = readline.createInterface(process.stdin, process.stdout);
  console.info('Connecting to %s', url);
  const socket = io.connect(url);
  printCommandUsage();
  rl.setPrompt('> ');
  rl.prompt();
  rl.on('line', function(line) {
    try {
      line = line.trim();
      if (line.length === 0) {
        return;
      }
      const eventSpec = JSON.parse(line);
      if (!Array.isArray(eventSpec) || eventSpec.length == 0) {
        printCommandUsage();
        return;
      }
      const eventName = eventSpec[0];
      const eventArgs = eventSpec.slice(1);
      socket.emit(eventName, ...eventArgs);
    } catch (err) {
      console.error('Failed to process the line:', err);
    } finally {
      rl.prompt();
    }
  });
  socket.on('connect', function () {
    console.info('connected');
  });
  socket.on('connect_error', (err) => {
    console.error('Got "connect_error":', err);
  });
  socket.on('disconnect', () => {
    console.info('disconnected');
    process.exit(0);
  });
  socket.on('message', (...args) => {
    console.info('Got "message" with arguments ', args);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});