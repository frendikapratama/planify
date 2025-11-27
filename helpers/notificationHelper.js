import Notification from "../models/Notification.js";

export async function createTaskDueSoonNotification({
  taskId,
  taskName,
  workspaceId,
  workspaceName,
  projectId,
  projectName,
  recipients,
  dueDate,
  status,
  daysRemaining,
}) {
  try {
    // Buat pesan yang dinamis berdasarkan sisa hari
    let urgencyMessage = "";
    if (daysRemaining === 1) {
      urgencyMessage = "besok";
    } else if (daysRemaining === 7) {
      urgencyMessage = "dalam 1 minggu";
    } else {
      urgencyMessage = `dalam ${daysRemaining} hari`;
    }

    const notifications = recipients.map((recipientId) => ({
      recipient: recipientId,
      type: "TASK_DUE_SOON",
      title: "Task Akan Jatuh Tempo",
      message: `Task "${taskName}" akan jatuh tempo ${urgencyMessage} (${new Date(
        dueDate
      ).toLocaleDateString("id-ID")}) dan masih berstatus ${status}`,
      task: taskId,
      workspace: workspaceId,
      project: projectId,
      metadata: {
        taskName,
        projectName,
        workspaceName,
        dueDate,
        status,
        daysRemaining,
      },
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    return notifications;
  } catch (error) {
    console.error("Error creating task due soon notification:", error);
    throw error;
  }
}

export async function createTaskStatusNotification({
  taskId,
  taskName,
  workspaceId,
  workspaceName,
  projectId,
  projectName,
  senderId,
  senderName,
  recipients,
  oldStatus,
  newStatus,
}) {
  try {
    const notifications = recipients
      .filter((recipientId) => recipientId.toString() !== senderId.toString())
      .map((recipientId) => ({
        recipient: recipientId,
        sender: senderId,
        type: "TASK_STATUS_CHANGED",
        title: "Status Task Diupdate",
        message: `${senderName} mengubah status task "${taskName}" dari ${oldStatus} menjadi ${newStatus}`,
        task: taskId,
        workspace: workspaceId,
        project: projectId,
        metadata: {
          oldStatus,
          newStatus,
          taskName,
          projectName,
          workspaceName,
        },
      }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    return notifications;
  } catch (error) {
    console.error("Error creating task status notification:", error);
    throw error;
  }
}

export async function createTaskAssignmentNotification({
  taskId,
  taskName,
  workspaceId,
  workspaceName,
  projectId,
  projectName,
  senderId,
  senderName,
  recipientId,
}) {
  try {
    const notification = await Notification.create({
      recipient: recipientId,
      sender: senderId,
      type: "TASK_ASSIGNED",
      title: "Task Baru Ditugaskan",
      message: `${senderName} menugaskan Anda pada task "${taskName}"`,
      task: taskId,
      workspace: workspaceId,
      project: projectId,
      metadata: {
        taskName,
        projectName,
        workspaceName,
      },
    });

    return notification;
  } catch (error) {
    console.error("Error creating task assignment notification:", error);
    throw error;
  }
}

export async function getUnreadCount(userId) {
  try {
    const count = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });
    return count;
  } catch (error) {
    console.error("Error getting unread count:", error);
    return 0;
  }
}

export async function markAsRead(notificationId, userId) {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        recipient: userId,
      },
      {
        isRead: true,
        readAt: new Date(),
      },
      { new: true }
    );
    return notification;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
}

export async function markAllAsRead(userId) {
  try {
    const result = await Notification.updateMany(
      {
        recipient: userId,
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      }
    );
    return result;
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    throw error;
  }
}
