import User from "../models/User.js";
import Workspace from "../models/Workspace.js";

export async function findOrCreateUser(email, userData = {}) {
  let user = await User.findOne({ email });

  if (!user) {
    const { username, password, noHp, posisi, departemen, divisi } = userData;

    if (!username || !password || !noHp || !posisi) {
      return {
        success: false,
        message:
          "Data registrasi tidak lengkap (username, password, noHp, posisi wajib diisi)",
      };
    }

    user = await User.create({
      username,
      email,
      password,
      noHp,
      posisi,
      departemen,
      divisi,
    });

    console.log(`🆕 User baru dibuat: ${email}`);
    return { success: true, user, isNewUser: true };
  }

  return { success: true, user, isNewUser: false };
}

export async function addUserToWorkspace(userId, workspaceId) {
  const workspace = await Workspace.findById(workspaceId);
  const user = await User.findById(userId);

  if (!workspace.members.includes(userId)) {
    workspace.members.push(userId);
    await workspace.save();
  }

  if (!user.workspaces.includes(workspaceId)) {
    user.workspaces.push(workspaceId);
    await user.save();
  }

  return { workspace, user };
}
