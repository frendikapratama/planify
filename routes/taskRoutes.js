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
  checkWorkspaceMemberFromTask,
  checkWorkspaceMemberFromGroup,
} from "../middleware/auth.js";
const router = express.Router();

router.get("/", getTask);
router.get("/ByGroup", getTasksByGroup);
router.post("/:groupId", createTask);
router.put("/positions", updateTaskPositions);
router.put("/:taskId", authenticate, checkWorkspaceMemberFromTask, updateTask);
router.delete("/:taskId", deleteTask);
router.post("/:taskId/accept-pic-invite", acceptPicInvite);
router.delete("/:taskId/pic", authenticate, removePic);
router.delete("/:taskId/pic/all", authenticate, removeAllPics);
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
