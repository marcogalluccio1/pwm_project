import http from "./http.js";


export async function createOrderApi(payload) {
  const response = await http.post("/api/orders", payload);
  return response.data;
}

export async function getMyOrdersApi() {
  const response = await http.get("/api/orders/mine");
  return response.data;
}

export async function getOrderByIdApi(id) {
  const response = await http.get(`/api/orders/${id}`);
  return response.data;
}

export async function getRestaurantOrdersApi() {
  const response = await http.get("/api/orders/restaurant/mine");
  return response.data;
}

export async function updateOrderStatusApi(id, payload) {
  const response = await http.put(`/api/orders/${id}/status`, payload);
  return response.data;
}
