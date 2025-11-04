import Workspace from "../models/Workspace.js";
import Task from "../models/Task.js";
import Group from "../models/Group.js";
import Project from "../models/Project.js";

export async function validateWorkspaceAccess(workspaceId, userId) {
  const workspace = await Workspace.findById(workspaceId).populate("members");

  if (!workspace) {
    return {
      valid: false,
      status: 404,
      message: "Workspace tidak ditemukan",
    };
  }

  const isAuthorized =
    workspace.owner.toString() === userId.toString() ||
    workspace.members.some((m) => m._id.toString() === userId.toString());

  if (!isAuthorized) {
    return {
      valid: false,
      status: 403,
      message: "Anda tidak memiliki akses ke workspace ini",
    };
  }

  return { valid: true, workspace };
}

export async function getWorkspaceFromTask(taskId) {
  const task = await Task.findById(taskId).populate("groups");
  if (!task) {
    return { success: false, status: 404, message: "Task tidak ditemukan" };
  }

  const group = await Group.findById(task.groups).populate("project");
  if (!group || !group.project) {
    return {
      success: false,
      status: 404,
      message: "Group atau Project tidak ditemukan",
    };
  }

  const project = await Project.findById(group.project).populate("workspace");
  if (!project || !project.workspace) {
    return {
      success: false,
      status: 404,
      message: "Project atau Workspace tidak ditemukan",
    };
  }

  return {
    success: true,
    workspace: project.workspace,
    project: project,
    group: group,
    task: task,
  };
}
