const VaultItem = require('../models/VaultItem');
const { encrypt, decrypt } = require('../utils/encryption');

exports.addVaultItem = async (req, res) => {
  try {
    const { projectId, title, username, value } = req.body;

    // Encrypt the sensitive value before it touches the database
    const { iv, encryptedData } = encrypt(value);

    const newItem = await VaultItem.create({
      projectId,
      organizationId: req.user.organizationId,
      title,
      username,
      encryptedValue: encryptedData,
      iv,
      createdBy: req.user._id
    });

    res.status(201).json({ message: 'Credential secured successfully', item: newItem });
  } catch (error) {
    console.error('Vault encryption error:', error);
    res.status(500).json({ message: 'Failed to secure credential' });
  }
};

exports.getProjectVault = async (req, res) => {
  try {
    const { projectId } = req.params;
    const items = await VaultItem.find({ projectId, organizationId: req.user.organizationId });

    // Decrypt the values before sending them back to the authorized frontend
    const decryptedItems = items.map(item => ({
      _id: item._id,
      title: item.title,
      username: item.username,
      value: decrypt(item.encryptedValue, item.iv),
      createdAt: item.createdAt
    }));

    res.json(decryptedItems);
  } catch (error) {
    console.error('Vault decryption error:', error);
    res.status(500).json({ message: 'Failed to retrieve credentials' });
  }
};

exports.deleteVaultItem = async (req, res) => {
  try {
    await VaultItem.findOneAndDelete({ _id: req.params.id, organizationId: req.user.organizationId });
    res.json({ message: 'Credential deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete credential' });
  }
};