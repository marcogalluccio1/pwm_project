import jwt from "jsonwebtoken";
import User from "../models/User.js";

function signToken(user) {
  const payload = { sub: user._id.toString(), role: user.role };
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

export const me = async (req, res) => {
  const user = await User.findById(req.user.id).select("-passwordHash");
  return res.json({ user });
};

export const register = async (req, res) => {
  try {
    const { email, password, role, firstName, lastName, vatNumber } = req.body;

  if (!email || !password || !role || !firstName || !lastName) {
    return res.status(400).json({
      message: "email, password, role, firstName and lastName are required",
    });
  }

  if (!["customer", "seller"].includes(role)) {
    return res.status(400).json({ message: "Invalid role (customer/seller)" });
  }

  if (typeof password !== "string" || password.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters long" });
  }

  if (role === "seller") {
    if (!vatNumber) {
      return res.status(400).json({
        message: "vatNumber is required for seller accounts",
      });
    }
  }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const user = new User({
      email: email.toLowerCase(),
      role,
      firstName,
      lastName,
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
    return res.status(500).json({ message: "Server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const ok = await user.comparePassword(password);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials" });
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
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateMe = async (req, res) => {
  try {
    const { email, firstName, lastName, vatNumber, password } = req.body;

    const user = await User.findById(req.user.id).select("+passwordHash");
    if (!user) return res.status(404).json({ message: "User not found" });

    if (email && typeof email === "string") {
      const normalized = email.toLowerCase();
      if (normalized !== user.email) {
        const exists = await User.findOne({ email: normalized });
        if (exists) return res.status(409).json({ message: "Email already registered" });
        user.email = normalized;
      }
    }

    if (typeof firstName !== "undefined") user.firstName = firstName;
    if (typeof lastName !== "undefined") user.lastName = lastName;

    if ("payment" in req.body) {
      const p = req.body.payment;

      if (p === null) {
        user.payment = undefined;
      } else {
        if (typeof p !== "object") {
          return res.status(400).json({ message: "payment must be an object or null" });
        }

        const allowedMethods = ["card", "prepaid", "cash"];
        if (!p.method || !allowedMethods.includes(p.method)) {
          return res.status(400).json({ message: "Invalid payment method" });
        }

        const isCardLike = p.method === "card" || p.method === "prepaid";

        //validation of card infos
        if (isCardLike) {
          const { cardBrand, cardLast4, holderName } = p;

          if (!cardBrand || typeof cardBrand !== "string") {
            return res.status(400).json({ message: "payment.cardBrand is required for card / prepaid" });
          }

          if (!cardLast4 || typeof cardLast4 !== "string" || !/^\d{4}$/.test(cardLast4)) {
            return res.status(400).json({ message: "payment.cardLast4 must be exactly 4 digits for card / prepaid" });
          }

          if (!holderName || typeof holderName !== "string") {
            return res.status(400).json({ message: "payment.holderName is required for card / prepaid" });
          }

          user.payment = {
            method: p.method,
            cardBrand: cardBrand.trim(),
            cardLast4,
            holderName: holderName.trim(),
          };
        } else {
          user.payment = { method: "cash" };
        }
      }
    }


    if ("preferences" in req.body) {
      const pref = req.body.preferences;

      if (pref === null) {
        user.preferences = undefined; 
      } else {
        //favoriteMealTypes: array of strings
        if (
          "favoriteMealTypes" in pref &&
          pref.favoriteMealTypes !== undefined &&
          !Array.isArray(pref.favoriteMealTypes)
        ) {
          return res.status(400).json({ message: "preferences.favoriteMealTypes must be an array" });
        }

        if ("marketingOptIn" in pref && typeof pref.marketingOptIn !== "boolean") {
          return res.status(400).json({ message: "preferences.marketingOptIn must be a boolean" });
        }

        user.preferences = {
          favoriteMealTypes: pref.favoriteMealTypes ?? user.preferences?.favoriteMealTypes ?? [],
          marketingOptIn: pref.marketingOptIn ?? user.preferences?.marketingOptIn ?? false,
        };
      }
    }

    if (user.role === "seller") {
      if (typeof vatNumber !== "undefined") user.vatNumber = vatNumber;
    }

    if (typeof password !== "undefined") {
      if (typeof password !== "string" || password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters long" });
      }
      await user.setPassword(password);
    }

    await user.save();

    const safeUser = await User.findById(user._id).select("-passwordHash");
    return res.json({ user: safeUser });
  } catch (err) {
    console.error("UPDATE_ME_ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const deleteMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // NOTE: later you may want to also delete/cleanup related data (restaurant, orders, etc.)
    await User.findByIdAndDelete(req.user.id);

    return res.status(204).end();
  } catch (err) {
    console.error("DELETE_ME_ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
