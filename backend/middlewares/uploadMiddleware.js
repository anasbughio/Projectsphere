const multer = require('multer');
const path = require('path');

// Storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Images 'uploads/profiles/' folder mein save hongi
    cb(null, 'uploads/profiles/');
  },
  filename: function (req, file, cb) {
    // Har image ka naam unique bananey ke liye timestamp laga diya
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter taake sirf images upload ho sakein
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Sirf images upload ki ja sakti hain!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: fileFilter
});

module.exports = upload;