import express from "express";
import { getSubTask, createSubTask } from "../controllers/subTaskController.js";
const router = express.Router();

router.get("/", getSubTask);
router.post("/:taskId", createSubTask);

export default router;
