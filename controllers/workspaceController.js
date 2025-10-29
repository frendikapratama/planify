import Workspaces from "../models/Workspace.js";
import Project from "../models/Project.js";
import Group from "../models/Group.js";

export async function getWorkspace(req, res) {
  try {
    const data = await Workspaces.find().populate("projects", "nama");
    res.status(200).json({
      success: true,
      message: "workspace berhasil dibuat",
      data,
    });
  } catch (error) {
    console.error("Create Workspace Error:", error);
  }
}

export async function getWorkspaceById(req, res) {
  try {
    const { workspaceId } = req.params;
    const workspace = await Workspaces.findById(workspaceId).populate({
      path: "projects",
      select: "nama createdAt",
      options: { sort: { createdAt: -1 } },
    });
    res.status(200).json({
      success: true,
      message: "workspace berhasil dibuat",
      data: workspace,
    });
  } catch (error) {
    console.error("Get Workspace By ID Error:", error);
  }
}

export async function createWorkspace(req, res) {
  try {
    const newWorkspaces = await Workspaces.create(req.body);
    // res.status(201).json(workspace);

    res.status(201).json({
      success: true,
      message: "Workspaces created successfully",
      data: newWorkspaces,
    });
  } catch (error) {
    console.error("Create Workspaces Error:", error);
  }
}

export async function updateWorkspace(req, res) {
  try {
    const { workspaceId } = req.params;
    const { nama } = req.body;

    const updatedWorkspaces = await Workspaces.findByIdAndUpdate(
      workspaceId,
      { nama },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "workspace berhasil diupdate",
      data: updatedWorkspaces,
    });
  } catch (error) {
    console.error("Create Workspaces Error:", error);
  }
}

export async function deleteWorkspace(req, res) {
  try {
    const { workspaceId } = req.params;

    // Cari semua project di dalam workspace ini
    const projects = await Project.find({ workspace: workspaceId });

    for (const project of projects) {
      // Hapus semua group di dalam project
      await Group.deleteMany({ project: project._id });
    }
    // Hapus semua project di workspace
    await Project.deleteMany({ workspace: workspaceId });
    // Terakhir: hapus workspace-nya
    const deletedWorkspace = await Workspaces.findByIdAndDelete(workspaceId);

    if (!deletedWorkspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace tidak ditemukan",
      });
    }

    res.status(200).json({
      success: true,
      message: "Workspace, project, dan group berhasil dihapus",
    });
  } catch (error) {
    console.error("Delete Workspace Error:", error);
  }
}
