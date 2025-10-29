import express from "express";
import {
  createProject,
  getProject,
  updateProject,
  deleteProject,
  getProjectById,
} from "../controllers/projectsController.js";

const router = express.Router();

router.get("/", getProject);
router.post("/:workspaceId", createProject);
router.get("/:projectId", getProjectById);
router.put("/:projectId", updateProject);
router.delete("/:projectId", deleteProject);

export default router;
