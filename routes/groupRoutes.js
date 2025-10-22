import express from "express";

import {
  getGroup,
  createGroup,
  updateGroup,
  deleteGroup,
} from "../controllers/groupController.js";

const router = express.Router();

router.get("/", getGroup);
router.post("/:projectId", createGroup);
router.put("/:groupId", updateGroup);
router.delete("/:groupId", deleteGroup);

export default router;
