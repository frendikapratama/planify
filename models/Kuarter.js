import mongoose from "mongoose";
const kuarterSchema = new mongoose.Schema(
  {
    nama: {
      type: String,
    },
    workspace: [{ type: mongoose.Schema.Types.ObjectId, ref: "Workspace" }],
    departemen: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("Kuarter", kuarterSchema);
