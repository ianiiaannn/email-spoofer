import SMTPConnection from 'nodemailer/lib/smtp-connection';
import { SMTPServer } from 'smtp-server';

export const smtp = new SMTPServer({
  logger: true,
  onAuth(auth, session, callback) {
    callback(null, { user: auth.username });
  },
});
