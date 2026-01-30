import http from "./http.js";

export async function listRestaurantsApi(params = {}) {
  const response = await http.get("/api/restaurants", { params });
  return response.data;
}

export async function getRestaurantByIdApi(id) {
  const response = await http.get(`/api/restaurants/${id}`);
  return response.data;
}

export async function getRestaurantMenuApi(restaurantId, params = {}) {
  const { data } = await http.get(`/api/restaurants/${restaurantId}/menu`, { params });
  return data;
}

export async function getMyRestaurantApi() {
  const response = await http.get("/api/restaurants/mine");
  return response.data;
}

export async function createMyRestaurantApi(payload) {
  const response = await http.post("/api/restaurants", payload);
  return response.data;
}

export async function updateMyRestaurantApi(payload) {
  const response = await http.put("/api/restaurants/mine", payload);
  return response.data;
}

export async function getMyRestaurantStatsApi() {
  const response = await http.get("/api/restaurants/mine/stats");
  return response.data;
}

export async function getMyRestaurantMenuApi() {
  const { data } = await http.get("/api/restaurants/mine/menu");
  return data;
}

export async function setMyRestaurantMenuApi(items) {
  const { data } = await http.put("/api/restaurants/mine/menu", { items });
  return data;
}