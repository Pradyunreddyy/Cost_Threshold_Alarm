
const API_BASE_URL = "https://costthresholdalarm.duckdns.org";

export async function checkBackendHealth() {
  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 5000);

  try {
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error("Backend connection failed.");
    }

    return await response.json();
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Backend health check timed out.");
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
