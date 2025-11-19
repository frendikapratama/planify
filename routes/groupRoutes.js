import express from "express";

import {
  getGroup,
  createGroup,
  updateGroup,
  deleteGroup,
} from "../controllers/groupController.js";
import { authenticate } from "../middleware/auth.js";
const router = express.Router();

router.get("/", authenticate, getGroup);
router.post("/:projectId", authenticate, createGroup);
router.put("/:groupId", authenticate, updateGroup);
router.delete("/:groupId", authenticate, deleteGroup);

export default router;
