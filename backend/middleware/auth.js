import jwt from "jsonwebtoken";

// protect: reads JWT from Authorization header, trusts JWT payload
export const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // JWT payload contains: { id, email, role, permissions }
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
};

// hasPermission: checks if req.user.permissions includes the required permission
export const hasPermission = (permissionKey) => (req, res, next) => {
  if (!req.user?.permissions?.includes(permissionKey)) {
    return res.status(403).json({ message: "Forbidden: insufficient permissions" });
  }
  next();
};
