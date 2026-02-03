import http from "./http.js";

export async function listMealsApi(params = {}) {
  const { data } = await http.get("/api/meals", { params });
  return data?.meals || data || [];
}

export async function listSelectableMealsApi() {
  const { data } = await http.get("/api/meals/selectable");
  return data?.meals || data || [];
}

export async function getMealByIdApi(id) {
  const { data } = await http.get(`/api/meals/${id}`);
  return data?.meal || data;
}

export async function getMyCustomMealsApi() {
  const { data } = await http.get("/api/meals/mine/custom");
  return data?.meals || data || [];
}

export async function createCustomMealApi(payload) {
  const response = await http.post("/api/meals", payload);
  return response.data;
}

export async function updateCustomMealApi(id, payload) {
  const response = await http.put(`/api/meals/${id}`, payload);
  return response.data;
}

export async function deleteCustomMealApi(id) {
  await http.delete(`/api/meals/${id}`);
}