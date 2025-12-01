import crypto from "crypto";

export function generateInviteToken() {
  return crypto.randomBytes(16).toString("hex");
}

export function validateInviteToken(invites, token) {
  const inviteData = invites.find((inv) => inv.token === token);

  if (!inviteData) {
    return {
      valid: false,
      message: "Token tidak valid",
    };
  }

  if (inviteData.expiresAt && new Date() > new Date(inviteData.expiresAt)) {
    return {
      valid: false,
      expired: true,
      message: "Undangan sudah kedaluwarsa",
    };
  }

  return {
    valid: true,
    inviteData,
  };
}

export function createInviteObject(email, token, additionalData = {}) {
  return {
    email,
    token,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 hari
    ...additionalData,
  };
}
