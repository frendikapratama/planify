import express from "express";
import {
  create,
  get,
  edit,
  deleteKuarter,
  getById,
} from "../controllers/kuarterController.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authenticate, get);
router.post(
  "/",
  authenticate,
  authorize("project_manajer", "system_admin"),
  create
);
router.get("/:KuarterId", getById);
router.put(
  "/:KuarterId",
  authenticate,
  authorize("project_manajer", "system_admin"),
  edit
);
router.delete(
  "/:KuarterId",
  authenticate,
  authorize("system_admin"),
  deleteKuarter
);

export default router;
