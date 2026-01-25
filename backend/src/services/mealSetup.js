import fs from "fs";
import path from "path";
import Meal from "../models/Meal.js";

export async function loadMealsFromJson() {
  try {
    //check if global meals already exist 
    const count = await Meal.countDocuments({ isGlobal: true });
    if (count > 0) {
      console.log("Meals already seeded, skipping.");
      return;
    }

    const filePath = path.resolve(process.cwd(), process.env.MEALS_JSON_PATH);

    if (!fs.existsSync(filePath)) {
      console.log("Meals JSON not found, skipping seed.");
      return;
    }

    const raw = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);

    if (!Array.isArray(data)) {
      console.log("Meals JSON is not an array, skipping seed.");
      return;
    }
  
    const mealsArray = data.map((m) => ({
      externalId: m.idMeal?.toString(),
      name: m.strMeal,
      category: m.strCategory,
      thumbnailUrl: m.strMealThumb,
      ingredients: Array.isArray(m.ingredients) ? m.ingredients.filter(Boolean) : [],
      measures: Array.isArray(m.measures) ? m.measures.filter(Boolean) : [],
      isGlobal: true,
    }));

    await Meal.insertMany(mealsArray);

    console.log(`Meals seed completed (${mealsArray.length} meals).`);
  } catch (err) {
    console.error("MEALS_SEED_ERROR:", err);
  }
}
