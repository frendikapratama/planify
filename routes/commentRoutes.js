import express from "express";
import {
  createComment,
  replyComment,
  getComments,
} from "../controllers/CommentController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();
router.use(authenticate);
router.post("/:taskId", authenticate, createComment);

router.post("/:taskId/reply/:commentId", authenticate, replyComment);

router.get("/:taskId", authenticate, getComments);

export default router;
