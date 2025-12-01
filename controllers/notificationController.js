import Notification from "../models/Notification.js";
import { handleError } from "../utils/errorHandler.js";
import {
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from "../helpers/notificationHelper.js";

export async function getNotifications(req, res) {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    const query = { recipient: userId };
    if (unreadOnly === "true") {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .populate("sender", "username email avatar")
      .populate("task", "nama status")
      .populate("workspace", "nama")
      .populate("project", "_id  nama")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Notification.countDocuments(query);
    const unreadCount = await getUnreadCount(userId);

    res.status(200).json({
      success: true,
      data: {
        notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
        unreadCount,
      },
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getUnreadNotificationCount(req, res) {
  try {
    const userId = req.user._id;
    const count = await getUnreadCount(userId);

    res.status(200).json({
      success: true,
      data: {
        unreadCount: count,
      },
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function markNotificationAsRead(req, res) {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;

    const notification = await markAsRead(notificationId, userId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    const unreadCount = await getUnreadCount(userId);

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      data: {
        notification,
        unreadCount,
      },
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function markAllNotificationsAsRead(req, res) {
  try {
    const userId = req.user._id;

    await markAllAsRead(userId);
    const unreadCount = await getUnreadCount(userId);

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      data: {
        unreadCount,
      },
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deleteNotification(req, res) {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: userId,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deleteAllReadNotifications(req, res) {
  try {
    const userId = req.user._id;

    const result = await Notification.deleteMany({
      recipient: userId,
      isRead: true,
    });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} notifications deleted successfully`,
      data: {
        deletedCount: result.deletedCount,
      },
    });
  } catch (error) {
    return handleError(res, error);
  }
}
