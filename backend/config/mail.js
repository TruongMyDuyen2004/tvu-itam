const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.MAIL_PORT) || 465,
    secure: true,
    requireTLS: true,
    auth: {
        user: process.env.MAIL_USER || '',
        pass: process.env.MAIL_PASS || '',
    },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000,
});

const sendMail = async ({ to, subject, html }) => {
    try {
        const info = await transporter.sendMail({
            from: `"TVU-ITAM" <${process.env.MAIL_USER}>`,
            to,
            subject,
            html,
        });
        console.log('[MAIL] Email sent to ' + to + ': ' + info.messageId);
        return true;
    } catch (err) {
        console.error('[ERROR] Failed to send email:', err.message);
        if (err.response) console.error('   SMTP response:', err.response);
        return false;
    }
};

module.exports = { sendMail };
