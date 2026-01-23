import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const me = async (req, res) => {
  const user = await User.findById(req.user.id).select("-passwordHash");
  res.json({ user });
};

function signToken(user) {
  const payload = { sub: user._id.toString(), role: user.role };
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

export const register = async (req, res) => {
  try {
    const { email, password, role, firstName, lastName, companyName, vatNumber } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ message: "email, password e ruolo sono obbligatori" });
    }
    if (!["customer", "seller"].includes(role)) {
      return res.status(400).json({ message: "ruolo non valido (customer/seller)" });
    }
    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({ message: "La password deve essere lunga almeno 8 caratteri" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "Email già registrata" });
    }

    const user = new User({
      email: email.toLowerCase(),
      role,
      firstName,
      lastName,
      companyName: role === "seller" ? companyName : undefined,
      vatNumber: role === "seller" ? vatNumber : undefined,
    });

    await user.setPassword(password);
    await user.save();

    const token = signToken(user);

    return res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (err) {
    console.error("REGISTER_ERROR:", err);
    return res.status(500).json({ message: "Errore server" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "email e password sono obbligatori" });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");
    if (!user) {
      return res.status(401).json({ message: "Credenziali non valide" });
    }

    const ok = await user.comparePassword(password);
    if (!ok) {
      return res.status(401).json({ message: "Credenziali non valide" });
    }

    const token = signToken(user);

    return res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (err) {
    console.error("LOGIN_ERROR:", err);
    return res.status(500).json({ message: "Errore server" });
  }
};
