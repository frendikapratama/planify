import express from "express";
import {
  getGanttChartByWorkspace,
  getGanttChartByProject,
} from "../controllers/ganchartController.js";
import { authenticate } from "../middleware/auth.js";
const router = express.Router();

router.get("/project/:projectId", authenticate, getGanttChartByProject);
router.get("/workspace/:workspaceId", authenticate, getGanttChartByWorkspace);

export default router;
