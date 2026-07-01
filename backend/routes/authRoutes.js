const express = require('express');
const router = express.Router();
const { registerOrg, login } = require('../controllers/authController');

router.post('/register', registerOrg);
router.post('/login', login);

module.exports = router;