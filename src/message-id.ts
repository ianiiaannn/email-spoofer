// From https://github.com/jordan-wright/email/blob/master/email.go

// generateMessageID generates and returns a string suitable for an RFC 2822
// compliant Message-ID, e.g.:
// <1444789264909237300.3464.1819418242800517193@DESKTOP01>
//
// The following parameters are used to generate a Message-ID:
// - The nanoseconds since Epoch
// - The calling PID
// - A cryptographically random int64
// - The sending hostname
/**
 * Generate a message ID
 * @param {string} hostname - The hostname to use in the Message-ID string
 * @return {string} A valid messageID
 */
export function generateMessageID(hostname: string): String {
  const time: Number = Math.floor(new Date().getTime() / 1000);
  const pid: number = process.pid;
  const randomInt: Number = Math.floor(Math.random() * 2 ^ 53);
  const messageID: string = (`${time}.${pid}.${randomInt}@${hostname}`);
  return messageID;
}
