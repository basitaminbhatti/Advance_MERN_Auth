# Advanced MERN Authentication Setup

This guide will help you set up a MERN (MongoDB, Express, React,
Node.js) project with authentication features.

---

## Project Structure

Create two main folders:

- **backend**
- **frontend**

---

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
