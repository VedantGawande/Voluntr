import Notification from "../models/Notification.js";

export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(100);
    return res.json(notifications);
  } catch (error) {
    console.error("NOTIFICATIONS ERROR:", error);
    return res.status(500).json({ message: "Could not load notifications." });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: "Notification not found." });
    return res.json(notification);
  } catch (error) {
    console.error("MARK NOTIFICATION READ ERROR:", error);
    return res.status(500).json({ message: "Could not update notification." });
  }
};

export const markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
    return res.json({ message: "All notifications marked as read." });
  } catch (error) {
    console.error("MARK ALL READ ERROR:", error);
    return res.status(500).json({ message: "Could not update notifications." });
  }
};
