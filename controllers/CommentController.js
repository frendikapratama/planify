import Comment from "../models/Comment.js";
import { handleError } from "../utils/errorHandler.js";
import { createActivity } from "../helpers/activityhelper.js";
import Group from "../models/Group.js";
import Task from "../models/Task.js";

export async function createComment(req, res) {
  try {
    const { taskId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    const task = await Task.findById(taskId).populate("groups");

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task tidak ditemukan",
      });
    }

    const comment = await Comment.create({
      task: taskId,
      user: userId,
      text,
      parentComment: null,
      depth: 0,
    });

    const group = await Group.findById(task.groups);

    await createActivity({
      user: userId,
      workspace: task.workspace,
      project: group?.project,
      group: group?._id,
      task: task._id,
      action: "COMMENT",
      description: `User commented on task ${task.nama}`,
      before: {},
      after: {
        text: comment.text,
        commentId: comment._id,
      },
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

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task tidak ditemukan",
      });
    }
    const group = await Group.findById(task.groups);
    const reply = await Comment.create({
      task: taskId,
      user: userId,
      text,
      parentComment: parent._id,
      depth: parent.depth + 1,
    });

    await createActivity({
      user: userId,
      workspace: task.workspace,
      project: group?.project,
      group: group?._id,
      task: task._id,
      action: "REPLY_COMMENT",
      description: `User replied to comment on task ${task.nama}`,
      before: {},
      after: {
        text: reply.text,
        replyId: reply._id,
        parentCommentId: parent._id,
        groups: group?._id,
      },
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
  } catch (error) {
    return handleError(res, error);
  }
};
