import Activity from "../models/Activity.js";

export async function getActivityByProject(req, res) {
  try {
    const { projectId } = req.params;

    const logs = await Activity.find({ project: projectId })
      .populate("user", "username email")
      .populate("task", "nama")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getAllActivity(req, res) {
  try {
    const logs = await Activity.find()
      .populate("user", "username email")
      .populate("project", "nama")
      .populate("task", "nama")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getActivityByUser(req, res) {
  try {
    const { userId } = req.params;

    const logs = await Activity.find({ user: userId })
      .populate("project", "nama")
      .populate("task", "nama")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
