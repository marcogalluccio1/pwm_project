import http from "./http.js";

export async function listRestaurantsApi(params = {}) {
  const response = await http.get("/api/restaurants", { params });
  return response.data;
}

export async function getMyRestaurantApi() {
  const response = await http.get("/api/restaurants/mine");
  return response.data;
}

export async function createMyRestaurantApi(payload) {
  const response = await http.post("/api/restaurants", payload);
  return response.data;
}
