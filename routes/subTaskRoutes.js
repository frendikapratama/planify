import express from "express";
import {
  getSubTask,
  createSubTask,
  updateSubTask,
  deleteSubTask,
  positionSubTask,
  getByTask,
  acceptSubtaskPicInvite,
  removeSubtaskPic,
  verifySubtaskPicInvite,
} from "../controllers/subTaskController.js";
import {
  authenticate,
  checkWorkspaceRoleFromSubtask,
} from "../middleware/auth.js";
const router = express.Router();

router.get("/", authenticate, getSubTask);
router.get("/ByTask", authenticate, getByTask);
router.patch(
  "/:taskId",
  authenticate,
  checkWorkspaceRoleFromSubtask(["admin", "project_manager", "member"]),
  positionSubTask
);
router.post(
  "/:taskId",
  authenticate,
  checkWorkspaceRoleFromSubtask(["admin", "project_manager", "member"]),
  createSubTask
);
router.put(
  "/:subTaskId",
  authenticate,
  checkWorkspaceRoleFromSubtask(["admin", "project_manager", "member"]),
  updateSubTask
);
router.delete(
  "/:subTaskId",
  authenticate,
  checkWorkspaceRoleFromSubtask(["admin", "project_manager", "member"]),
  deleteSubTask
);

router.delete(
  "/:subTaskId/pic",
  authenticate,
  checkWorkspaceRoleFromSubtask(["admin", "project_manager", "member"]),
  removeSubtaskPic
);
router.post("/:subTaskId/accept-pic-invite", acceptSubtaskPicInvite);
router.get("/:subTaskId/verify-invite", verifySubtaskPicInvite);
export default router;
