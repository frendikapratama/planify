import Project from "../models/Project.js";
import Group from "../models/Group.js";

import Workspace from "../models/Workspace.js";
import User from "../models/User.js";
import crypto from "crypto";

export async function getWorkspace(req, res) {
  try {
    const data = await Workspace.find().populate("projects", "nama");
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
    const workspace = await Workspace.findById(workspaceId)
      .populate({
        path: "projects",
        select: "nama createdAt",
        options: { sort: { createdAt: -1 } },
      })
      .populate({
        path: "owner",
        select: "username email",
      })
      .populate({
        path: "members",
        select: "username email",
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
    const newWorkspace = await Workspace.create({
      nama: req.body.nama,
      owner: req.user._id,
      members: [req.user._id],
    });

    res.status(201).json({
      success: true,
      message: "Workspace created successfully",
      data: newWorkspace,
    });
  } catch (error) {
    console.error("Create Workspace Error:", error);
  }
}

export async function updateWorkspace(req, res) {
  try {
    const { workspaceId } = req.params;
    const { nama } = req.body;

    const updatedWorkspaces = await Workspace.findByIdAndUpdate(
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
    console.error("Create Workspace Error:", error);
  }
}

export async function deleteWorkspace(req, res) {
  try {
    const { workspaceId } = req.params;

    const projects = await Project.find({ workspace: workspaceId });

    for (const project of projects) {
      await Group.deleteMany({ project: project._id });
    }
    await Project.deleteMany({ workspace: workspaceId });
    const deletedWorkspace = await Workspace.findByIdAndDelete(workspaceId);

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

export async function inviteMemberByEmail(req, res) {
  try {
    const { workspaceId } = req.params;
    const { email } = req.body;
    const requesterId = req.user._id;

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace)
      return res.status(404).json({ message: "Workspace tidak ditemukan" });

    if (workspace.owner.toString() !== requesterId.toString()) {
      return res
        .status(403)
        .json({ message: "Hanya owner yang dapat mengundang anggota" });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      if (!workspace.members.includes(existingUser._id)) {
        workspace.members.push(existingUser._id);
        await workspace.save();

        existingUser.workspaces.push(workspace._id);
        await existingUser.save();

        console.log(`✅ ${email} langsung ditambahkan sebagai member`);
        return res.status(200).json({
          message: "User sudah terdaftar dan ditambahkan ke workspace",
        });
      }

      return res
        .status(400)
        .json({ message: "User sudah menjadi anggota workspace" });
    }

    const inviteToken = crypto.randomBytes(16).toString("hex");

    workspace.pendingInvites.push({
      email,
      token: inviteToken,
    });
    await workspace.save();

    console.log(`
📨 Undangan Workspace:
Workspace: ${workspace.nama}
Email: ${email}
Token: ${inviteToken}
URL Aksi: http://localhost:5000/invite/accept?token=${inviteToken}
`);

    res.status(200).json({
      success: true,
      message: "Undangan dikirim (cek console.log)",
    });
  } catch (error) {
    console.error("Invite member error:", error);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
}

export async function acceptInvite(req, res) {
  try {
    const { token } = req.query;
    const { email, username, password, noHp, posisi } = req.body;

    const workspace = await Workspace.findOne({
      "pendingInvites.token": token,
    });
    if (!workspace)
      return res.status(404).json({ message: "Token tidak valid" });

    const inviteData = workspace.pendingInvites.find(
      (inv) => inv.token === token
    );
    if (!inviteData)
      return res.status(400).json({ message: "Undangan tidak ditemukan" });

    const invitedEmail = inviteData.email;

    let user = await User.findOne({ email: invitedEmail });

    if (!user) {
      user = await User.create({
        username,
        email: invitedEmail,
        password,
        noHp,
        posisi,
      });
      console.log(`🆕 User baru dibuat: ${email}`);
    }

    if (!workspace.members.includes(user._id)) {
      workspace.members.push(user._id);
      workspace.pendingInvites = workspace.pendingInvites.filter(
        (inv) => inv.token !== token
      );
      await workspace.save();

      user.workspaces.push(workspace._id);
      await user.save();

      return res.status(200).json({
        success: true,
        message: "Berhasil bergabung ke workspace",
      });
    } else {
      return res.status(400).json({ message: "User sudah menjadi member" });
    }
  } catch (error) {
    console.error("Accept invite error:", error);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
}
