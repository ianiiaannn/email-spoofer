import { createTransport } from 'nodemailer';
import SMTPConnection from 'nodemailer/lib/smtp-connection';
import os from 'os';
import { SMTPServer, SMTPServerAuthentication, SMTPServerSession } from 'smtp-server';
import { Stream } from 'stream';

import { option } from './app';

export const smtp = new SMTPServer({
  logger: true,
  onAuth(auth: SMTPServerAuthentication, session: SMTPServerSession, callback) {
    console.log(`onAuth: ${auth.username} ${auth.password}`);
    callback(null, { user: auth.username });
  }, onData(stream, session, callback) {
    console.log(`onData: ${session}`);
    stream.pipe(process.stdout);
    console.log(`os.hostname:${os.hostname()}`);
    const transporter = createTransport({
      port: 587,
      host: option.to.split('@')[1],
      name: os.hostname(),
    });
    transporter.sendMail({
      from: option.from,
      to: option.to,
      cc: option.cc,
      bcc: option.bcc,
      subject: option.subject,
      text: option.body,
    });
    stream.on('end', callback);
  }, onMailFrom(address, session, callback) {
    callback();
  }, onRcptTo(address, session, callback) {
    callback();
  },
});
