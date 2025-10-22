import mongoose from "mongoose";

const workspaceSchema = new mongoose.Schema(
  {
    nama: {
      type: String,
    },
    projects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Project" }],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Workspace", workspaceSchema);
