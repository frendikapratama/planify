import express from "express";
import {
  getSubTask,
  createSubTask,
  updateSubTask,
  deleteSubTask,
} from "../controllers/subTaskController.js";
const router = express.Router();

router.get("/", getSubTask);
router.post("/:taskId", createSubTask);
router.put("/:subTaskId", updateSubTask);
router.delete("/:subTaskId", deleteSubTask);

export default router;
