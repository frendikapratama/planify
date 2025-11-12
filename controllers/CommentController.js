import Comment from "../models/Comment.js";
import { handleError } from "../utils/errorHandler.js";

export async function createComment(req, res) {
  try {
    const { taskId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    const comment = await Comment.create({
      task: taskId,
      user: userId,
      text,
      parentComment: null,
      depth: 0,
    });

    return res.status(201).json({
      success: true,
      message: "Comment created",
      data: comment,
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function replyComment(req, res) {
  try {
    const { taskId, commentId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    const parent = await Comment.findById(commentId);
    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent comment tidak ada",
      });
    }

    const reply = await Comment.create({
      task: taskId,
      user: userId,
      text,
      parentComment: parent._id,
      depth: parent.depth + 1,
    });
    return res.status(201).json({
      success: true,
      message: "Reply created",
      data: reply,
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export const getComments = async (req, res) => {
  try {
    const { taskId } = req.params;

    let comments = await Comment.find({ task: taskId })
      .populate("user", "username ")
      .sort({ createdAt: 1 });

    let map = {};
    comments = comments.map((c) => {
      const obj = c.toObject();
      obj.replies = [];
      map[c._id] = obj;
      return obj;
    });

    const roots = [];

    comments.forEach((c) => {
      if (c.parentComment) {
        map[c.parentComment]?.replies.push(c);
      } else {
        roots.push(c);
      }
    });

    return res.status(200).json({
      success: true,
      data: roots,
    });
  } catch (err) {
    return handleError(res, error);
  }
};
