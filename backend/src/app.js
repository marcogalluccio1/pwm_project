import express from "express";
import dotenv from "dotenv";
import connectDB from "./database/db.js";
import authRoutes from "./routes/authRoutes.js";
import restaurantRoutes from "./routes/restaurantRoutes.js";
import mealRoutes from "./routes/mealRoutes.js";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerOptions from "./swagger.js";
import { loadMealsFromJson } from "./services/mealSetup.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

connectDB().then(() => {
  loadMealsFromJson(); 
});

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/meals", mealRoutes);

app.get("/", (req, res) => {
  res.send("FastFood API running");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
