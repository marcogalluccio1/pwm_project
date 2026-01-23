import Restaurant from "../models/Restaurant.js";

export const createRestaurant = async (req, res) => {
  try {
    const { address, city, phone } = req.body;

    if (!address || !city) {
      return res.status(400).json({ message: " address e city sono obbligatori" });
    }

    const existing = await Restaurant.findOne({ seller: req.user.id });
    if (existing) {
      return res.status(409).json({ message: "Hai già un ristorante" });
    }

    const restaurant = await Restaurant.create({
      address,
      city,
      phone,
      seller: req.user.id,
    });

    res.status(201).json(restaurant);
  } catch (err) {
    console.error("CREATE_RESTAURANT_ERROR:", err);
    res.status(500).json({ message: "Errore server" });
  }
};

export const getRestaurants = async (req, res) => {
  const restaurants = await Restaurant.find().populate("seller", "email");
  res.json(restaurants);
};

export const getRestaurantById = async (req, res) => {
  const restaurant = await Restaurant.findById(req.params.id).populate("seller", "email");
  if (!restaurant) {
    return res.status(404).json({ message: "Ristorante non trovato" });
  }
  res.json(restaurant);
};
