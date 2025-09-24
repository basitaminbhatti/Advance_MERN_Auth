import {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendPasswordResetConfirmationEmail,
} from "../email/email.js";
import { User } from "../models/user.model.js";
import { generateTokenAndCookies } from "../utils/generateTokenAndCookies.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
// ====================== Sign Up Controller ======================

export const signup = async (req, res) => {
  const { email, password, name } = req.body;
  try {
    // Check if all fields are provided
    if (!email || !password || !name) {
      return res.status(400).json({ message: "All fields are required" });
    }
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }
    // Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Verification Token
    const verificationToken = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // Create User
    const user = new User({
      email,
      password: hashedPassword,
      name,
      verificationToken,
      verificationTokenExpireAt: Date.now() + 3600000, // 1 hour expiry
    });

    await user.save();

    // JWT
    generateTokenAndCookies(res, user._id);

    // Send Verification Email
    await sendVerificationEmail(email, verificationToken);

    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error creating user", error });
  }
};

// ====================== Verify Email Controller ======================
export const verifyEmail = async (req, res) => {
  const { code } = req.body;
  try {
    const user = await User.findOne({
      verificationToken: code,
      verificationTokenExpireAt: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired code" });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpireAt = undefined;
    await user.save();

    await sendWelcomeEmail(user.email, user.name);

    res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("Error verifying email:", error);
    res.status(500).json({ message: "Error verifying email", error });
  }
};

// ====================== Login Controller ======================
export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    // Check if all fields are provided
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    // Check if password is correct
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    // JWT
    generateTokenAndCookies(res, user._id);

    // Update last login
    user.lastlogin = Date.now();
    await user.save();

    res.status(200).json({ message: "Login successful" });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ message: "Error logging in", error });
  }
};

// ====================== Logout Controller ======================
export const logout = async (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ message: "Logged out successfully" });
};

// ====================== Forgot Password Controller ======================
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    // Check if email is provided
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Generate Reset Token
    const resetToken = crypto.randomBytes(20).toString("hex");
    const resetTokenExpireAt = Date.now() + 3600000; // 1 hour expiry

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpireAt = resetTokenExpireAt;

    await user.save();

    // Send Reset Email
    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    await sendPasswordResetEmail(email, resetLink);

    res.status(200).json({ message: "Password reset email sent" });
  } catch (error) {
    console.error("Error in forgot password:", error);
    res.status(500).json({ message: "Error in forgot password", error });
  }
};

// ====================== Reset Password Controller ======================
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Check if all fields are provided
    if (!password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpireAt: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // Update and Hash New Password
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpireAt = undefined;
    await user.save();

    await sendPasswordResetConfirmationEmail(user.email);

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Error resetting password", error });
  }
};

// ====================== Check Auth Controller ======================
export const checkAuth = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    console.log(user);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ user });
  } catch (error) {
    console.error("Error checking auth:", error);
    res.status(500).json({ message: "Error checking auth", error });
  }
};
