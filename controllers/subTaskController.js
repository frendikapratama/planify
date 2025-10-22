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

export async function updateSubTask(req, res) {
  try {
    const { subTaskId } = req.params;
    const { taskId, ...updateData } = req.body;
    const oldSubTask = await Subtask.findById(subTaskId);
    if (!oldSubTask) {
      return res
        .status(404)
        .json({ success: false, message: "Subtask not found" });
    }
    if (taskId && taskId !== String(oldSubTask.task)) {
      await Task.findByIdAndUpdate(oldSubTask.task, {
        $pull: { subtask: oldSubTask._id },
      });
      await Task.findByIdAndUpdate(taskId, {
        $push: { subtask: oldSubTask._id },
      });
    }
    const updatedSubTask = await Subtask.findByIdAndUpdate(
      subTaskId,
      updateData,
      { new: true }
    );
    res.status(200).json({
      success: true,
      message: "subtask updated successfully",
      data: updatedSubTask,
    });
  } catch (error) {
    console.error("Update subtask Error:", error);
  }
}

export async function deleteSubTask(req, res) {
  try {
    const { subTaskId } = req.params;
    const subtask = await Subtask.findByIdAndDelete(subTaskId);
    if (!subtask) {
      return res
        .status(404)
        .json({ success: false, message: "Subtask not found" });
    }
    await Task.findByIdAndUpdate(subtask.task, {
      $pull: { subtask: subtask._id },
    });
    res.status(200).json({
      success: true,
      message: "subtask deleted successfully",
      data: subtask,
    });
  } catch (error) {
    console.error("Delete subtask Error:", error);
  }
}
