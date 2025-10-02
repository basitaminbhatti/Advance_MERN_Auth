# Advanced MERN Authentication Setup

This guide will help you set up a MERN (MongoDB, Express, React,
Node.js) project with authentication features.

---

## Project Structure

Create two main folders:

- **backend**
- **frontend**

---

# Backend Setup

## Initialize Backend

1.  Create a `package.json` file:

```bash
npm init -y
```

2.  Install required dependencies:

```bash
npm install express cookie-parser mailtrap bcryptjs dotenv jsonwebtoken mongoose crypto
```

3.  Install development dependency:

```bash
npm install nodemon -D
```

4. Install `cors` for handling cross-origin requests:

```bash
npm install cors
```

---

## Setup Backend

1.  Create a file named `index.js` inside the **backend** folder (you
    can name it `app.js` or `main.js` if you prefer).

2.  Update `package.json`:

- Change type to `module` (for ES module imports):

```json
"type": "module",
```

- Update the `main` entry:

```json
"main": "backend/index.js",
```

- Add a script for running the server with `nodemon`:

```json
"scripts": {
  "dev": "nodemon backend/index.js"
}
```

---

## Basic Express Server

Inside **backend/index.js**:

```javascript
import express from "express";

const app = express();

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

export default app;
```

---

## Setup MongoDB

1.  Go to [MongoDB](https://www.mongodb.com/).
2.  Create a **Project** and name it.
3.  Create a **Cluster** (choose the free option).
4.  Wait for the cluster to be ready.
5.  Create a **Database User** and copy the password.
6.  Copy the **Connection String**.

---

## Environment Variables

Create a `.env` file in your backend folder and add your MongoDB URI:

```env
MONGO_URI=mongodb+srv://your_user:<PASSWORD>@cluster0.mongodb.net/<DatabaseName>?retryWrites=true&w=majority
```

And replace `<PASSWORD>` with the password you created for the database user.

Also add a database name other than its create a default with name test.

---

## Allow Network Access

In MongoDB Atlas, go to **Network Access** and allow connections from
**Anywhere (0.0.0.0/0)**.

---

✅ Your backend is now set up and connected to MongoDB!

---

## Connect to MongoDB

1.  Inside the **backend** folder, create a directory named `db`.
2.  Inside `db`, create a file called `connectDB.js`.

In `connectDB.js`, add the following code:

```javascript
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1); // Exit the process with failure
  }
};

export default connectDB;
```

3.  Import and call `connectDB` inside **backend/index.js** so the
    connection is established when the server starts.
    - ⚠️ Remember to add `.js` at the end when importing local
      modules.

```javascript
import connectDB from "./db/connectDB.js";

app.listen(3000, () => {
  connectDB();
  console.log("Server is running on port 3000");
});
```

✅ Your backend is now set up and connected to MongoDB!

---

## Setup Routes

1.  Inside the **backend** folder, create a directory named `routes`.
2.  Create a file called `auth.route.js` inside the `routes` folder.

Add the following code:

```javascript
import express from "express";

const router = express.Router();

router.get("/signup", (req, res) => {
  res.send("Signup Route");
});

router.get("/login", (req, res) => {
  res.send("Login Route");
});

router.get("/logout", (req, res) => {
  res.send("Logout Route");
});

export default router;
```

3.  Now in **backend/index.js**, import and use the `auth` routes:

```javascript
import authRoutes from "./routes/auth.route.js";

app.use("/api/auth", authRoutes);
```

---

---

## Setup Controllers

1.  Inside the **backend** folder, create a directory named
    `controllers`.
2.  Create a file called `auth.controller.js` inside the `controllers`
    folder.

Add the following code:

```javascript
export const signup = async (req, res) => {
  res.send("Signup Controller");
};

export const login = async (req, res) => {
  res.send("Login Controller");
};

export const logout = async (req, res) => {
  res.send("Logout Controller");
};
```

---

## Update Routes to Use Controllers

Modify **backend/routes/auth.route.js**:

```javascript
import express from "express";
import { signup, login, logout } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

export default router;
```

---

## Create User Model

1.  Inside the **backend** folder, create a directory named `models`.
2.  Create a file called `user.model.js` inside the `models` folder.

Add the following schema:

```javascript
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    lastlogin: {
      type: Date,
      default: Date.now,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    resetPasswordToken: String,
    resetPasswordExpireAt: Date,
    verificationToken: String,
    verificationTokenExpireAt: Date,
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
```

---

## Update Server Port

In **backend/index.js**, configure the server to use the `PORT` from
`.env`:

```javascript
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  connectDB();
  console.log(`Server is running on port ${PORT}`);
});
```

---

Now update a `.env` file in the **backend** folder with the following content:

```env
PORT=5000
```

---

### Middleware

---

Now add a middleware in **backend/index.js** to parse incoming JSON requests:

```javascript
app.use(express.json()); // Middleware to parse JSON requests
```

---

## Signup Controller

- Now in controllers folder auth.controller.js we setup signup process.
  - First we check and validate the user input.
  - Then we check if the user already exists.
  - Then we hash the password using bcryptjs.
- Then we create a verification token.
- Then we create a new user and save it to the database.
- Then we generate a JWT token and set it in cookies.

```javascript
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

    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error creating user", error });
  }
};
```

---

## JWT Token and Cookies

- Now for generating JWT token and setting it in cookies we create a new folder named `utils` inside the **backend** folder.
- Inside the `utils` folder create a file named `generateTokenAndCookies.js` and add the following code:

```javascript
import jwt from "jsonwebtoken";

export const generateTokenAndCookies = (res, userId) => {
  // Generate JWT
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  // Set Cookies
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 3600000, // 1 hour
  });

  return token;
};
```

- Now add `JWT_SECRET` to your `.env` file:

```env
JWT_SECRET=your_jwt_secret_key
```

---

## Mailtrap

- Now setting up email service using Mailtrap.

  - Go to [Mailtrap](https://mailtrap.io/) and create a free account.
  - Go to Sending Domains
  - Select `demomailtrap.com` or add your own domain.
  - Click on Integration and select Transactional Stream.
  - select `Node.js` and copy the API settings.

---

### Mailtrap Config

- Now create a folder named `email` inside the **backend** folder.
- Inside the `email` folder create a file named `sendEmail.config.js` and add the following code:

```javascript
import { MailtrapClient } from "mailtrap";
import dotenv from "dotenv";

dotenv.config();
const TOKEN = process.env.MAILTRAP_TOKEN;

export const client = new MailtrapClient({
  token: TOKEN,
});

export const sender = {
  email: "hello@demomailtrap.com",
  name: "Advance MERN Auth App",
};
```

- Now add `MAILTRAP_TOKEN` to your `.env` file:

```env
MAILTRAP_TOKEN=your_mailtrap_token_here
```

---

### Email Utility

- Now create a file named `email.js` inside the `email` folder:

- Inside `email.js` import the config from `sendEmail.config.js`

```javascript
import { client, sender } from "./sendEmail.config.js";
```

---

### Send Verification Email

- For Signup email verification add the following function in `email.js`:

```javascript
export const sendVerificationEmail = async (email, verificationToken) => {
  const text = `Your verification code is ${verificationToken}`;

  const recipients = [{ email }];

  try {
    const response = await client.send({
      from: sender,
      to: recipients,
      subject: "Verify your email",
      text,
    });
    console.log("Verification email sent", response);
  } catch (error) {
    console.error("Error sending verification email:", error);
  }
};
```

---

### Use in Signup Controller

- Now import and use this function in `signup` controller in
  **backend/controllers/auth.controller.js**:

```javascript
import { sendVerificationEmail } from "../email/email.js";
// Send Verification Email
await sendVerificationEmail(email, verificationToken);
```

---

## Verification Route and Controller

- Now create a new route for email verification in
  **backend/routes/auth.route.js**:

```javascript
router.post("/verify-email", verifyEmail);
```

- Now create the `verifyEmail` controller in
  **backend/controllers/auth.controller.js**:

```javascript
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

    res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("Error verifying email:", error);
    res.status(500).json({ message: "Error verifying email", error });
  }
};
```

---

### Welcome Email

- For Welcome email add the following function in `email.js`:

```javascript
export const sendWelcomeEmail = async (email, name) => {
  const text = `Welcome to our platform, ${name}! We're glad to have you on board.`;
  const recipients = [{ email }];
  try {
    const response = await client.send({
      from: sender,
      to: recipients,
      subject: "Welcome to Our Platform",
      text,
    });
    console.log("Welcome email sent", response);
  } catch (error) {
    console.error("Error sending welcome email:", error);
  }
};
```

- Now import and use this function in `verifyEmail` controller in
  **backend/controllers/auth.controller.js**:

```javascript
import { sendWelcomeEmail } from "../email/email.js";
// Send Welcome Email
await sendWelcomeEmail(user.email, user.name);
```

---

## Login Controller

- Now in controllers folder auth.controller.js we setup login process.
  - First we check and validate the user input.
  - Then we check if the user exists.
  - Then we check if the password is correct.
  - If everything is fine, we generate a JWT token and set it in cookies.
  - Then we update the last login time.

```javascript
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
```

---

## Logout Controller

- Now in controllers folder auth.controller.js we setup logout process.
  - We clear the token cookie.

```javascript
export const logout = async (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ message: "Logged out successfully" });
};
```

---

## Forgot Password

- Now create a new route for forgot password in
  **backend/routes/auth.route.js**:

```javascript
router.post("/forgot-password", forgotPassword);
```

- Now create the `forgotPassword` controller in
  **backend/controllers/auth.controller.js**:
- We check if the email is provided.
- We check if the user exists.
- We generate a reset token and set its expiry.
- We send a password reset email with the reset link.

```javascript
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
```

### Password Reset Email

- For Password Reset email add the following function in `email.js`:

```javascript
export const sendPasswordResetEmail = async (email, resetLink) => {
  const text = `You requested a password reset. Use the following link to reset your password: ${resetLink}. If you did not request this, please ignore this email.`;
  const recipients = [{ email }];
  try {
    const response = await client.send({
      from: sender,
      to: recipients,
      subject: "Password Reset Request",
      text,
    });
    console.log("Password reset email sent", response);
  } catch (error) {
    console.error("Error sending password reset email:", error);
  }
};
```

- Now import and use this function in `forgotPassword` controller in
  **backend/controllers/auth.controller.js**:

```javascript
import { sendPasswordResetEmail } from "../email/email.js";
```

---

## Reset Password Controller

- Now create a new route for reset password in
  **backend/routes/auth.route.js**:

```javascript
router.post("/reset-password/:token", resetPassword);
```

- Now create the `resetPassword` controller in
  **backend/controllers/auth.controller.js**:
- We get the token from params and new password from body.
- We check if the token is valid and not expired.
- We hash the new password and update the user record.

```javascript
export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;
  try {
    // Check if new password is provided
    if (!newPassword) {
      return res.status(400).json({ message: "New password is required" });
    }
    // Find user by reset token and check if token is not expired
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpireAt: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpireAt = undefined;

    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Error resetting password", error });
  }
};
```

---

## Check Auth Middleware

- Now create a new route for checking authentication in
  **backend/routes/auth.route.js**:

```javascript
router.get("/check-auth", verifyToken, checkAuth);
```

- Now we create a new folder named `middleware` inside the **backend** folder.
- Inside the `middleware` folder create a file named `verifyToken.js` and add the following code:

```javascript
import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return res.status(401).json({ message: "Token is not valid" });
    }
    req.userId = decoded.id;
    next();
  } catch (error) {
    console.error("Error verifying token:", error);
    res.status(500).json({ message: "Error verifying token", error });
  }
};
```

Add `cookie-parser` middleware in **backend/index.js** to parse cookies:

```javascript
import cookieParser from "cookie-parser";

app.use(cookieParser()); // Middleware to parse cookies
```

- Now create the `checkAuth` controller in
  **backend/controllers/auth.controller.js**:
- We simply return a success message if the user is authenticated.

```javascript
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
```

# Frontend Setup

## Initialize Frontend

1.  Navigate to the **frontend** folder.
2.  Create a React app using Vite:

```bash
npm create vite@latest . -- --template react
```

3. Tailwind CSS Setup

```bash
npm install tailwindcss @tailwindcss/vite
```

4. Configure the Vite plugin

- In `vite.config.js`, add the Tailwind CSS plugin:

```javascript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

5. In index.css, add the Tailwind directives:

```css
@import "tailwindcss";
```

6. Install additional dependencies:

```bash
npm install framer-motion react-router-dom lucide-react
```

7. In `main.jsx`, wrap the App component with **BrowserRouter**:

```javascript
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
```

## Frontend Background

- Create a folder named `components` inside the **frontend/src** folder.
- Inside the `components` folder create a file named `FloatingShape.jsx` and add the following code:

```javascript
import { motion } from "framer-motion";

const FloatingShape = ({ color, size, top, left, delay }) => {
  return (
    <motion.div
      className={`absolute rounded-full ${color} ${size} opacity-20 blur-xl`}
      style={{ top, left }}
      animate={{
        y: ["0%", "100%", "0%"],
        x: ["0%", "100%", "0%"],
        rotate: [0, 360],
      }}
      transition={{
        duration: 20,
        ease: "linear",
        repeat: Infinity,
        delay,
      }}
      aria-hidden="true"
    />
  );
};
export default FloatingShape;
```

- Now in **frontend/src/App.jsx** import and use the `FloatingShape` component to create a dynamic background:

```jsx
import React from "react";
import FloatingShape from "./components/FloatingShape";

function App() {
  return (
    <div
      className="min-h-screen bg-gradient-to-br
    from-gray-900 via-blue-900 to-cyan-900 flex items-center justify-center relative overflow-hidden"
    >
      <FloatingShape
        color="bg-blue-500"
        size="w-64 h-64"
        top="-5%"
        left="10%"
        delay={0}
      />
      <FloatingShape
        color="bg-cyan-500"
        size="w-48 h-48"
        top="70%"
        left="80%"
        delay={5}
      />
      <FloatingShape
        color="bg-lime-500"
        size="w-32 h-32"
        top="40%"
        left="-10%"
        delay={2}
      />
      App
    </div>
  );
}

export default App;
```

## React Router Setup

- Now in **frontend/src/App.jsx** set up the routes using React Router:

```jsx
import { Routes, Route } from "react-router-dom";

<Routes>
  <Route path="/" element={<DashboardPage />} />
  <Route path="/login" element={<LoginPage />} />
  <Route path="/signup" element={<SignupPage />} />
  <Route path="/verify-email" element={<VerifyEmailPage />} />
  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
  <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
  <Route path="*" element={<NotFoundPage />} />
</Routes>;
```

## Create Page Components

- Create a folder named `pages` inside the **frontend/src** folder.
- Inside the `pages` folder create the following files:
  - `DashboardPage.jsx`
  - `LoginPage.jsx`
  - `SignupPage.jsx`
  - `VerifyEmailPage.jsx`
  - `ForgotPasswordPage.jsx`
  - `ResetPasswordPage.jsx`
  - `NotFoundPage.jsx`
- Add basic structure to each page component. For example, in `LoginPage.jsx`:

```jsx
import React from "react";
const LoginPage = () => {
  return (
    <div className="text-white text-3xl">
      <h1>Login Page</h1>
    </div>
  );
};
export default LoginPage;
```

- Repeat similar structure for other page components.
- Import all page components in **frontend/src/App.jsx**:

```jsx
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import NotFoundPage from "./pages/NotFoundPage";
```

## Signup Page Layout

- Now in **frontend/src/pages/SignupPage.jsx** create a signup form layout:

```jsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Lock } from "lucide-react";
import Input from "../components/Input";
import PasswordStrengthMeter from "../components/PasswordStrengthMeter";
import { Link } from "react-router-dom";

function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-md w-full bg-gray-800 bg-opacity-50 backdrop-filter backdrop-blur-xl rounded-2xl shadow-xl 
			overflow-hidden"
    >
      <div className="p-8">
        <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-blue-400 to-cyan-500 text-transparent bg-clip-text">
          Create Account
        </h2>
        <form>
          <Input
            icon={User}
            type="text"
            placeholder="Full Name"
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            icon={Mail}
            type="email"
            placeholder="Email Address"
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            icon={Lock}
            type="password"
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
          />
          <PasswordStrengthMeter password={password} />
          <motion.button
            className="mt-5 w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-cyan-600 text-white 
						font-bold rounded-lg shadow-lg hover:from-blue-600
						hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
						 focus:ring-offset-gray-900 transition duration-200 cursor-pointer"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
          >
            Sign Up
          </motion.button>
        </form>
      </div>
      <div className="px-8 py-4 bg-gray-900 bg-opacity-50 flex justify-center">
        <p className="text-sm text-gray-400">
          Already have an account?{" "}
          <Link to={"/login"} className="text-blue-400 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </motion.div>
  );
}

export default SignupPage;
```

- Create an `Input` component in **frontend/src/components/Input.jsx**:

```javascript
const Input = ({ icon: Icon, ...props }) => {
  return (
    <div className="relative mb-6">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <Icon className="size-5 text-blue-500" />
      </div>
      <input
        {...props}
        className="w-full pl-10 pr-3 py-2 bg-gray-800 bg-opacity-50 rounded-lg border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400 transition duration-200"
      />
    </div>
  );
};
export default Input;
```

- Create a `PasswordStrengthMeter` component in **frontend/src/components/PasswordStrengthMeter.jsx**:

```jsx
import { Check, X } from "lucide-react";

const PasswordCriteria = ({ password }) => {
  const criteria = [
    { label: "At least 6 characters", met: password.length >= 6 },
    { label: "Contains uppercase letter", met: /[A-Z]/.test(password) },
    { label: "Contains lowercase letter", met: /[a-z]/.test(password) },
    { label: "Contains a number", met: /\d/.test(password) },
    { label: "Contains special character", met: /[^A-Za-z0-9]/.test(password) },
  ];

  return (
    <div className="mt-2 space-y-1">
      {criteria.map((item) => (
        <div key={item.label} className="flex items-center text-xs">
          {item.met ? (
            <Check className="size-4 text-blue-500 mr-2" />
          ) : (
            <X className="size-4 text-gray-500 mr-2" />
          )}
          <span className={item.met ? "text-blue-500" : "text-gray-400"}>
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
};

const PasswordStrengthMeter = ({ password }) => {
  const getStrength = (pass) => {
    let strength = 0;
    if (pass.length >= 1) strength++;
    if (pass.match(/[a-z]/) && pass.match(/[A-Z]/)) strength++;
    if (pass.match(/\d/)) strength++;
    if (pass.match(/[^a-zA-Z\d]/)) strength++;
    return strength;
  };
  const strength = getStrength(password);

  const getColor = (strength) => {
    if (strength === 0) return "bg-red-500";
    if (strength === 1) return "bg-red-400";
    if (strength === 2) return "bg-yellow-500";
    if (strength === 3) return "bg-yellow-400";
    return "bg-blue-500";
  };

  const getStrengthText = (strength) => {
    if (strength === 0) return "Very Weak";
    if (strength === 1) return "Weak";
    if (strength === 2) return "Fair";
    if (strength === 3) return "Good";
    return "Strong";
  };

  return (
    <div className="mt-2">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-gray-400">Password strength</span>
        <span className="text-xs text-gray-400">
          {getStrengthText(strength)}
        </span>
      </div>

      <div className="flex space-x-1">
        {[...Array(4)].map((_, index) => (
          <div
            key={index}
            className={`h-1 w-1/4 rounded-full transition-colors duration-300 
                ${index < strength ? getColor(strength) : "bg-gray-600"}
              `}
          />
        ))}
      </div>
      <PasswordCriteria password={password} />
    </div>
  );
};
export default PasswordStrengthMeter;
```

## Login Page Layout

- Now in **frontend/src/pages/LoginPage.jsx** create a login form layout:

```jsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock } from "lucide-react";
import Input from "../components/Input";
import { Link } from "react-router-dom";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-md w-full bg-gray-800 bg-opacity-50 backdrop-filter backdrop-blur-xl rounded-2xl shadow-xl 
      overflow-hidden"
    >
      <div className="p-8">
        <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-blue-400 to-cyan-500 text-transparent bg-clip-text">
          Welcome Back
        </h2>
        <form>
          <Input
            icon={Mail}
            type="email"
            placeholder="Email Address"
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            icon={Lock}
            type="password"
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="flex items-center justify-between mt-2 mb-4">
            <Link
              to="/forgot-password"
              className="text-sm text-blue-400 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <motion.button
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-bold rounded-lg shadow-lg hover:from-blue-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition duration-200 cursor-pointer"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
          >
            Login
          </motion.button>
        </form>
      </div>
      <div className="px-8 py-4 bg-gray-900 bg-opacity-50 flex justify-center">
        <p className="text-sm text-gray-400">
          Don't have an account?{" "}
          <Link to={"/signup"} className="text-blue-400 hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </motion.div>
  );
}

export default LoginPage;
```

## Verify Email Page Layout

- Now in **frontend/src/pages/VerifyEmailPage.jsx** create a verify email form layout:

```jsx
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

function VerifyEmailPage() {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // ===================== Auto Focus First Input =====================
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // ===================== Handle Change =====================
  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // Only digits allowed

    const newCode = [...code];
    newCode[index] = value.slice(-1); // Only keep the last digit
    setCode(newCode);

    // Handle pasted content (if more than one digit entered)
    if (value.length > 1) {
      const pastedCode = value.slice(0, 6).split("");
      for (let i = 0; i < 6; i++) {
        newCode[i] = pastedCode[i] || "";
      }
      setCode(newCode);

      // Focus the last filled input
      const lastIndex = Math.min(pastedCode.length, 6) - 1;
      inputRefs.current[lastIndex]?.focus();
    } else {
      // Move focus to the next input if value is entered
      if (value && index < 5) {
        inputRefs.current[index + 1].focus();
      }
    }
  };

  // ===================== Handle Key Down =====================
  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  // ===================== Handle Submit =====================
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const verificationCode = code.join("");
    alert(`Verification Code Entered: ${verificationCode}`);
    setIsLoading(true);
    // You can call your API here
  };

  // ===================== Auto Submit When All Digits Are Entered =====================
  useEffect(() => {
    if (code.every((digit) => digit !== "")) {
      handleSubmit();
    }
  }, [code]);

  return (
    <div className="max-w-md w-full bg-gray-800 bg-opacity-50 backdrop-filter backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gray-800 bg-opacity-50 backdrop-filter backdrop-blur-xl rounded-2xl shadow-2xl p-8 w-full max-w-md"
      >
        <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-blue-400 to-cyan-500 text-transparent bg-clip-text">
          Verify Your Email
        </h2>
        <p className="text-center text-gray-300 mb-6">
          Enter the 6-digit code sent to your email address.
        </p>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="flex justify-between">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                maxLength="1" // FIXED: only one digit per box
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-12 text-center text-2xl font-bold bg-gray-700 text-white border-2 border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            ))}
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={isLoading || code.some((digit) => !digit)}
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:from-blue-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? "Verifying..." : "Verify Email"}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}

export default VerifyEmailPage;
```

## Dashboard Page Layout

- Now in **frontend/src/pages/DashboardPage.jsx** create a dashboard layout:

```jsx
import { motion } from "framer-motion";

const DashboardPage = () => {
  const user = {
    name: "John Doe",
    email: "john.doe@example.com",
    createdAt: "2023-01-15T10:00:00Z",
  };
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.5 }}
      className="max-w-md w-full mx-auto mt-10 p-8 bg-gray-900 bg-opacity-80 backdrop-filter backdrop-blur-lg rounded-xl shadow-2xl border border-gray-800"
    >
      <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-blue-400 to-cyan-600 text-transparent bg-clip-text">
        Dashboard
      </h2>

      <div className="space-y-6">
        <motion.div
          className="p-4 bg-gray-800 bg-opacity-50 rounded-lg border border-gray-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-xl font-semibold text-blue-400 mb-3">
            Profile Information
          </h3>
          <p className="text-gray-300">Name: {user.name}</p>
          <p className="text-gray-300">Email: {user.email}</p>
        </motion.div>
        <motion.div
          className="p-4 bg-gray-800 bg-opacity-50 rounded-lg border border-gray-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-xl font-semibold text-blue-400 mb-3">
            Account Activity
          </h3>
          <p className="text-gray-300">
            <span className="font-bold">Joined: </span>
            {new Date(user.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          <p className="text-gray-300">
            <span className="font-bold">Last Login: </span>
            {new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-4"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-cyan-600 text-white 
				font-bold rounded-lg shadow-lg hover:from-blue-600 hover:to-cyan-700
				 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
        >
          Logout
        </motion.button>
      </motion.div>
    </motion.div>
  );
};
export default DashboardPage;
```

## Forgot Password Page Layout

- Now in **frontend/src/pages/ForgotPasswordPage.jsx** create a forgot password form layout:

```jsx
import { motion } from "framer-motion";
import { useState } from "react";
import Input from "../components/Input";
import { ArrowLeft, Loader, Mail } from "lucide-react";
import { Link } from "react-router-dom";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const isLoading = false;

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Forgot password link sent to:", email);
    setIsSubmitted(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-md w-full bg-gray-800 bg-opacity-50 backdrop-filter backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden"
    >
      <div className="p-8">
        <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-blue-400 to-cyan-500 text-transparent bg-clip-text">
          Forgot Password
        </h2>

        {!isSubmitted ? (
          <form onSubmit={handleSubmit}>
            <p className="text-gray-300 mb-6 text-center">
              Enter your email address and we'll send you a link to reset your
              password.
            </p>
            <Input
              icon={Mail}
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-bold rounded-lg shadow-lg hover:from-blue-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition duration-200"
              type="submit"
            >
              {isLoading ? (
                <Loader className="size-6 animate-spin mx-auto" />
              ) : (
                "Send Reset Link"
              )}
            </motion.button>
          </form>
        ) : (
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <Mail className="h-8 w-8 text-white" />
            </motion.div>
            <p className="text-gray-300 mb-6">
              If an account exists for {email}, you will receive a password
              reset link shortly.
            </p>
          </div>
        )}
      </div>

      <div className="px-8 py-4 bg-gray-900 bg-opacity-50 flex justify-center">
        <Link
          to={"/login"}
          className="text-sm text-blue-400 hover:underline flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Login
        </Link>
      </div>
    </motion.div>
  );
};
export default ForgotPasswordPage;
```

## Reset Password Page Layout

- Now in **frontend/src/pages/ResetPasswordPage.jsx** create a reset password form layout:

```jsx
import { useState } from "react";
import { motion } from "framer-motion";
import Input from "../components/Input";
import { Lock } from "lucide-react";

const ResetPasswordPage = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const isLoading = false;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    console.log("Password has been reset to:", password);
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-md w-full bg-gray-800 bg-opacity-50 backdrop-filter backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden"
    >
      <div className="p-8">
        <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-blue-400 to-cyan-500 text-transparent bg-clip-text">
          Reset Password
        </h2>

        <form onSubmit={handleSubmit}>
          <Input
            icon={Lock}
            type="password"
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Input
            icon={Lock}
            type="password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-bold rounded-lg shadow-lg hover:from-blue-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition duration-200"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Resetting..." : "Set New Password"}
          </motion.button>
        </form>
      </div>
    </motion.div>
  );
};
export default ResetPasswordPage;
```

## Zustand Store Setup

```bash
npm install zustand axios
```

- Now create a folder named `store` inside the **frontend/src** folder.
- Inside the `store` folder create a file named `useAuthStore.js` and add the following code:

```javascript
import { create } from "zustand";
import axios from "axios";

const API_URL = "http://localhost:5000/api/auth";

axios.defaults.withCredentials = true; // Enable sending cookies with requests

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  error: null,
  isLoading: false,
  isCheckingAuth: true,
}));
```

- Add `cors` middleware in **backend/index.js** to handle cross-origin requests:

```javascript
import cors from "cors";

app.use(cors({ origin: "http://localhost:5173", credentials: true })); // Middleware to enable CORS
```

## Signup Action

- In `useAuthStore.js` and add the following code:

```javascript
  signup: async (email, password, name) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(`${API_URL}/signup`, {
        email,
        password,
        name,
      });
      set({
        isLoading: false,
        user: response.data.user,
        isAuthenticated: true,
      });
    } catch (error) {
      set({ isLoading: false, error: error.response.data.message });
      throw error;
    }
  },
```

- Now you can use this store in your components. For example, in `SignupPage.jsx`:

```jsx
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";

const { signup, error, isLoading } = useAuthStore();

const navigate = useNavigate();

const handleSignup = async (e) => {
  e.preventDefault();
  try {
    await signup(email, password, name);
    navigate("/verify-email");
  } catch (error) {
    console.error("Signup failed:", error);
  }
};
```

## Verify Email Action

- In `useAuthStore.js` and add the following code:

```javascript
  verifyEmail: async (code) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(`${API_URL}/verify-email`, { code });
      set({
        isLoading: false,
        user: response.data.user,
        isAuthenticated: true,
      });
      return response;
    } catch (error) {
      set({ isLoading: false, error: error.response.data.message });
      throw error;
    }
  },
```

- Now you can use this store in your components. For example, in `VerifyEmailPage.jsx`:

```jsx
import { useAuthStore } from "../../store/useAuthStore";
const { verifyEmail, error, isLoading } = useAuthStore();

const handleSubmit = async (e) => {
  if (e) e.preventDefault();
  const verificationCode = code.join("");
  try {
    await verifyEmail(verificationCode);
    navigate("/");
  } catch (err) {
    console.error("Verification failed:", err);
  }
};
```

## Check Auth Action

- In `useAuthStore.js` and add the following code:

```javascript
  checkAuth: async () => {
    set({ isCheckingAuth: true, error: null });
    try {
      const response = await axios.get(`${API_URL}/check-auth`);
      set({
        isCheckingAuth: false,
        user: response.data.user,
        isAuthenticated: true,
      });
    } catch (error) {
      set({ isCheckingAuth: false, user: null, isAuthenticated: false });
      throw error;
    }
  },
```

- Now you can use this store in your components. For example, in `App.jsx`:

```jsx
import { useEffect } from "react";
import { useAuthStore } from "./store/useAuthStore";

const { checkAuth, isCheckingAuth, isAuthenticated } = useAuthStore();

useEffect(() => {
  checkAuth();
}, [checkAuth]);

console.log("Auth Status:", { isCheckingAuth, isAuthenticated });
```

- Now you can protect your routes based on authentication status. For example, in `App.jsx`:

```jsx
// protect routes that require authentication
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user.isVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  return children;
};
// redirect authenticated users away from login/signup pages
const RedirectAuthenticatedUser = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated && user.isVerified) {
    return <Navigate to="/" replace />;
  }

  return children;
};

<Route
  path="/"
  element={
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  }
/>;
<Route
  path="/signup"
  element={
    <RedirectAuthenticatedUser>
      <SignUpPage />
    </RedirectAuthenticatedUser>
  }
/>;
```

- Add loading state in `App.jsx`:

```jsx
import LoadingSpinner from "./components/LoadingSpinner";

if (isCheckingAuth) {
  return <LoadingSpinner />;
}
```

## Login Action

- In `useAuthStore.js` and add the following code:

```javascript
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(`${API_URL}/login`, {
        email,
        password,
      });
      set({
        isLoading: false,
        user: response.data.user,
        isAuthenticated: true,
      });
    } catch (error) {
      set({ isLoading: false, error: error.response.data.message });
      throw error;
    }
  },
```

- Now you can use this store in your components. For example, in `LoginPage.jsx`:

```jsx
import { useAuthStore } from "../../store/useAuthStore";

const { login, error, isLoading } = useAuthStore();

const handleLogin = async (e) => {
  e.preventDefault();
  await login(email, password);
};
```

## Logout Action

- In `useAuthStore.js` and add the following code:

```javascript
  logout: async () => {
    set({ isLoading: true, error: null });
    try {
      await axios.post(`${API_URL}/logout`);
      set({
        isLoading: false,
        user: null,
        isAuthenticated: false,
        error: null,
      });
    } catch (error) {
      set({ isLoading: false, error: error.response.data.message });
      throw error;
    }
  },
```

## Forgot Password Action

- In `useAuthStore.js` and add the following code:

```javascript
  forgotPassword: async (email) => {
    set({ isLoading: true, error: null, message: null });
    try {
      const response = await axios.post(`${API_URL}/forgot-password`, {
        email,
      });
      set({ message: response.data.message, isLoading: false });
      return response;
    } catch (error) {
      set({ isLoading: false, error: error.response.data.message });
      throw error;
    }
  },
```

- Now you can use this store in your components. For example, in `ForgotPasswordPage.jsx`:

```jsx
import { useAuthStore } from "../../store/useAuthStore";
const { forgotPassword, error, isLoading } = useAuthStore();
const { isLoading, forgotPassword } = useAuthStore();

const handleSubmit = async (e) => {
  e.preventDefault();
  await forgotPassword(email);
  setIsSubmitted(true);
};
```

## Reset Password Action

- In `useAuthStore.js` and add the following code:

```javascript
  resetPassword: async (token, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(`${API_URL}/reset-password/${token}`, {
        password,
      });
      set({ message: response.data.message, isLoading: false });
      return response;
    } catch (error) {
      set({
        isLoading: false,
        error: error.response.data.message || "Error resetting password",
      });
      throw error;
    }
  },
```

- Now you can use this store in your components. For example, in `ResetPasswordPage.jsx`:

```jsx
import { useAuthStore } from "../../store/useAuthStore";
import { useNavigate, useParams } from "react-router-dom";

const { resetPassword, error, isLoading, message } = useAuthStore();

const { token } = useParams();
const navigate = useNavigate();

const handleSubmit = async (e) => {
  e.preventDefault();

  if (password !== confirmPassword) {
    alert("Passwords do not match");
    return;
  }
  try {
    await resetPassword(token, password);
    navigate("/login");
  } catch (err) {
    console.error("Reset password failed:", err);
  }
};
```

## Dashboard Setup

- Create a util function to format date in **frontend/src/utils/formatDate.js**:

```javascript
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return "Invalid Date";
  }

  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};
```

- In `DashboardPage.jsx` use the user data from the store:

```jsx
import { useAuthStore } from "../../store/useAuthStore";
const { user } = useAuthStore();
```

- Logout button functionality:

```jsx
const { user, logout } = useAuthStore();

const handleLogout = async () => {
  try {
    await logout();
  } catch (error) {
    console.error("Logout failed:", error);
  }
};
```

# Deployment

- We will deploy the backend and frontend applications using Render.com

- Create a script to start both backend and frontend servers in **package.json**:

```json
"scripts": {
		"dev": "NODE_ENV=development nodemon backend/index.js",
		"start": "NODE_ENV=production node backend/index.js",
		"build": "npm install && npm install --prefix frontend && npm run build --prefix frontend"
	},
```

- In `index.js` import the `path` module and add the following code to serve the React build files in production:

```javascript
import path from "path";

const __dirname = path.resolve();

// Serve static files from the React app in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "frontend", "dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "frontend", "dist", "index.html"));
  });
}
```

- Now in "useAuthStore.js" change the `API_URL` to:

```javascript
const API_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:5000/api/auth"
    : "/api/auth";
```
