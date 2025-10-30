import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    nama: { type: String },
    description: String,
    status: { type: String, default: "Not Started" },
    start_date: { type: Date },
    priority: { type: String },
    position: { type: Number, default: 0 },
    groups: [{ type: mongoose.Schema.Types.ObjectId, ref: "Group" }],
    subtask: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subtask" }],
  },
  { timestamps: true }
);

export default mongoose.model("Task", taskSchema);
