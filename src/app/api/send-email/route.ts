// @ts-ignore
import * as nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const { to: rawTo, subject, text, html, replyTo } = await req.json();
    
    // Automatically use ADMIN_EMAIL if the recipient is "admin"
    const to = rawTo === 'admin' ? process.env.ADMIN_EMAIL : rawTo;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to,
      subject,
      text,
      html,
      replyTo: replyTo || undefined,
    };

    await transporter.sendMail(mailOptions);

    return Response.json({ message: 'Email sent successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error sending email:', error);
    return Response.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
