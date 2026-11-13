
const SETTINGS_URL = "https://costthresholdalarm.duckdns.org/api/settings/";

export async function loadCurrencySettings() {
  try {
    const settingsResponse = await fetch(SETTINGS_URL);

    if (!settingsResponse.ok) {
      throw new Error("Unable to load currency preference.");
    }

    const settings = await settingsResponse.json();
    const currency = settings.currency || "USD";

    if (!["USD", "INR", "EUR", "GBP"].includes(currency)) {
      throw new Error("Unsupported display currency.");
    }

    if (currency === "USD") {
      return { currency: "USD", rate: 1, warning: "" };
    }

    const response = await fetch(
      `https://api.frankfurter.dev/v1/latest?base=USD&symbols=${currency}`
    );

    if (!response.ok) {
      throw new Error("Exchange rate service unavailable.");
    }

    const data = await response.json();
    const rate = Number(data.rates?.[currency]);

    if (!Number.isFinite(rate) || rate <= 0) {
      throw new Error("Invalid exchange rate.");
    }

    return { currency, rate, warning: "" };
  } catch (error) {
    return {
      currency: "USD",
      rate: 1,
      warning: "Currency conversion unavailable. Showing original USD amounts.",
    };
  }
}

export function formatMoney(amount, currency, rate = 1) {
  const convertedAmount = Number(amount || 0) * rate;

  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(convertedAmount);
}

export function convertAmount(amount, rate = 1) {
  return Number(amount || 0) * rate;
}
