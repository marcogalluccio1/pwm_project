import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const UserSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["customer", "seller"], required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    vatNumber: {
      type: String,
      required: function () { return this.role === "seller"; },
      trim: true,
    },
    payment: {
      method: {
        type: String,
        enum: ["card", "prepaid", "cash"],
        default: null,
      },
      cardBrand: { type: String, trim: true }, 
      cardLast4: { type: String, trim: true }, 
      holderName: { type: String, trim: true },
    },

    preferences: {
      favoriteMealTypes: [{ type: String, trim: true }],
      marketingOptIn: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

UserSchema.methods.setPassword = async function (plainPassword) {
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(plainPassword, salt);
};

UserSchema.methods.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

export default mongoose.model("User", UserSchema);
