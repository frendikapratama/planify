import express from "express";
import {
  create,
  get,
  edit,
  deleteKuarter,
  getById,
} from "../controllers/kuarterController.js";
import { authenticate, requireSystemAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authenticate, get);
router.post("/", authenticate, requireSystemAdmin, create);
router.get("/:KuarterId", getById);
router.put("/:KuarterId", authenticate, edit);
router.delete("/:KuarterId", authenticate, deleteKuarter);

export default router;
