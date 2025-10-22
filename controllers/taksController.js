import Task from "../models/Task.js";
import Group from "../models/Group.js";

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

// export async function updateProject(req, res) {
//   try {
//     const { projectId } = req.params;
//     const { workspaceId, ...updateData } = req.body;

//     const oldProject = await Project.findById(projectId);

//     if (!oldProject) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Project not found" });
//     }

//     if (workspaceId && workspaceId !== String(oldProject.workspace)) {
//       await Workspace.findByIdAndUpdate(oldProject.workspace, {
//         $pull: { projects: oldProject._id },
//       });

//       await Workspace.findByIdAndUpdate(workspaceId, {
//         $push: { projects: oldProject._id },
//       });
//     }

//     updateData.workspace = workspaceId || oldProject.workspace;
//     const updatedProject = await Project.findByIdAndUpdate(
//       projectId,
//       updateData,
//       {
//         new: true,
//       }
//     );

//     res.status(200).json({
//       success: true,
//       message: "Project updated successfully",
//       data: updatedProject,
//     });
//   } catch (error) {
//     console.log("Update Project Error:", error);
//   }
// }

// export async function deleteProject(req, res) {
//   try {
//     const { projectId } = req.params;
//     const projectRef = await Project.findById(projectId).select("workspace");

//     if (!projectRef) {
//       return res.status(404).json({
//         success: false,
//         message: "Project tidak ditemukan",
//       });
//     }

//     await Group.deleteMany({ project: projectId });

//     await Workspace.findByIdAndUpdate(projectRef.workspace, {
//       $pull: { projects: projectId },
//     });

//     await Project.findByIdAndDelete(projectId);

//     res.status(200).json({
//       success: true,
//       message: "Project dan semua group terkait berhasil dihapus",
//     });
//   } catch (error) {
//     console.error("Delete Project Error:", error);
//   }
// }

export async function updateTask(req, res) {
  try {
    const { taskId } = req.params;
    const { groupId, ...updateData } = req.body;

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
  }
}
