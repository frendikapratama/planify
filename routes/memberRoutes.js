import express from "express";

import {
  getMemberWorkspace,
  getProjectTasksWithPics,
} from "../controllers/memberController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();
router.get("/workspace/:workspaceId", authenticate, getMemberWorkspace);
router.get("/project/:projectId", authenticate, getProjectTasksWithPics);
export default router;
