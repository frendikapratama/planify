import express from "express";

import {
  getMemberWorkspace,
  getProjectTasksWithPics,
} from "../controllers/memberController.js";

const router = express.Router();
router.get("/:workspaceId", getMemberWorkspace);
router.get("/project/:projectId", getProjectTasksWithPics);
export default router;
