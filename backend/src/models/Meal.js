import mongoose from "mongoose";

const MealSchema = new mongoose.Schema(
  {
    sourceId: { type: String, index: true }, //idMeal
    name: { type: String, required: true, trim: true, index: true }, //strMeal
    category: { type: String, required: true, trim: true, index: true }, //strCategory
    thumbnailUrl: { type: String, required: true, trim: true }, //strMealThumb

    ingredients: [{ type: String, trim: true, index: true }],
    measures: [{ type: String, trim: true }],

    isGlobal: { type: Boolean, default: true }, //true if it comes from JSON, false if it is a custom meal
    createdBySellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, //only for custom meals
  },
  { timestamps: true }
);

MealSchema.index({ name: "text", category: "text", ingredients: "text" });

export default mongoose.model("Meal", MealSchema);
