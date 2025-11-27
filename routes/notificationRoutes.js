// routes/notificationRoutes.js
import express from "express";
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllReadNotifications,
} from "../controllers/notificationController.js";

import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// Get all notifications
router.get("/", authenticate, getNotifications);

// Get unread count
router.get("/unread-count", authenticate, getUnreadNotificationCount);

// Mark notification as read
router.patch("/:notificationId/read", authenticate, markNotificationAsRead);

// Mark all as read
router.patch("/read-all", authenticate, markAllNotificationsAsRead);

// Delete notification
router.delete("/:notificationId", authenticate, deleteNotification);

// Delete all read notifications
router.delete("/read/all", authenticate, deleteAllReadNotifications);

export default router;
