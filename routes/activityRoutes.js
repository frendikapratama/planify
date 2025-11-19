import express from "express";
import {
  getActivityByProject,
  getAllActivity,
  getActivityByUser,
  getActivityByGroup,
} from "../controllers/activityController.js";

const router = express.Router();

router.get("/project/:projectId", getActivityByProject);
router.get("/user/:userId", getActivityByUser);
router.get("/all", getAllActivity);
router.get("/group/:groupId", getActivityByGroup);

export default router;
