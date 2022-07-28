#! /usr/bin/env node
import chalk from 'chalk';
import { OptionValues, program } from 'commander';
import dns, { MxRecord } from 'dns';
import net from 'net';

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
  .option(rainbow.red+'-h --help', rainbow.space+'Print help message.');
program
  .option(rainbow.green+'-f --from <string>', rainbow.space+'Email address to send from.');
program
  .option(rainbow.yellow+'-t --to <string>', rainbow.space+'Email address to send to.');
//program
  //.option(rainbow.blue+'--cc \x5bstring]', rainbow.space+'cc email address.');
//program
//  .option('--bcc [string]', rainbow.blue('bcc email address.'));

program
  .option('--subject [string]', 'Subject of the email.');
program
  .option('--body [string]', 'Body of the email.');
program
  .option('-p --port [number]', 'Port to host SMTP server on.', '25');
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

// Note: option.to trigger some strange SMTP things.
dns.resolveMx(option.from.split('@')[1], (err, address: MxRecord[]) => {
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
  const payload: string[] = [
    `HELO ${server}`,
    // `STARTSSL`,
    `MAIL FROM: <${option.from}>`,
    `RCPT TO: <${option.to}>`,
    `DATA`,
    `Subject: ${option.subject || 'No Subject'}
From: <${option.from}>
To: <${option.to}>
Cc: <${option.cc || ''}>
Bcc: <${option.bcc || ''}>
${option.body || ''}
${CRLF}.`,
    /* 'DATA\r\n.\r\n',*/
    `QUIT`,
  ];
  let index: number = 0;
  socket.on('data', (data: Buffer) => {
    const response: string = data.toString();
    console.log(response);
    if (index <= payload.length) {
      socket.write(`${payload[index]}${CRLF}`);
      console.log(`> ${payload[index]}`);
      index++;
    }
  });
});
