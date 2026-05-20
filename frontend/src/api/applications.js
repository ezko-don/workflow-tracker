const BASE = "http://localhost:8000/api/applications";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Request failed");
  return data;
}

export const listApplications = () => request("/");
export const getApplication = (id) => request(`/${id}`);
export const createApplication = (payload) =>
  request("/", { method: "POST", body: JSON.stringify(payload) });
export const updateApplication = (id, payload) =>
  request(`/${id}`, { method: "PUT", body: JSON.stringify(payload) });
export const submitApplication = (id) =>
  request(`/${id}/submit`, { method: "POST" });
export const startReview = (id) =>
  request(`/${id}/review`, { method: "POST" });
export const recordDecision = (id, payload) =>
  request(`/${id}/decide`, { method: "POST", body: JSON.stringify(payload) });
