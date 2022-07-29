#! /usr/bin/env node
import { OptionValues, program } from 'commander';
import dns, { MxRecord } from 'dns';
import figlet from 'figlet';
import gradient from 'gradient-string';
import net from 'net';

import { generateMessageID } from './message-id.js';

const rainbow = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  space: '     ',
};

program
  .name('email-spoofer')
  .description('CLI tool to send emails from any email address')
  .version(process.env.npm_package_version as string);

program
  .option(rainbow.red + '-h --help', rainbow.space + 'Print help message.');
program
  .requiredOption(rainbow.green + '-f --from <string>', rainbow.space + 'Email address to send from.');
program
  .option(rainbow.yellow + '-t --to <string>', rainbow.space + 'Email address to send to.');

program
  .option(`-s --smtp [string]`, `SMTP server to use. (Default: from email domain)`);
// program
// .option(rainbow.blue+'--cc \x5bstring]', rainbow.space+'cc email address.');
program
  .option('--bcc [string]', 'bcc email address.');

program
  .option('--subject [string]', 'Subject of the email.');
program
  .option('--body [string]', 'Body of the email.');
program
  .option('-p --port [number]', 'Port to host SMTP server on.', '25');

program
  .option('--username', 'Username for SMTP server.');
program
  .option('--password', 'Password for SMTP server.');
// .option('--attachment [string]', 'Attachment to send with the email.');
console.log(rainbow.blue);
program.parse();


export const option: OptionValues = program.opts();
if (option.help) {
  program.help();
}
if (!(option.from && option.to)) {
  console.log('Please provide a from and to email address.');
  process.exit(1);
}

if (!option.smtp) {
  option.smtp = option.to.split('@')[1];
}

dns.resolveMx(option.smtp, (err, address: MxRecord[]) => {
  if (err) {
    console.log('Please check your internet connection.');
    process.exit(1);
  }
  const server: string = address[0].exchange;
  console.log(server);
  const socket = net.createConnection(
    option.port,
    server, () => {
      console.log(`Connected to ${server} on port ${option.port}`);
    });
  const CRLF: string = '\r\n';
  const payload: string[] = [`HELO ${server}`];
  if (option.username && option.password) {
    payload.push(`STARTTLS`);
    payload.push(`AUTH`);
    payload.push(`${option.username.toString('base64')}`);
    payload.push(`${option.password.toString('base64')}`);
  }
  payload.push(`MAIL FROM: <${option.from}>`);
  payload.push(`RCPT TO: <${option.to}>`);
  payload.push(`DATA
From: ${option.from}
To: ${option.to}`);
  if (option.cc) {
    payload[payload.length - 1] += (`Cc: ${option.cc}`);
  }
  if (option.bcc) {
    payload[payload.length - 1] += (`Bcc: ${option.bcc}`);
  }
  payload[payload.length - 1] += (`
Message-ID: <${ generateMessageID(option.from.split('@')[1])}>
Subject: ${ option.subject }

${ option.body }

${ CRLF }.`);
  payload.push(`QUIT`);
  let index: number = 0;
  socket.on('data', (data: Buffer) => {
    const response: string = data.toString();
    console.log(response);
    if (index <= payload.length) {
      socket.write(`${ payload[index] }${ CRLF } `);
      console.log(`> ${ payload[index] } `);
      index++;
    } else {
      socket.end();
    }
  });
});
