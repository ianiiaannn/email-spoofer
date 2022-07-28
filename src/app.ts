#! /usr/bin/env node
import { OptionValues, program } from 'commander';
import nodemailer from 'nodemailer';

import { smtp } from './smtp';
import chalk from 'chalk';

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

//program
//  .option(rainbow.red('-h --help', 'Print help message.'));
//program
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


const option: OptionValues = program.opts();
if (option.help) {
  program.help();
}
smtp.listen(option.port, 'localhost', () => {
  console.log(`SMTP server listening on port ${option.port}`);
});
if (!(option.from && option.to)) {
  console.log('Please provide a from and to email address.');
  process.exit(1);
}
console.log(`Sending email from ${option.from} to ${option.to}`);
nodemailer.createTransport({
  host: 'localhost',
  port: option.port,
  secure: false,
  tls: {
    rejectUnauthorized: false,
  },
  auth: {
    user: 'a',
    pass: 'a',
  },
}).sendMail({
  from: option.from,
  to: option.to,
  cc: option.cc,
  bcc: option.bcc,
  subject: option.subject,
  text: option.body,
}).then((callback) => {
  console.log(callback);
  console.log(`User part done, switch to SMTP server.`);
}).catch((error) => {
  console.error(error);
});

