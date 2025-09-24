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
