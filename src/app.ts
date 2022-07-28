#! /usr/bin/env node
import chalk from 'chalk';
import { OptionValues, program } from 'commander';
import dns, { MxRecord } from 'dns';
import net from 'net';

const rainbow = {
  red: chalk.rgb(193, 57, 94),
  green: chalk.rgb(174, 193, 123),
  yellow: chalk.rgb(240, 202, 80),
  orange: chalk.rgb(224, 123, 66),
  blue: chalk.rgb(137, 167, 194),
};

program
  .name('email-spoofer')
  .description('CLI tool to send emails from any email address')
  .version(process.env.npm_package_version as string);

// program
//  .option(rainbow.red('-h --help', 'Print help message.'));
// program
//  .option('%c-h --help', 'color: red');
program
  .option('-h --help', rainbow.red('Print help message.'));
program
  .option('-f --from <string>', rainbow.green('Email address to send from.'));
program
  .option('-t --to <string>', rainbow.yellow('Email address to send to.'));
program
  .option('--cc [string]', rainbow.orange('cc email address.'));
program
  .option('--bcc [string]', rainbow.blue('bcc email address.'));

program
  .option('--subject [string]', 'Subject of the email.');
program
  .option('--body [string]', 'Body of the email.');

program
  .option('-p --port [number]', 'Port to host SMTP server on.', '25');
// .option('--attachment [string]', 'Attachment to send with the email.');
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
