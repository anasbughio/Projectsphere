const Wiki = require('../models/Wiki');

exports.getProjectWiki = async (req, res) => {
  try {
    const { projectId } = req.params;
    let wiki = await Wiki.findOne({ projectId }).populate('lastUpdatedBy', 'name');
    
    // If no wiki exists for this project yet, generate a blank one automatically
    if (!wiki) {
      wiki = await Wiki.create({ projectId });
    }
    
    res.json(wiki);
  } catch (error) {
    console.error('Wiki Fetch Error:', error);
    res.status(500).json({ message: 'Failed to fetch project wiki' });
  }
};

exports.updateProjectWiki = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { content } = req.body;

    const wiki = await Wiki.findOneAndUpdate(
      { projectId },
      { content, lastUpdatedBy: req.user._id },
      { new: true, upsert: true }
    ).populate('lastUpdatedBy', 'name');

    res.json({ message: 'Wiki saved successfully', wiki });
  } catch (error) {
    console.error('Wiki Save Error:', error);
    res.status(500).json({ message: 'Failed to save wiki content' });
  }
};