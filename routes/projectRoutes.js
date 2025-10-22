import express from "express";
import {
  createProject,
  getProject,
  updateProject,
  deleteProject,
} from "../controllers/projectsController.js";

const router = express.Router();

router.get("/", getProject);
router.post("/:workspaceId", createProject);
router.put("/:projectId", updateProject);
router.delete("/:projectId", deleteProject);

export default router;
