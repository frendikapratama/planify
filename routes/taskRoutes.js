import express from "express";
import {
  createTask,
  getTask,
  updateTask,
  deleteTask,
  getTasksByGroup,
  updateTaskPositions,
  acceptPicInvite,
  removePic,
  removeAllPics,
  verifyPicInvite,
  getTasksByProjectSimple,
} from "../controllers/taksController.js";
import {
  authenticate,
  checkWorkspaceRoleFromTask,
} from "../middleware/auth.js";
const router = express.Router();

router.get("/", authenticate, getTask);
router.get("/ByGroup", authenticate, getTasksByGroup);
router.post(
  "/:groupId",
  checkWorkspaceRoleFromTask(["admin", "project_manager", "member"]),
  createTask
);
router.put(
  "/positions",
  checkWorkspaceRoleFromTask(["admin", "project_manager", "member"]),
  updateTaskPositions
);
router.put(
  "/:taskId",
  authenticate,
  checkWorkspaceRoleFromTask(["admin", "project_manager", "member"]),
  updateTask
);
router.delete(
  "/:taskId",
  authenticate,
  checkWorkspaceRoleFromTask(["admin", "project_manager"]),
  deleteTask
);
router.post(
  "/:taskId/accept-pic-invite",
  authenticate,
  checkWorkspaceRoleFromTask(["admin", "project_manager"]),
  acceptPicInvite
);
router.delete(
  "/:taskId/pic",
  authenticate,
  checkWorkspaceRoleFromTask(["admin", "project_manager"]),
  removePic
);
router.delete(
  "/:taskId/pic/all",
  authenticate,
  checkWorkspaceRoleFromTask(["admin", "project_manager"]),
  removeAllPics
);
router.get("/:taskId/verify-invite", verifyPicInvite);
router.get("/:projectId", getTasksByProjectSimple);
// Attachment routes
// router.post(
//   "/:taskId/attachments",
//   authenticate,
//   upload.single("file"),
//   uploadAttachment
// );

// Meeting link route
export default router;
