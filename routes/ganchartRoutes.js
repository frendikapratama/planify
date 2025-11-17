import express from "express";
import {
  getGanttChartByWorkspace,
  getGanttChartByProject,
} from "../controllers/ganchartController.js";

const router = express.Router();

router.get("/project/:projectId", getGanttChartByProject);
router.get("/workspace/:workspaceId", getGanttChartByWorkspace);

export default router;
