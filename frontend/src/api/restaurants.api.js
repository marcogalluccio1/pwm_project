import http from "./http.js";

export async function listRestaurantsApi(params = {}) {
  const response = await http.get("/api/restaurants", { params });
  return response.data;
}
