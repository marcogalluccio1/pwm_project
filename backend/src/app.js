import path from "path";
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
import orderRoutes from "./routes/orderRoutes.js";
import compression from "compression";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use(compression());

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

connectDB().then(() => {
  loadMealsFromJson(); 
});

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/meals", mealRoutes);
app.use("/api/orders", orderRoutes);

app.get("/api", (req, res) => {
  res.send("FastFood API running");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

const __dirname = path.resolve();

app.use(
  express.static(path.join(__dirname, "../frontend/dist"), {
    maxAge: "7d",
    etag: true
  })
);


app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});