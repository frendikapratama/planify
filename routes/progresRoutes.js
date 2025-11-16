import express from "express";
import {
  getProgresByProject,
  getProgresByGroup,
  getProgresByWorkspace,
} from "../controllers/progresController.js";

const router = express.Router();

router.get("/project/:projectId", getProgresByProject);
router.get("/group/:groupId", getProgresByGroup);
router.get("/workspace/:workspaceId", getProgresByWorkspace);

export default router;
