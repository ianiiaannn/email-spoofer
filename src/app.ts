#! /usr/bin/env node
import { OptionValues, program } from 'commander';
import nodemailer from 'nodemailer';

import { smtp } from './smtp';

program
  .name('email spoofer')
  .description('CLI tool to send emails from any email address')
  .version(process.env.npm_package_version as string);

program
  .option('-h --help', 'Print help message.');
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
  console.log('Email sent successfully.');
  // smtp.close(() => {
  // console.log('SMTP server closed.');
  // });
}).catch((error) => {
  console.error(error);
});
