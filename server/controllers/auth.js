import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import nodemailer from "nodemailer";

/* REGISTER USER */
export const register = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      picturePath,
      friends,
      location,
      about,
    } = req.body;

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new User({
      firstName,
      lastName,
      email,
      password: passwordHash,
      picturePath: req.file?.filename || picturePath,
      friends,
      location,
      about,
    });
    const savedUser = await newUser.save();
    const user = savedUser.toObject();
    delete user.password;
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* LOGGING IN */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email });
    if (!user) return res.status(400).json({ msg: "User does not exist. " });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials. " });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    const safeUser = user.toObject();
    delete safeUser.password;
    res.status(200).json({ token, user: safeUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


export const forgot = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User does not exist." });
    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
      return res.status(503).json({ message: "Password reset email is not configured." });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });
    const clientUrl = (process.env.CLIENT_URL || "http://localhost:3000").replace(
      /\/$/,
      ""
    );
    const resetLink = `${clientUrl}/reset/${token}`;

    await transporter.sendMail({
      to: user.email,
      subject: "Password Reset",
      html: `Click <a href="${resetLink}">here</a> to reset your password.`,
    });

    res.json({ message: "Password reset link sent." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const reset = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters." });
    }
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).json({ message: "Token is invalid or has expired." });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: "Password has been reset." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};