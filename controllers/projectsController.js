import Project from "../models/Project.js";
import Workspace from "../models/Workspace.js";
import Group from "../models/Group.js";

export async function getProject(req, res) {
  try {
    const data = await Project.find()
      .populate("workspace", "nama")
      .populate("groups", "nama");
    res.status(200).json({
      success: true,
      message: "berhasil mengambil data",
      data,
    });
  } catch (error) {
    console.error("Create Workspace Error:", error);
  }
}

export async function createProject(req, res) {
  try {
    const { workspaceId } = req.params;

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found",
      });
    }

    const project = await Project.create({
      ...req.body,
      workspace: workspaceId,
    });

    const defaultGroup = await Group.create({
      nama: "New Group",
      project: project._id,
    });

    project.groups.push(defaultGroup._id);
    await project.save();

    await Workspace.findByIdAndUpdate(workspaceId, {
      $push: { projects: project._id },
    });

    const populatedProject = await Project.findById(project._id).populate({
      path: "groups",
      populate: { path: "task" },
    });

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: populatedProject,
    });
  } catch (error) {
    console.error("Create Project Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create project",
      error: error.message,
    });
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

export async function getProjectById(req, res) {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId).populate(
      "groups",
      "nama"
    );
    res.status(200).json({
      success: true,
      message: "berhasil mengambil data",
      data: project,
    });
  } catch (error) {
    console.log("gagal get by id ", error);
  }
}
