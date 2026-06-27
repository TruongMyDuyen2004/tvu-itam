const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/publicController');

router.get('/info', ctrl.getServerInfo);
router.get('/device/:id', ctrl.getById);
router.get('/qr/:code', ctrl.getByCode);

module.exports = router;
