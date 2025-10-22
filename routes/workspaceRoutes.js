import express from "express";

import {
  createWorkspace,
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
} from "../controllers/workspaceController.js";

const router = express.Router();

router.get("/", getWorkspace);
router.post("/", createWorkspace);
router.put("/:workspaceId", updateWorkspace);
router.delete("/:workspaceId", deleteWorkspace);

export default router;
