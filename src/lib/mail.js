import nodemailer from 'nodemailer';

export const sendEmail = async ({ to, subject, html, attachments = [] }) => {
    console.log('Mail Config:', {
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: process.env.EMAIL_SECURE,
        user: process.env.EMAIL_USER
    });

    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: `"Touches D'Art" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
        attachments,
    };

    return await transporter.sendMail(mailOptions);
};
