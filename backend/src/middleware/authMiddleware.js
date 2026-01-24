import jwt from "jsonwebtoken";

export const requireAuth = (req, res, next) => {
  try {
    const header = req.headers.authorization; //bearer <token>
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing token" });
    }

    const token = header.split(" ")[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export const requireRole = (role) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Not authenticated" });
  if (req.user.role !== role) {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
};
