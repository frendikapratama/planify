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
