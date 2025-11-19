import Activity from "../models/Activity.js";

export async function createActivity({
  user,
  workspace,
  project,
  task,
  action,
  description,
  before,
  after,
}) {
  try {
    return await Activity.create({
      user,
      workspace,
      project,
      task,
      action,
      description,
      before,
      after,
    });
  } catch (err) {
    console.error("Activity Log Error:", err.message);
  }
}
