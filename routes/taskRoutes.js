import express from "express";
import {
  createTask,
  getTask,
  updateTask,
} from "../controllers/taksController.js";
const router = express.Router();

router.get("/", getTask);
router.post("/:groupId", createTask);
router.put("/:taskId", updateTask);

export default router;
