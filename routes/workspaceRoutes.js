import express from "express";

import {
  createWorkspace,
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
  getWorkspaceById,
} from "../controllers/workspaceController.js";

const router = express.Router();

router.get("/", getWorkspace);
router.post("/", createWorkspace);
router.get("/:workspaceId", getWorkspaceById);
router.put("/:workspaceId", updateWorkspace);
router.delete("/:workspaceId", deleteWorkspace);
router.delete("/:workspaceId", deleteWorkspace);

export default router;
