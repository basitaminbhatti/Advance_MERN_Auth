import express from "express";
import connectDB from "./db/connectDB.js";
import authRoutes from "./routes/auth.route.js";
import dotenv from "dotenv";

const app = express();

dotenv.config();

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.use(express.json()); // Middleware to parse JSON requests

app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  connectDB();
  console.log(`Server is running on port ${PORT}`);
});

export default app;
