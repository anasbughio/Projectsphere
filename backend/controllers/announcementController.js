const Announcement = require('../models/Announcement');

// 1. Create a Global Broadcast (Super Admin only)
exports.createAnnouncement = async (req, res) => {
  try {
    const { title, message, type, targetAudience } = req.body;

    const announcement = await Announcement.create({
      title,
      message,
      type: type || 'info',
      targetAudience: targetAudience || 'all',
      createdBy: req.user._id,
      isActive: true
    });

    res.status(201).json({ message: "Broadcast sent successfully!", announcement });
  } catch (error) {
    console.error("Error creating announcement:", error);
    res.status(500).json({ message: "Failed to send broadcast" });
  }
};

// 2. Fetch Active Announcements for regular users/dashboards
exports.getActiveAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find({ isActive: true }).sort('-createdAt').limit(5);
    res.status(200).json(announcements);
  } catch (error) {
    console.error("Error fetching announcements:", error);
    res.status(500).json({ message: "Failed to fetch announcements" });
  }
};

// 3. Delete / Deactivate Broadcast (Super Admin)
exports.deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    await Announcement.findByIdAndDelete(id);
    res.status(200).json({ message: "Announcement removed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete announcement" });
  }
};