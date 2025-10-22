import mongoose from "mongoose";

const subtaskSchema = new mongoose.Schema(
  {
    nama: { type: String },
    description: String,
    task: [{ type: mongoose.Schema.Types.ObjectId, ref: "Task" }],
  },
  { timestamps: true }
);

export default mongoose.model("Subtask", subtaskSchema);
