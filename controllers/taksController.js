import Task from "../models/Task.js";
import Group from "../models/Group.js";
import Subtask from "../models/Subtask.js";

export async function getTask(req, res) {
  try {
    const data = await Task.find().populate("subtask", "nama");
    res.status(200).json(data);
  } catch (error) {
    console.error("get task error:", error);
  }
}

export async function createTask(req, res) {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId);
    if (!group) {
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });
    }
    const task = await Task.create({
      ...req.body,
      groups: groupId,
    });
    await Group.findByIdAndUpdate(groupId, {
      $push: { task: task._id },
    });

    res.status(201).json({
      success: true,
      message: "task created successfully",
      data: task,
    });
  } catch (error) {
    console.error("Create task Error:", error);
  }
}

export async function updateTask(req, res) {
  try {
    const { taskId } = req.params;
    const { groupId, position, ...updateData } = req.body;

    const oldTask = await Task.findById(taskId);
    if (!oldTask) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    if (groupId && groupId !== String(oldTask.groups)) {
      await Group.findByIdAndUpdate(oldTask.groups, {
        $pull: { task: oldTask._id },
      });

      await Group.findByIdAndUpdate(groupId, {
        $push: { task: oldTask._id },
      });

      if (position !== undefined) {
        const tasksInNewGroup = await Task.find({ groups: groupId }).sort({
          position: 1,
        });

        const updatePromises = tasksInNewGroup
          .map((task, idx) => {
            if (idx >= position) {
              return Task.findByIdAndUpdate(task._id, {
                position: idx + 1,
              });
            }
            return null;
          })
          .filter(Boolean);

        await Promise.all(updatePromises);
        updateData.position = position;
      }
    }

    updateData.groups = groupId || oldTask.groups;

    const updatedTask = await Task.findByIdAndUpdate(taskId, updateData, {
      new: true,
    });

    res.status(200).json({
      success: true,
      message: "Task updated successfully",
      data: updatedTask,
    });
  } catch (error) {
    console.error("Update Task Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update task",
      error: error.message,
    });
  }
}

export async function updateTaskPositions(req, res) {
  try {
    const { taskIds } = req.body;

    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "taskIds harus berupa array dan tidak boleh kosong",
      });
    }

    const updatePromises = taskIds.map((taskId, index) =>
      Task.findByIdAndUpdate(taskId, { position: index }, { new: true })
    );

    const updatedTasks = await Promise.all(updatePromises);

    res.status(200).json({
      success: true,
      message: "Task positions updated successfully",
      data: updatedTasks,
    });
  } catch (error) {
    console.error("Update Task Positions Error:", error);
    res.status(500).json({
      success: false,
      message: "Gagal update posisi task",
      error: error.message,
    });
  }
}

export async function deleteTask(req, res) {
  try {
    const { taskId } = req.params;
    const task = await Task.findByIdAndDelete(taskId);

    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    await Subtask.deleteMany({ task: taskId });
    await Group.findByIdAndUpdate(task.groups, {
      $pull: { task: task._id },
    });
    res.status(200).json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Delete Task Error:", error);
  }
}

export const getTasksByGroup = async (req, res) => {
  try {
    const { groups } = req.query;
    if (!groups) {
      return res.status(400).json({ message: "groupId wajib disertakan" });
    }
    const tasks = await Task.find({ groups })
      .populate({
        path: "subtask",
        options: { sort: { position: 1 } },
      })
      .sort({ position: 1 });

    res.status(200).json({
      success: true,
      message: "berhasil mengambil data",
      data: tasks,
    });
  } catch (error) {
    console.error("Error getTasksByGroup:", error);
    res.status(500).json({ message: "Gagal memuat task" });
  }
};
