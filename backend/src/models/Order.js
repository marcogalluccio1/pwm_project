import mongoose from "mongoose";

const OrderItemSchema = new mongoose.Schema(
  {
    mealId: { type: mongoose.Schema.Types.ObjectId, ref: "Meal", required: true },
    nameSnapshot: { type: String, required: true, trim: true },
    priceSnapshot: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },

    items: { type: [OrderItemSchema], required: true },

    fulfillment: { type: String, enum: ["pickup", "delivery"], required: true },
    deliveryAddress: { type: String, trim: true },
    distanceKm: { type: Number, min: 0 },

    status: {
      type: String,
      enum: ["ordered", "preparing", "delivering", "delivered"],
      default: "ordered",
      index: true,
    },

    subtotal: { type: Number, required: true, min: 0 },
    deliveryFee: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },

    estimatedReadyAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("Order", OrderSchema);
