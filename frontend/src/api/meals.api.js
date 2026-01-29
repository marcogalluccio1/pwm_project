import http from "./http.js";

export async function listSelectableMealsApi() {
  const { data } = await http.get("/api/meals/selectable");
  return data?.meals || data || [];
}

export async function getMealByIdApi(id) {
  const { data } = await http.get(`/api/meals/${id}`);
  return data?.meal || data;
}