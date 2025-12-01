import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
  {
    nama: { type: String },
    description: String,
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
    task: [{ type: mongoose.Schema.Types.ObjectId, ref: "Task" }],
  },
  { timestamps: true }
);

export default mongoose.model("Group", groupSchema);
