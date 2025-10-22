import mongoose from "mongoose";

const subtaskSchema = new mongoose.Schema(
  {
    nama: { type: String },
    position: { type: Number, default: 0 },
    task: [{ type: mongoose.Schema.Types.ObjectId, ref: "Task" }],
  },
  { timestamps: true }
);

export default mongoose.model("Subtask", subtaskSchema);
