const jwt = require('jsonwebtoken');
require('dotenv').config();

const secret = process.env.JWT_SECRET || 'tvu_itam_secret';
const expiresIn = process.env.JWT_EXPIRES_IN || '24h';

module.exports = {
    sign: (payload) => jwt.sign(payload, secret, { expiresIn }),
    verify: (token) => jwt.verify(token, secret)
};
