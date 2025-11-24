import express from "express";
import {
  getProgresByProject,
  getProgresByGroup,
  getProgresByWorkspace,
  getProgresByKuarter,
} from "../controllers/progresController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.get("/project/:projectId", authenticate, getProgresByProject);
router.get("/group/:groupId", authenticate, getProgresByGroup);
router.get("/workspace/:workspaceId", authenticate, getProgresByWorkspace);
router.get("/kuarter/:kuarterId", getProgresByKuarter);

export default router;
