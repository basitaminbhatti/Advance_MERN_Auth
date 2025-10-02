import express from "express";
import connectDB from "./db/connectDB.js";
import authRoutes from "./routes/auth.route.js";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";

const app = express();

dotenv.config();

app.use(cors({ origin: "http://localhost:5173", credentials: true })); // Middleware to enable CORS

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.use(express.json()); // Middleware to parse JSON requests
app.use(cookieParser()); // Middleware to parse cookies

app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5000;

const __dirname = path.resolve();

// Serve static files from the React app in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "frontend", "dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "frontend", "dist", "index.html"));
  });
}

app.listen(PORT, () => {
  connectDB();
  console.log(`Server is running on port ${PORT}`);
});

export default app;
