import User from "../models/User.js";
import { transporter } from "../utils/sendEmail.js";
import fs from "fs";

export async function getUsers(req, res) {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      role,
      departemen,
      divisi,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};

    if (role && role !== "all") {
      filter.role = role;
    }

    if (departemen && departemen !== "all") {
      filter.departemen = departemen;
    }
    if (divisi && divisi !== "all") {
      filter.divisi = divisi;
    }

    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [
        { username: regex },
        { email: regex },
        // { departemen: regex },
        // { divisi: regex },
      ];
    }

    const users = await User.find(filter)
      .select("-__v -password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);
    res.status(200).json({
      success: true,
      message: "get success",
      data: users,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.log(error);
  }
}

export async function getUserById(req, res) {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "user not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.log(error);
  }
}

export async function createUser(req, res) {
  try {
    const {
      username,
      email,
      password,
      noHp,
      departemen,
      divisi,
      posisi,
      role,
    } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    const user = new User({
      username,
      email,
      password,
      noHp,
      departemen,
      divisi,
      posisi,
      role,
    });
    await user.save();

    res.status(200).json({
      success: true,
      message: "User created successfully",
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({
      success: false,
      message: "gagal membuat user",
      error: error.message,
    });
  }
}

export async function updateUser(req, res) {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "user not found",
      });
    }

    const allowed = [
      "username",
      "email",
      "noHp",
      "departemen",
      "divisi",
      "posisi",
      "role",
    ];
    allowed.forEach((field) => {
      if (req.body[field]) user[field] = req.body[field];
    });

    if (req.file) {
      if (user.photo) {
        const oldPath = `uploads/users/${user.photo}`;
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      user.photo = req.file.filename;
    }
    await user.save();
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.log(error);
  }
}

export async function deletUser(req, res) {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    if (user.photo) {
      const oldPath = `uploads/users/${user.photo}`;
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: "user berhasil di hapus",
    });
  } catch (error) {
    console.log(error);
  }
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendOTP(req, res) {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const otp = generateOTP();
    user.resetOTP = otp;
    user.resetOTPExpire = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    await transporter.sendMail({
      from: "Support",
      to: email,
      subject: "Reset Password OTP",
      text: `Kode otp anda adalah ${otp}. dan akan berakhri dalam 5 menit.`,
    });

    res.json({ success: true, message: "OTP telah di kirim ke email anda" });
  } catch (error) {
    console.log(error);
  }
}

export async function changePassword(req, res) {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({
        success: false,
        message: "user not found",
      });

    if (user.resetOTP !== otp) {
      return res.status(400).json({
        success: false,
        message: "OTP Invalid",
      });
    }

    if (user.resetOTPExpire < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "OTP expired",
      });
    }

    user.password = newPassword;

    user.resetOTP = undefined;
    user.resetOTPExpire = undefined;

    await user.save();

    res.json({
      success: true,
      message: "success change password",
    });
  } catch (error) {
    console.log(error);
  }
}

export async function searchMekanik(req, res) {
  try {
    const { q } = req.query;

    let filter = { role: "mekanik" };
    if (q && q.trim() !== "") {
      filter.username = { $regex: q, $options: "i" };
    }
    const data = await User.find(filter).sort({ createdAt: -1 });

    res.json({
      success: true,
      message: "get succes",
      data,
    });
  } catch (error) {
    console.log(error);
  }
}

export async function searchKasie(req, res) {
  try {
    const { q } = req.query;

    let filter = { role: "kasie" };
    if (q && q.trim() !== "") {
      filter.username = { $regex: q, $options: "i" };
    }
    const data = await User.find(filter).sort({ createdAt: -1 });

    res.json({
      success: true,
      message: "get succes",
      data,
    });
  } catch (error) {
    console.log(error);
  }
}
