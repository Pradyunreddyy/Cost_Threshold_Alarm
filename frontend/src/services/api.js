
const API_BASE_URL = "https://cost-threshold-alarm-backend.onrender.com";

export async function checkBackendHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);

    if (!response.ok) {
      throw new Error("Backend connection failed");
    }

    return await response.json();
  } catch (error) {
    console.error("Backend error:", error);
    throw error;
  }
}
