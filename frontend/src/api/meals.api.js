import http from "./http.js";

export async function listSelectableMealsApi() {
  const { data } = await http.get("/api/meals/selectable");
  return data?.meals || data || [];
}