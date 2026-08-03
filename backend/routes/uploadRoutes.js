const express = require('express');
const router = express.Router();
const upload = require('../config/multerConfig');

router.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
  res.json({ filePath: `/uploads/${req.file.filename}` });
});

module.exports = router;