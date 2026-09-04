import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

export const getDashboardOverview = async () => {
  const response = await API.get("/dashboard/overview");
  return response.data;
};

export const getRecentActions = async () => {
  const response = await API.get("/dashboard/recent-actions");
  return response.data;
};

export const getAuditLogs = async () => {
  const response = await API.get("/dashboard/audit-logs");
  return response.data;
};

export const getTransactions = async () => {
  const response = await API.get("/transactions");
  return response.data;
};

export const analyzeTransaction = async (id) => {
  const response = await API.get(`/transactions/${id}/analyze`);
  return response.data;
};

export const recoverTransaction = async (id) => {
  const response = await API.post(`/transactions/${id}/recover`);
  return response.data;
};

export default API;