import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    kuarter: { type: mongoose.Schema.Types.ObjectId, ref: "Kuarter" },
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
    group: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },
    task: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
    subtask: { type: mongoose.Schema.Types.ObjectId, ref: "Subtask" },
    action: {
      type: String,
      enum: [
        "CREATE_TASK",
        "UPDATE_TASK",
        "DELETE_TASK",
        "CREATE_GROUP",
        "UPDATE_GROUP",
        "DELETE_GROUP",
        "CHANGE_STATUS",
        "ASSIGN_USER",
        "REMOVE_USER",
        "COMMENT",
        "UPLOAD_FILE",
        "MOVE_TASK",
      ],
      required: true,
    },
    description: { type: String },
    before: { type: Object },
    after: { type: Object },
  },
  { timestamps: true }
);

activitySchema.index({ group: 1, createdAt: -1 });
activitySchema.index({ project: 1, createdAt: -1 });
activitySchema.index({ user: 1, createdAt: -1 });
activitySchema.index({ workspace: 1, createdAt: -1 });
export default mongoose.model("Activity", activitySchema);
