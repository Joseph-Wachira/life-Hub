/**
 * Outbound transactional email. No provider is wired up here — this logs
 * the message to the server console instead, which is enough to exercise
 * the password-reset flow end-to-end in dev without an email account.
 *
 * Before shipping to real users, swap the body of `sendEmail` for a real
 * provider (Resend, Postmark, SES, SMTP via nodemailer, ...); nothing else
 * in the password-reset flow needs to change, since callers only depend on
 * this function's signature.
 */
export async function sendEmail(to: string, subject: string, body: string): Promise<void> {
  console.log(`[email] To: ${to}\nSubject: ${subject}\n\n${body}`);
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  await sendEmail(
    to,
    "Reset your Life Hub password",
    `We received a request to reset your Life Hub password.\n\nReset it here (valid for 1 hour):\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.`
  );
}
