import Project from "../models/Project.js";
import Workspace from "../models/Workspace.js";
import Group from "../models/Group.js";

export async function getProject(req, res) {
  try {
    const data = await Project.find()
      .populate("workspace", "nama")
      .populate("groups", "nama");
    res.status(200).json(data);
  } catch (error) {
    console.error("Create Workspace Error:", error);
  }
}

export async function createProject(req, res) {
  try {
    const { workspaceId } = req.params;
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res
        .status(404)
        .json({ success: false, message: "Workspace not found" });
    }

    const project = await Project.create({
      ...req.body,
      workspace: workspaceId,
    });
    await Workspace.findByIdAndUpdate(workspaceId, {
      $push: { projects: project._id },
    });

    res.status(201).json({
      success: true,
      message: "Proeject created successfully",
      data: project,
    });
  } catch (error) {
    console.error("Create Workspace Error:", error);
  }
}

export async function updateProject(req, res) {
  try {
    const { projectId } = req.params;
    const { workspaceId, ...updateData } = req.body;

    const oldProject = await Project.findById(projectId);

    if (!oldProject) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    if (workspaceId && workspaceId !== String(oldProject.workspace)) {
      await Workspace.findByIdAndUpdate(oldProject.workspace, {
        $pull: { projects: oldProject._id },
      });

      await Workspace.findByIdAndUpdate(workspaceId, {
        $push: { projects: oldProject._id },
      });
    }

    updateData.workspace = workspaceId || oldProject.workspace;
    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      updateData,
      {
        new: true,
      }
    );

    res.status(200).json({
      success: true,
      message: "Project updated successfully",
      data: updatedProject,
    });
  } catch (error) {
    console.log("Update Project Error:", error);
  }
}

export async function deleteProject(req, res) {
  try {
    const { projectId } = req.params;
    const projectRef = await Project.findById(projectId).select("workspace");

    if (!projectRef) {
      return res.status(404).json({
        success: false,
        message: "Project tidak ditemukan",
      });
    }

    await Group.deleteMany({ project: projectId });

    await Workspace.findByIdAndUpdate(projectRef.workspace, {
      $pull: { projects: projectId },
    });

    await Project.findByIdAndDelete(projectId);

    res.status(200).json({
      success: true,
      message: "Project dan semua group terkait berhasil dihapus",
    });
  } catch (error) {
    console.error("Delete Project Error:", error);
  }
}
