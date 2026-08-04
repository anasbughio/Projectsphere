const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { addVaultItem, getProjectVault, deleteVaultItem } = require('../controllers/vaultController');

router.post('/', protect, addVaultItem);
router.get('/:projectId', protect, getProjectVault);
router.delete('/:id', protect, deleteVaultItem);

module.exports = router;