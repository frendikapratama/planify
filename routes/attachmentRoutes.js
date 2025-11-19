// routes/attachmentRoutes.js
import express from "express";
import { uploadSingle } from "../middleware/upload.js";
import {
  addAttachment,
  getTaskAttachments,
  downloadAttachment,
  deleteAttachment,
} from "../controllers/attachmentController.js";
import { authenticate } from "../middleware/auth.js";
const router = express.Router();

router.post("/:taskId", authenticate, uploadSingle, addAttachment);

router.get("/:taskId", authenticate, getTaskAttachments);

router.get("/:taskId/download/:attachmentId", authenticate, downloadAttachment);

router.delete("/:taskId/delete/:attachmentId", authenticate, deleteAttachment);

export default router;
