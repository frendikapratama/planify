// routes/attachmentRoutes.js
import express from "express";
import { uploadSingle } from "../middleware/upload.js";
import {
  addAttachment,
  getTaskAttachments,
  downloadAttachment,
  deleteAttachment,
} from "../controllers/attachmentController.js";
const router = express.Router();

// router.use(authMiddleware);

router.post("/:taskId", uploadSingle, addAttachment);

router.get("/:taskId", getTaskAttachments);

router.get("/:taskId/download/:attachmentId", downloadAttachment);

router.delete("/:taskId/delete/:attachmentId", deleteAttachment);

export default router;
