import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    nama: { type: String },
    description: String,
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
    groups: [{ type: mongoose.Schema.Types.ObjectId, ref: "Group" }],
  },
  { timestamps: true }
);

export default mongoose.model("Project", projectSchema);
