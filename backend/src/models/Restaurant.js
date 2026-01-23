import mongoose from "mongoose";

const RestaurantSchema = new mongoose.Schema(
  {
    address: {
      type: String,
      required: true,
    },

    city: {
      type: String,
      required: true,
      index: true,
    },

    phone: {
      type: String,
    },

    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Restaurant", RestaurantSchema);
