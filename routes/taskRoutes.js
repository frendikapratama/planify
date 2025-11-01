import express from "express";
import {
  createTask,
  getTask,
  updateTask,
  deleteTask,
  getTasksByGroup,
  updateTaskPositions,
} from "../controllers/taksController.js";
const router = express.Router();

router.get("/", getTask);
router.get("/ByGroup", getTasksByGroup);
router.post("/:groupId", createTask);
router.put("/positions", updateTaskPositions);
router.put("/:taskId", updateTask);
router.delete("/:taskId", deleteTask);

export default router;
