import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // required: true,
    },
    type: {
      type: String,
      enum: [
        "TASK_STATUS_CHANGED",
        "TASK_ASSIGNED",
        "TASK_COMMENT",
        "TASK_DUE_SOON",
        "MENTION",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
    },
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },
    metadata: {
      oldStatus: String,
      newStatus: String,
      taskName: String,
      projectName: String,
      workspaceName: String,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index untuk query yang sering digunakan
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);
