const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.MAIL_PORT) || 465,
    secure: process.env.MAIL_SECURE === 'true' || parseInt(process.env.MAIL_PORT) === 465,
    auth: {
        user: process.env.MAIL_USER || '',
        pass: process.env.MAIL_PASS || '',
    },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 15000,
});

const sendMail = async ({ to, subject, html, text }) => {
    try {
        const info = await transporter.sendMail({
            from: `"TVU-ITAM - Hệ thống Quản lý Tài sản" <${process.env.MAIL_USER}>`,
            to,
            subject,
            html,
            text: text || '',
            replyTo: process.env.MAIL_USER,
            headers: {
                'X-Mailer': 'TVU-ITAM',
                'Precedence': 'bulk',
            },
        });
        console.log('[MAIL] Email sent to ' + to + ': ' + info.messageId);
        return true;
    } catch (err) {
        console.error('[ERROR] Failed to send email to ' + to + ':', err.message);
        if (err.response) console.error('   SMTP response:', err.response);
        return false;
    }
};

module.exports = { sendMail };
