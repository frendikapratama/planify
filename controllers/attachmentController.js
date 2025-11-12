import Task from "../models/Task.js";
import path from "path";
import fs from "fs";
import { handleError } from "../utils/errorHandler.js";

export async function addAttachment(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const attachmentData = {
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      fileUrl: `/uploads/attachments/${req.file.filename}`,
      uploadedBy: req.user?._id || null,
    };

    const task = await Task.findByIdAndUpdate(
      req.params.taskId,
      { $push: { attachments: attachmentData } },
      { new: true }
    ).populate("attachments.uploadedBy", "username email");

    if (!task) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    res.status(201).json({
      success: true,
      message: "File uploaded successfully",
      data: attachmentData,
      task: task,
    });
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    return handleError(res, error);
  }
}

export async function deleteAttachment(req, res) {
  try {
    const { taskId, attachmentId } = req.params;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    const attachment = task.attachments.id(attachmentId);
    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: "Attachment not found",
      });
    }

    const filePath = path.join(
      process.cwd(),
      "uploads",
      "attachments",
      path.basename(attachment.fileUrl)
    );
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    task.attachments.pull(attachmentId);
    await task.save();

    res.status(200).json({
      success: true,
      message: "Attachment deleted successfully",
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getTaskAttachments(req, res) {
  try {
    const task = await Task.findById(req.params.taskId)
      .select("attachments")
      .populate("attachments.uploadedBy", "username email");

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Attachments retrieved successfully",
      data: task.attachments,
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function downloadAttachment(req, res) {
  try {
    const { taskId, attachmentId } = req.params;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    const attachment = task.attachments.id(attachmentId);
    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: "Attachment not found",
      });
    }

    const filePath = path.join(
      process.cwd(),
      "uploads",
      "attachments",
      path.basename(attachment.fileUrl)
    );

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "File not found on server",
      });
    }

    res.setHeader("Content-Type", attachment.fileType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${attachment.fileName}"`
    );

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    return handleError(res, error);
  }
}
