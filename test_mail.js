const nodemailer = require('nodemailer');
require('dotenv').config({ path: './backend/.env' });

console.log('Testing nodemailer...');
console.log('MAIL_HOST:', process.env.MAIL_HOST);
console.log('MAIL_PORT:', process.env.MAIL_PORT);
console.log('MAIL_USER:', process.env.MAIL_USER);

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.MAIL_PORT) || 587,
    secure: process.env.MAIL_SECURE === 'true',
    auth: {
        user: process.env.MAIL_USER || '',
        pass: process.env.MAIL_PASS || '',
    },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000,
    debug: true,
    logger: true,
});

async function test() {
    console.log('Verifying connection...');
    try {
        const ok = await transporter.verify();
        console.log('Verification result:', ok);
    } catch (err) {
        console.error('Verification failed:', err.message);
    }
    
    console.log('Sending test email...');
    try {
        const info = await transporter.sendMail({
            from: `"TVU-ITAM" <${process.env.MAIL_USER}>`,
            to: process.env.MAIL_USER,
            subject: 'Test email from TVU-ITAM',
            text: 'Test.'
        });
        console.log('Email sent:', info.messageId, info.response);
    } catch (err) {
        console.error('Send failed:', err.message);
        if (err.response) console.error('SMTP response:', err.response);
        if (err.code) console.error('Error code:', err.code);
    }
}

test();
