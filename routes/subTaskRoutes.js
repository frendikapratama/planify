import express from "express";
import {
  getSubTask,
  createSubTask,
  updateSubTask,
  deleteSubTask,
  positionSubTask,
  getByTask,
} from "../controllers/subTaskController.js";
const router = express.Router();

router.get("/", getSubTask);
router.get("/ByTask", getByTask);
router.patch("/:taskId", positionSubTask);
router.post("/:taskId", createSubTask);
router.put("/:subTaskId", updateSubTask);
router.delete("/:subTaskId", deleteSubTask);

export default router;
