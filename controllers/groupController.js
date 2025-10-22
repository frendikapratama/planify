import Group from "../models/Group.js";
import Project from "../models/Project.js";
import Task from "../models/Task.js";

export async function getGroup(req, res) {
  try {
    const data = await Group.find().populate("task", "nama");
    res.status(200).json(data);
  } catch (error) {
    console.error("Create Workspace Error:", error);
  }
}

export async function createGroup(req, res) {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }
    const group = await Group.create({
      ...req.body,
      project: projectId,
    });
    await Project.findByIdAndUpdate(projectId, {
      $push: { groups: group._id },
    });

    res.status(201).json({
      success: true,
      message: "group created successfully",
      data: group,
    });
  } catch (error) {
    console.error("Create group Error:", error);
  }
}

export async function updateGroup(req, res) {
  try {
    const { groupId } = req.params;
    const { projectId, ...updateData } = req.body;
    const oldGroup = await Group.findById(groupId);

    if (!oldGroup) {
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });
    }

    if (projectId && projectId !== String(oldGroup.project)) {
      await Project.findByIdAndUpdate(oldGroup.project, {
        $pull: { groups: oldGroup._id },
      });
      await Project.findByIdAndUpdate(projectId, {
        $push: { groups: oldGroup._id },
      });
    }

    updateData.project = projectId || oldGroup.project;

    const updatedGroup = await Group.findByIdAndUpdate(groupId, updateData, {
      new: true,
    });

    res.status(200).json({
      success: true,
      message: "Group updated successfully",
      data: updatedGroup,
    });
  } catch (error) {
    console.error("Update Group Error:", error);
  }
}

export async function deleteGroup(req, res) {
  try {
    const { groupId } = req.params;
    const groupRef = await Group.findById(groupId).select("project");

    if (!groupRef) {
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });
    }

    await Task.deleteMany({ groups: groupId });

    await Project.findByIdAndUpdate(groupRef.project, {
      $pull: { groups: groupId },
    });
    await Group.findByIdAndDelete(groupId);

    res.status(200).json({
      success: true,
      message: "Group deleted successfully",
    });
  } catch (error) {
    console.error("Delete Group Error:", error);
  }
}
