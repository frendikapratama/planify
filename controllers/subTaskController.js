import Subtask from "../models/Subtask.js";
import Task from "../models/Task.js";

export async function getSubTask(req, res) {
  try {
    const data = await Subtask.find().populate("task", "nama");
    res.status(200).json(data);
  } catch (error) {
    console.error("get subtask error:", error);
  }
}

export async function createSubTask(req, res) {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId);
    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }
    const subtask = await Subtask.create({
      ...req.body,
      task: taskId,
    });
    await Task.findByIdAndUpdate(taskId, {
      $push: { subtask: subtask._id },
    });
    res.status(201).json({
      success: true,
      message: "subtask created successfully",
      data: subtask,
    });
  } catch (error) {
    console.error("Create subtask Error:", error);
  }
}
