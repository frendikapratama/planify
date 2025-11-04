import Task from "../models/Task.js";
import Group from "../models/Group.js";
import Subtask from "../models/Subtask.js";
import User from "../models/User.js";
import Workspace from "../models/Workspace.js";
import crypto from "crypto";
import Project from "../models/Project.js";
import { transporter } from "../utils/sendEmail.js";

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

    // Handle group movement (existing logic - TIDAK DIUBAH)
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
      .populate({
        path: "pic",
        select: "username email",
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

async function handlePicAssignment(taskId, picEmail, task, requesterId) {
  try {
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

    const workspaceId = project.workspace._id;
    const workspace = await Workspace.findById(workspaceId).populate("members");

    const isAuthorized =
      workspace.owner.toString() === requesterId.toString() ||
      workspace.members.some(
        (m) => m._id.toString() === requesterId.toString()
      );

    if (!isAuthorized) {
      return {
        success: false,
        status: 403,
        message: "Anda tidak memiliki akses ke workspace ini",
      };
    }

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

    if (
      targetUser &&
      workspace.members.some(
        (m) => m._id.toString() === targetUser._id.toString()
      )
    ) {
      await Task.findByIdAndUpdate(taskId, {
        $addToSet: { pic: targetUser._id },
      });

      if (!targetUser.assignedTasks.includes(taskId)) {
        targetUser.assignedTasks.push(taskId);
        await targetUser.save();
      }

      return {
        success: true,
        message: `${picEmail} berhasil ditambahkan sebagai PIC`,
      };
    }

    const inviteToken = crypto.randomBytes(16).toString("hex");

    await Task.findByIdAndUpdate(taskId, {
      $push: {
        pendingPicInvites: {
          email: picEmail,
          token: inviteToken,
          invitedBy: requesterId,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 hari
        },
      },
    });

    if (targetUser) {
      // Kirim email untuk user yang sudah terdaftar
      const inviteUrl = `http://localhost:5173/accept-pic-invite?taskId=${taskId}&token=${inviteToken}&registered=true`;
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: picEmail,
        subject: `Undangan sebagai PIC untuk Task: ${task.nama}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Undangan Menjadi PIC Task</h2>
            <p>Halo,</p>
            <p>Anda telah diundang untuk menjadi PIC (Person In Charge) pada task:</p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <h3 style="margin: 0; color: #1f2937;">${task.nama}</h3>
              <p style="margin: 5px 0; color: #6b7280;">Project: ${project.nama}</p>
              <p style="margin: 5px 0; color: #6b7280;">Workspace: ${workspace.nama}</p>
            </div>
            <p>Klik tombol di bawah ini untuk menerima undangan:</p>
            <a href="${inviteUrl}" 
               style="display: inline-block; background-color: #2563eb; color: white; 
                      padding: 12px 24px; text-decoration: none; border-radius: 6px; 
                      margin: 15px 0;">
              Terima Undangan
            </a>
            <p>Atau copy link berikut ke browser Anda:</p>
            <p style="word-break: break-all; color: #6b7280;">${inviteUrl}</p>
            <p>Undangan ini akan kedaluwarsa dalam 7 hari.</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`📨 Email undangan terkirim ke user terdaftar: ${picEmail}`);

      return {
        success: true,
        invited: true,
        message: `Undangan PIC dikirim ke ${picEmail}. User akan otomatis join workspace`,
      };
    }

    // Kirim email untuk user baru yang perlu registrasi
    const inviteUrl = `http://localhost:5173/accept-pic-invite?taskId=${taskId}&token=${inviteToken}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: picEmail,
      subject: `Undangan sebagai PIC untuk Task: ${task.nama}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Undangan Menjadi PIC Task</h2>
          <p>Halo,</p>
          <p>Anda telah diundang untuk menjadi PIC (Person In Charge) pada task:</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <h3 style="margin: 0; color: #1f2937;">${task.nama}</h3>
            <p style="margin: 5px 0; color: #6b7280;">Project: ${project.nama}</p>
            <p style="margin: 5px 0; color: #6b7280;">Workspace: ${workspace.nama}</p>
          </div>
          <p>Sebelum menerima undangan, Anda perlu melakukan registrasi terlebih dahulu:</p>
          <a href="${inviteUrl}" 
             style="display: inline-block; background-color: #2563eb; color: white; 
                    padding: 12px 24px; text-decoration: none; border-radius: 6px; 
                    margin: 15px 0;">
            Daftar dan Terima Undangan
          </a>
          <p>Atau copy link berikut ke browser Anda:</p>
          <p style="word-break: break-all; color: #6b7280;">${inviteUrl}</p>
          <p>Undangan ini akan kedaluwarsa dalam 7 hari.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`📨 Email undangan terkirim ke user baru: ${picEmail}`);

    return {
      success: true,
      invited: true,
      message: `Undangan PIC dikirim ke ${picEmail}. User perlu register terlebih dahulu`,
      needsRegistration: true,
    };
  } catch (error) {
    console.error("Handle PIC Assignment Error:", error);
    return {
      success: false,
      status: 500,
      message: "Terjadi kesalahan saat assign PIC",
    };
  }
}

export async function acceptPicInvite(req, res) {
  try {
    const { taskId } = req.params;
    const { token } = req.query;
    const { username, password, noHp, posisi, departemen, divisi } = req.body;

    const task = await Task.findById(taskId).populate("groups");

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task tidak ditemukan",
      });
    }

    const inviteData = task.pendingPicInvites?.find(
      (inv) => inv.token === token
    );

    if (!inviteData) {
      return res.status(404).json({
        success: false,
        message: "Token tidak valid atau sudah kedaluwarsa",
      });
    }

    // Pastikan expiresAt ada dan valid
    if (new Date() > new Date(inviteData.expiresAt)) {
      // Hapus invite yang kedaluwarsa
      task.pendingPicInvites = task.pendingPicInvites.filter(
        (inv) => inv.token !== token
      );
      await task.save();

      return res.status(400).json({
        success: false,
        message: "Undangan sudah kedaluwarsa",
      });
    }

    const invitedEmail = inviteData.email;

    const group = await Group.findById(task.groups).populate("project");
    const project = await Project.findById(group.project);
    const workspace = await Workspace.findById(project.workspace);

    let user = await User.findOne({ email: invitedEmail });

    if (!user) {
      if (!username || !password || !noHp || !posisi) {
        return res.status(400).json({
          success: false,
          message:
            "Data registrasi tidak lengkap (username, password, noHp, posisi wajib diisi)",
        });
      }

      user = await User.create({
        username,
        email: invitedEmail,
        password,
        noHp,
        posisi,
        departemen,
        divisi,
      });
      console.log(`🆕 User baru dibuat: ${invitedEmail}`);
    }

    if (!workspace.members.includes(user._id)) {
      workspace.members.push(user._id);
      await workspace.save();

      user.workspaces.push(workspace._id);
    }

    if (!task.pic.includes(user._id)) {
      task.pic.push(user._id);
    }
    task.pendingPicInvites = task.pendingPicInvites.filter(
      (inv) => inv.token !== token
    );
    await task.save();

    if (!user.assignedTasks.includes(task._id)) {
      user.assignedTasks.push(task._id);
    }
    await user.save();

    res.status(200).json({
      success: true,
      message: "Berhasil menjadi PIC task dan bergabung ke workspace",
      data: {
        task: task.nama,
        workspace: workspace.nama,
        pic: user.username,
      },
    });
  } catch (error) {
    console.error("Accept PIC Invite Error:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server",
      error: error.message,
    });
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
    console.error("Remove PIC Error:", error);
    res.status(500).json({
      success: false,
      message: "Gagal menghapus PIC",
    });
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
    console.error("Remove All PICs Error:", error);
    res.status(500).json({
      success: false,
      message: "Gagal menghapus semua PIC",
    });
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

    const inviteData = task.pendingPicInvites?.find(
      (inv) => inv.token === token
    );

    if (!inviteData) {
      return res.status(404).json({
        success: false,
        message: "Token tidak valid",
      });
    }

    if (new Date() > new Date(inviteData.expiresAt)) {
      return res.status(400).json({
        success: false,
        message: "Undangan sudah kedaluwarsa",
      });
    }

    const group = await Group.findById(task.groups).populate("project");
    const project = await Project.findById(group.project);
    const workspace = await Workspace.findById(project.workspace);

    res.status(200).json({
      success: true,
      data: {
        invitedEmail: inviteData.email,
        taskName: task.nama,
        projectName: project.nama,
        workspaceName: workspace.nama,
        expiresAt: inviteData.expiresAt,
      },
    });
  } catch (error) {
    console.error("Verify PIC Invite Error:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server",
    });
  }
}
