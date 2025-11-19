import express from "express";
import {
  sendCollaborationRequest,
  approveCollaboration,
  rejectCollaboration,
  getCollaborationRequests,
  getWorkspaceProjects,
} from "../controllers/collaborationController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.post("/send", authenticate, sendCollaborationRequest);
router.get("/", authenticate, getCollaborationRequests);
router.put("/:requestId/approve", authenticate, approveCollaboration);
router.put("/:requestId/reject", authenticate, rejectCollaboration);
router.get(
  "/workspace/:workspaceId/projects",
  authenticate,
  getWorkspaceProjects
);

export default router;
