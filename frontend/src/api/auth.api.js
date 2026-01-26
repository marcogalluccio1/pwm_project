import http from "./http";

export async function loginApi(email, password) {
  const { data } = await http.post("/api/auth/login", { email, password });
  return data;
}

export async function registerApi(payload) {
  const { data } = await http.post("/api/auth/register", payload);
  return data;
}

export async function meApi() {
  const { data } = await http.get("/api/auth/me");
  return data;
}

export async function updateMeApi(payload) {
  const { data } = await http.put("/api/auth/me", payload);
  return data;
}

export async function deleteMeApi() {
  await http.delete("/api/auth/me");
}
