import express from "express";

import {
  createWorkspace,
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
  getWorkspaceById,
  inviteMemberByEmail,
  acceptInvite,
} from "../controllers/workspaceController.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authenticate, getWorkspace);
router.post(
  "/:kuarterId",
  authenticate,
  authorize("project_manajer", "system_admin"),
  createWorkspace
);
router.get("/:workspaceId", authenticate, getWorkspaceById);
router.put(
  "/:workspaceId",
  authenticate,
  authorize("project_manajer", "system_admin"),
  updateWorkspace
);
router.delete(
  "/:workspaceId",
  authorize("project_manajer", "system_admin"),
  deleteWorkspace
);
router.post(
  "/:workspaceId/invite",
  authenticate,
  authorize("project_manajer", "system_admin"),
  inviteMemberByEmail
);
router.post(
  "/invite/accept",

  acceptInvite
);

export default router;
