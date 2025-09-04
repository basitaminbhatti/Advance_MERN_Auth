import { sendVerificationEmail, sendWelcomeEmail } from "../email/email.js";
import { User } from "../models/user.model.js";
import { generateTokenAndCookies } from "../utils/generateTokenAndCookies.js";
import bcrypt from "bcryptjs";

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

export const login = async (req, res) => {
  res.send("Login Controller");
};

export const logout = async (req, res) => {
  res.send("Logout Controller");
};
