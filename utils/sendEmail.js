import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    // user: "frendikapratama28@gmail.com",
    // pass: "dlvpcuypehhywuuq"
    user: process.env.EMAIL_USER || "frendikapratama28@gmail.com",
    pass: process.env.EMAIL_PASS || "dlvpcuypehhywuuq",
  },
});
