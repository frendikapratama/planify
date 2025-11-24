import express from "express";
import {
  getGanttChartByWorkspace,
  getGanttChartByProject,
  getGanttChartByKuarter,
} from "../controllers/ganchartController.js";
import { authenticate } from "../middleware/auth.js";
const router = express.Router();

router.get("/project/:projectId", authenticate, getGanttChartByProject);
router.get("/workspace/:workspaceId", authenticate, getGanttChartByWorkspace);
router.get("/kuarter/:kuarterId", getGanttChartByKuarter);

export default router;
