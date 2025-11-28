import cron from "node-cron";
import Task from "../models/Task.js";
import Group from "../models/Group.js";
import { createTaskDueSoonNotification } from "../helpers/notificationHelper.js";
import { emitNotificationToUser } from "../sockets/socketHandler.js";
import { handleError } from "../utils/errorHandler.js";

export function startTaskDueNotificationJob(io) {
  // Jalankan setiap hari  menit - jam
  cron.schedule("34 8 * * *", async () => {
    try {
      console.log("Running task due date notification check...");

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const daysToCheck = [7, 4, 2, 1];

      for (const days of daysToCheck) {
        const targetDate = new Date(today);
        targetDate.setDate(targetDate.getDate() + days);

        const targetDateEnd = new Date(targetDate);
        targetDateEnd.setHours(23, 59, 59, 999);

        // Cari task yang due date-nya sesuai dengan target hari
        const tasks = await Task.find({
          due_date: {
            $gte: targetDate,
            $lte: targetDateEnd,
          },
          status: { $in: ["Done", "In Progress", "To Do"] },
          pic: { $exists: true, $not: { $size: 0 } },
        }).populate({
          path: "groups",
          populate: {
            path: "project",
            populate: {
              path: "workspace",
              select: "nama",
            },
          },
        });

        console.log(`Found ${tasks.length} tasks due in ${days} day(s)`);

        for (const task of tasks) {
          const group = Array.isArray(task.groups)
            ? task.groups[0]
            : task.groups;

          if (!group?.project?.workspace) continue;

          const notifications = await createTaskDueSoonNotification({
            taskId: task._id,
            taskName: task.nama,
            workspaceId: group.project.workspace._id,
            workspaceName: group.project.workspace.nama,
            projectId: group.project._id,
            projectName: group.project.nama,
            recipients: task.pic,
            dueDate: task.due_date,
            status: task.status,
            daysRemaining: days,
          });

          // Emit socket notifications
          notifications.forEach((notification) => {
            emitNotificationToUser(io, notification.recipient, {
              _id: notification._id,
              type: notification.type,
              title: notification.title,
              message: notification.message,
              metadata: notification.metadata,
              task: notification.task,
              isRead: false,
              createdAt: new Date(),
            });
          });
        }
      }

      console.log("Task due date notification check completed");
    } catch (error) {
      console.error("Error in task due notification job:", error);
    }
  });

  console.log("Task due notification job scheduled (runs daily )");
}
