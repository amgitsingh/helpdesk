import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function sendEmail(opts: {
  to: string;
  toName: string;
  subject: string;
  text: string;
}): Promise<void> {
  await sgMail.send({
    to: { email: opts.to, name: opts.toName },
    from: { email: process.env.SENDGRID_FROM_EMAIL!, name: 'Arkitek Support' },
    subject: opts.subject,
    text: opts.text,
  });
}
