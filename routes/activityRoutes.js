import express from "express";
import {
  getActivityByProject,
  getAllActivity,
  getActivityByUser,
  getActivityByGroup,
  getActivityByKuarter,
  getActivityByKuarterWithFilters,
} from "../controllers/activityController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.get("/project/:projectId", authenticate, getActivityByProject);
router.get("/user/:userId", authenticate, getActivityByUser);
router.get("/all", authenticate, getAllActivity);
router.get("/group/:groupId", authenticate, getActivityByGroup);
router.get("/kuarter/:kuarterId", authenticate, getActivityByKuarter);
router.get(
  "/kuarter/:kuarterId/filter",
  authenticate,
  getActivityByKuarterWithFilters
);

export default router;
