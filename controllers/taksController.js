import Task from "../models/Task.js";
import Group from "../models/Group.js";
import Subtask from "../models/Subtask.js";
import User from "../models/User.js";
import { getWorkspaceFromTask } from "../utils/workspaceUtils.js";
import {
  validateInviteToken,
  generateInviteToken,
  createInviteObject,
} from "../utils/inviteUtils.js";
import { findOrCreateUser } from "../utils/userUtils.js";
import { sendTaskPicInvitationEmail } from "../utils/emailUtils.js";
import { handleError } from "../utils/errorHandler.js";
import Workspace from "../models/Workspace.js";

export async function getTasksByProjectSimple(req, res) {
  try {
    const { projectId } = req.params;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: "Project ID wajib disertakan",
      });
    }

    const groups = await Group.find({ project: projectId });

    const tasksByGroup = await Promise.all(
      groups.map(async (group) => {
        const tasks = await Task.find({ groups: group._id })
          .populate("pic", "username email")
          .populate("subtask")
          .sort({ position: 1 });

        return {
          groupId: group._id,
          groupName: group.nama,
          groupDescription: group.description,
          tasks: tasks,
        };
      })
    );

    res.status(200).json({
      success: true,
      message: "Berhasil mengambil data task berdasarkan project",
      data: tasksByGroup,
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getTask(req, res) {
  try {
    const data = await Task.find();
    res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
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

    const lastTask = await Task.findOne({ groups: groupId })
      .sort({ position: -1 })
      .limit(1);

    const nextPosition = lastTask ? lastTask.position + 1 : 0;

    const task = await Task.create({
      ...req.body,
      groups: groupId,
      position: nextPosition,
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
    return handleError(res, error);
  }
}

export async function updateTask(req, res) {
  try {
    const { taskId } = req.params;
    const { groupId, position, picEmail, ...updateData } = req.body;

    const oldTask = await Task.findById(taskId).populate("groups");
    if (!oldTask) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    if (picEmail) {
      const emails = Array.isArray(picEmail) ? picEmail : [picEmail];

      for (const email of emails) {
        const picResult = await handlePicAssignment(
          taskId,
          email,
          oldTask,
          req.user._id
        );

        if (!picResult.success) {
          return res.status(picResult.status || 400).json(picResult);
        }
      }

      const refreshedTask = await Task.findById(taskId);
      updateData.pic = refreshedTask.pic;
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
    }).populate("pic", "username email");

    res.status(200).json({
      success: true,
      message: "Task updated successfully",
      data: updatedTask,
    });
  } catch (error) {
    return handleError(res, error);
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
    return handleError(res, error);
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
      .populate({
        path: "pic",
        select: "username email",
      })
      .sort({ position: 1 });

    res.status(200).json({
      success: true,
      message: "berhasil mengambil data",
      data: tasks,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

async function handlePicAssignment(taskId, picEmail, task, requesterId) {
  try {
    const result = await getWorkspaceFromTask(taskId);
    if (!result.success) {
      return result;
    }

    const { workspace, project } = result;

    const targetUser = await User.findOne({ email: picEmail });
    const currentTask = await Task.findById(taskId);

    if (
      currentTask.pic &&
      currentTask.pic.some(
        (id) => targetUser && id.toString() === targetUser._id.toString()
      )
    ) {
      return {
        success: true,
        message: "User sudah menjadi PIC task ini",
      };
    }

    if (targetUser) {
      const isMember = workspace.members.some(
        (m) => m.user.toString() === targetUser._id.toString()
      );

      if (!isMember) {
        await Workspace.findByIdAndUpdate(workspace._id, {
          $push: {
            members: {
              user: targetUser._id,
              role: "member",
            },
          },
        });

        await User.findByIdAndUpdate(targetUser._id, {
          $push: {
            workspaces: {
              workspace: workspace._id,
              role: "member",
            },
          },
        });
      }

      await Task.findByIdAndUpdate(taskId, {
        $addToSet: { pic: targetUser._id },
      });

      if (!targetUser.assignedTasks.includes(taskId)) {
        targetUser.assignedTasks.push(taskId);
        await targetUser.save();
      }

      return {
        success: true,
        message: `${picEmail} berhasil ditambahkan sebagai PIC${
          !isMember ? " dan bergabung ke workspace sebagai member" : ""
        }`,
      };
    }

    const inviteToken = generateInviteToken();
    const inviteObject = createInviteObject(picEmail, inviteToken, {
      invitedBy: requesterId,
    });

    await Task.findByIdAndUpdate(taskId, {
      $push: { pendingPicInvites: inviteObject },
    });

    const inviteUrl = `${process.env.CLIENT_URL}/accept-pic-invite?taskId=${taskId}&token=${inviteToken}`;

    await sendTaskPicInvitationEmail({
      to: picEmail,
      taskName: task.nama,
      projectName: project.nama,
      workspaceName: workspace.nama,
      inviteUrl,
      isRegistered: false,
    });

    return {
      success: true,
      invited: true,
      message: `Undangan PIC dikirim ke ${picEmail}. User perlu register terlebih dahulu dan akan otomatis mendapat role member`,
      needsRegistration: true,
    };
  } catch (error) {
    console.error("Error in handlePicAssignment:", error);
    return {
      success: false,
      status: 500,
      message: "Terjadi kesalahan saat menambahkan PIC",
    };
  }
}

export async function acceptPicInvite(req, res) {
  try {
    const { taskId } = req.params;
    const { token } = req.query;
    const { username, password, noHp, posisi, departemen, divisi } = req.body;

    const result = await getWorkspaceFromTask(taskId);
    if (!result.success) {
      return res.status(result.status).json(result);
    }

    const { task, workspace } = result;

    const validation = validateInviteToken(task.pendingPicInvites, token);
    if (!validation.valid) {
      if (validation.expired) {
        await Task.findByIdAndUpdate(taskId, {
          $pull: { pendingPicInvites: { token: token } },
        });
      }
      return res.status(validation.expired ? 400 : 404).json({
        success: false,
        message: validation.message,
      });
    }

    const invitedEmail = validation.inviteData.email;

    const userResult = await findOrCreateUser(invitedEmail, {
      username,
      password,
      noHp,
      posisi,
      departemen,
      divisi,
    });

    if (!userResult.success) {
      return res.status(400).json({
        success: false,
        message: userResult.message,
      });
    }

    const userId = userResult.user._id;

    const isMember = workspace.members.some(
      (m) => m.user.toString() === userId.toString()
    );

    if (!isMember) {
      await Workspace.findByIdAndUpdate(workspace._id, {
        $push: {
          members: {
            user: userId,
            role: "member",
          },
        },
      });

      await User.findByIdAndUpdate(userId, {
        $push: {
          workspaces: {
            workspace: workspace._id,
            role: "member",
          },
        },
      });
    }

    await User.findByIdAndUpdate(userId, {
      $addToSet: {
        assignedTasks: taskId,
      },
    });

    await Task.findByIdAndUpdate(taskId, {
      $addToSet: { pic: userId },
      $pull: { pendingPicInvites: { token: token } },
    });

    res.status(200).json({
      success: true,
      message:
        "Berhasil menjadi PIC task dan bergabung ke workspace sebagai member",
      data: {
        task: task.nama,
        workspace: workspace.nama,
        pic: userResult.user.username,
        role: "member",
      },
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function removePic(req, res) {
  try {
    const { taskId } = req.params;
    const { userId } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task tidak ditemukan",
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId wajib diisi untuk menghapus PIC",
      });
    }

    const wasRemoved = task.pic.includes(userId);

    if (wasRemoved) {
      task.pic = task.pic.filter((id) => id.toString() !== userId.toString());
      await task.save();

      await User.findByIdAndUpdate(userId, {
        $pull: { assignedTasks: task._id },
      });

      res.status(200).json({
        success: true,
        message: "PIC berhasil dihapus dari task",
      });
    } else {
      res.status(404).json({
        success: false,
        message: "User bukan PIC dari task ini",
      });
    }
  } catch (error) {
    return handleError(res, error);
  }
}

export async function removeAllPics(req, res) {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task tidak ditemukan",
      });
    }

    for (const picId of task.pic) {
      await User.findByIdAndUpdate(picId, {
        $pull: { assignedTasks: task._id },
      });
    }

    task.pic = [];
    await task.save();

    res.status(200).json({
      success: true,
      message: "Semua PIC berhasil dihapus dari task",
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function verifyPicInvite(req, res) {
  try {
    const { taskId } = req.params;
    const { token } = req.query;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task tidak ditemukan",
      });
    }

    const validation = validateInviteToken(task.pendingPicInvites, token);
    if (!validation.valid) {
      return res.status(validation.expired ? 400 : 404).json({
        success: false,
        message: validation.message,
      });
    }

    const result = await getWorkspaceFromTask(taskId);
    if (!result.success) {
      return res.status(result.status).json(result);
    }

    const { workspace, project } = result;

    res.status(200).json({
      success: true,
      data: {
        invitedEmail: validation.inviteData.email,
        taskName: task.nama,
        projectName: project.nama,
        workspaceName: workspace.nama,
        expiresAt: validation.inviteData.expiresAt,
        role: "member",
      },
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateMeetingLink(req, res) {
  try {
    const { taskId } = req.params;
    const { meetingLink } = req.body;

    const task = await Task.findByIdAndUpdate(
      taskId,
      { meetingLink },
      { new: true }
    );

    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    res.status(200).json({
      success: true,
      message: "Meeting link updated successfully",
      data: task,
    });
  } catch (error) {
    return handleError(res, error);
  }
}
