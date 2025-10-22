import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    nama: { type: String },
    description: String,
    groups: [{ type: mongoose.Schema.Types.ObjectId, ref: "Group" }],
    subtask: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subtask" }],
  },
  { timestamps: true }
);

export default mongoose.model("Task", taskSchema);
