import Activity from "../models/Activity.js";
import Task from "../models/Task.js";
import Group from "../models/Group.js";
import Project from "../models/Project.js";
import Workspace from "../models/Workspace.js";

export async function createActivity({
  user,
  kuarter,
  workspace,
  project,
  group,
  task,
  action,
  description,
  before,
  after,
}) {
  try {
    let finalWorkspace = workspace;
    let finalKuarter = kuarter;

    if (task && !workspace) {
      const taskData = await Task.findById(task).populate({
        path: "groups",
        populate: {
          path: "project",
          populate: {
            path: "workspace",
            populate: { path: "kuarter" },
          },
        },
      });

      if (taskData?.groups?.[0]) {
        finalWorkspace = taskData.groups[0].project.workspace._id;
        finalKuarter = taskData.groups[0].project.workspace.kuarter;
      }
    }

    // Jika group ada, fetch workspace dari hierarchy
    if (group && !workspace) {
      const groupData = await Group.findById(group).populate({
        path: "project",
        populate: {
          path: "workspace",
          populate: { path: "kuarter" },
        },
      });

      if (groupData?.project) {
        finalWorkspace = groupData.project.workspace._id;
        finalKuarter = groupData.project.workspace.kuarter;
      }
    }

    return await Activity.create({
      user,
      kuarter: finalKuarter,
      workspace: finalWorkspace,
      project,
      group,
      task,
      action,
      description,
      before,
      after,
    });
  } catch (err) {
    console.error("Activity Log Error:", err.message);
  }
}
