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

  createWorkspace
);
router.get("/:workspaceId", authenticate, getWorkspaceById);
router.put(
  "/:workspaceId",
  authenticate,

  updateWorkspace
);
router.delete("/:workspaceId", authenticate, deleteWorkspace);
router.post(
  "/:workspaceId/invite",
  authenticate,
  //
  inviteMemberByEmail
);
router.post("/invite/accept", acceptInvite);

export default router;
