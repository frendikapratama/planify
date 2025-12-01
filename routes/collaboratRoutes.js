import express from "express";
import {
  sendCollaborationRequest,
  approveCollaboration,
  rejectCollaboration,
  getCollaborationRequests,
  getWorkspaceProjects,
} from "../controllers/collaborationController.js";
import {
  authenticate,
  checkWorkspaceRoleForCollaboration,
} from "../middleware/auth.js";

const router = express.Router();

router.post(
  "/send",
  authenticate,
  checkWorkspaceRoleForCollaboration(["project_manager", "admin"]),
  sendCollaborationRequest
);

router.get("/", authenticate, getCollaborationRequests);

router.put(
  "/:requestId/approve",
  authenticate,
  checkWorkspaceRoleForCollaboration(["project_manager", "admin"]),
  approveCollaboration
);

router.put(
  "/:requestId/reject",
  authenticate,
  checkWorkspaceRoleForCollaboration(["project_manager", "admin"]),
  rejectCollaboration
);

router.get(
  "/workspace/:workspaceId/projects",
  authenticate,
  getWorkspaceProjects
);

export default router;
