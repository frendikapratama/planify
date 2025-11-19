import express from "express";
import {
  createUser,
  getUsers,
  getUserById,
  sendOTP,
  changePassword,
  updateUser,
  deleteUser,
} from "../controllers/userController.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

router.get("/me", authenticate, (req, res) => {
  res.json({ user: req.user });

  //   const user = req.user.toObject();
  //   delete user.password;
  //   delete user.resetOTP;
  //   delete user.resetOTPExpire;
  //   delete user.__v;

  //  res.json({ user });
});

router.post("/", createUser);

router.get("/", getUsers);
router.put("/:id", authenticate, updateUser);
router.get("/:id", authenticate, getUserById);
router.delete("/:id", authenticate, deleteUser);

router.post("/forget-password", sendOTP);
router.post("/change-password", changePassword);

export default router;
