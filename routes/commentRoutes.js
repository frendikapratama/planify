import express from "express";
import {
  createComment,
  replyComment,
  getComments,
} from "../controllers/CommentController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();
router.use(authenticate);
router.post("/:taskId", createComment);

router.post("/:taskId/reply/:commentId", replyComment);

router.get("/:taskId", getComments);

export default router;
