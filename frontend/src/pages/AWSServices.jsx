
import { useEffect, useMemo, useState } from "react";

import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  MenuItem,
  Chip,
  InputAdornment,
  Stack,
  LinearProgress,
  CircularProgress,
  Alert,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import CloudQueueIcon from "@mui/icons-material/CloudQueue";

const API_URL =
  "https://costthresholdalarm.duckdns.org/api/aws-services/";

const SETTINGS_URL =
  "https://costthresholdalarm.duckdns.org/api/settings/";

const EXCHANGE_URL =
  "https://api.frankfurter.dev/v1/latest?base=USD&symbols=INR,EUR,GBP";

const SUPPORTED_CURRENCIES = ["INR", "USD", "EUR", "GBP"];

const categories = [
  "All",
  "Compute",
  "Storage",
  "Database",
  "Monitoring",
  "Notifications",
  "Other",
];

export default function AWSServices() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const [services, setServices] = useState([]);
  const [total, setTotal] = useState(0);
  const [highestService, setHighestService] = useState(null);

  const [currency, setCurrency] = useState("USD");
  const [exchangeRate, setExchangeRate] = useState(1);
  const [currencyWarning, setCurrencyWarning] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchServices = async () => {
      try {
        setLoading(true);
        setError("");
        setCurrencyWarning("");

        const [serviceResponse, settingsResponse] =
          await Promise.all([
            fetch(API_URL),
            fetch(SETTINGS_URL),
          ]);

        if (!serviceResponse.ok) {
          throw new Error("Unable to fetch actual AWS billing data.");
        }

        const data = await serviceResponse.json();

        if (cancelled) return;

        setServices(
          (data.services || []).map((service) => ({
            ...service,
            cost: Math.max(0, Number(service.cost) || 0),
            percentage: Math.max(
              0,
              Number(service.percentage) || 0
            ),
          }))
        );

        setTotal(Math.max(0, Number(data.total_cost) || 0));

        setHighestService(data.highest_service || null);

        let selectedCurrency = "USD";

        if (settingsResponse.ok) {
          const settings = await settingsResponse.json();

          if (SUPPORTED_CURRENCIES.includes(settings.currency)) {
            selectedCurrency = settings.currency;
          }
        }

        if (selectedCurrency === "USD") {
          if (!cancelled) {
            setCurrency("USD");
            setExchangeRate(1);
          }
        } else {
          try {
            const rateResponse = await fetch(EXCHANGE_URL);

            if (!rateResponse.ok) {
              throw new Error("Exchange rate service unavailable.");
            }

            const rateData = await rateResponse.json();
            const rate = Number(
              rateData.rates?.[selectedCurrency]
            );

            if (!Number.isFinite(rate) || rate <= 0) {
              throw new Error("Invalid exchange rate.");
            }

            if (!cancelled) {
              setCurrency(selectedCurrency);
              setExchangeRate(rate);
            }
          } catch {
            if (!cancelled) {
              setCurrency("USD");
              setExchangeRate(1);
              setCurrencyWarning(
                "Live exchange rates unavailable. Costs are displayed in USD."
              );
            }
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to connect to the backend.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchServices();

    return () => {
      cancelled = true;
    };
  }, []);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format((Number(amount) || 0) * exchangeRate);

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const matchesSearch = service.name
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesCategory =
        category === "All" || service.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [services, search, category]);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "300px",
        }}
      >
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", minWidth: 0 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          AWS Services
        </Typography>

        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          Monitor actual costs across your AWS cloud services.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {currencyWarning && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {currencyWarning}
        </Alert>
      )}

      {!error && (
        <>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                lg: "repeat(3, 1fr)",
              },
              gap: 2.5,
              mb: 3,
            }}
          >
            <Card>
              <CardContent>
                <Typography color="text.secondary">
                  Total Service Cost
                </Typography>

                <Typography
                  variant="h4"
                  fontWeight={800}
                  color="primary"
                  sx={{ mt: 1 }}
                >
                  {formatCurrency(total)}
                </Typography>

                <Chip
                  label="AWS Cost Explorer"
                  color="success"
                  size="small"
                  variant="outlined"
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography color="text.secondary">
                  Services with Billing Data
                </Typography>

                <Typography variant="h4" fontWeight={800} sx={{ mt: 1 }}>
                  {services.length}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  Services returned by Cost Explorer
                </Typography>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography color="text.secondary">
                  Highest Spending Service
                </Typography>

                <Typography variant="h5" fontWeight={800} sx={{ mt: 1 }}>
                  {highestService?.name || "N/A"}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  {highestService
                    ? formatCurrency(highestService.cost)
                    : "No billing data available"}
                </Typography>
              </CardContent>
            </Card>
          </Box>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
              >
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search AWS services..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    },
                  }}
                />

                <TextField
                  select
                  size="small"
                  label="Category"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  sx={{ minWidth: { sm: 190 } }}
                >
                  {categories.map((item) => (
                    <MenuItem key={item} value={item}>
                      {item}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>
            </CardContent>
          </Card>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(2, minmax(0, 1fr))",
              },
              gap: 2.5,
            }}
          >
            {filteredServices.map((service) => (
              <Card
                key={service.name}
                sx={{
                  border: "1px solid #EEECE5",
                  borderRadius: 3,
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 2,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                      }}
                    >
                      <Box
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: 2,
                          bgcolor: "#FFF0E8",
                          color: "#EC5E27",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <CloudQueueIcon />
                      </Box>

                      <Box>
                        <Typography fontWeight={700}>
                          {service.name}
                        </Typography>

                        <Typography variant="caption" color="text.secondary">
                          {service.category}
                        </Typography>
                      </Box>
                    </Box>

                    <Chip
                      label={service.status || "Billing data available"}
                      color="success"
                      size="small"
                      variant="outlined"
                    />
                  </Box>

                  <Typography
                    variant="h4"
                    fontWeight={800}
                    sx={{ mt: 3 }}
                  >
                    {formatCurrency(service.cost)}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    Actual billed service cost
                  </Typography>

                  <Box sx={{ mt: 2.5 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        Share of total spending
                      </Typography>

                      <Typography variant="body2" fontWeight={700}>
                        {service.percentage.toFixed(2)}%
                      </Typography>
                    </Box>

                    <LinearProgress
                      variant="determinate"
                      value={Math.min(service.percentage, 100)}
                      sx={{
                        height: 8,
                        borderRadius: 5,
                        bgcolor: "#F1E7E1",
                        "& .MuiLinearProgress-bar": {
                          bgcolor: "#EC5E27",
                          borderRadius: 5,
                        },
                      }}
                    />
                  </Box>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 2 }}
                  >
                    Source: {service.usage || "AWS Cost Explorer billing data"}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>

          {filteredServices.length === 0 && (
            <Card sx={{ mt: 2 }}>
              <CardContent sx={{ textAlign: "center", py: 5 }}>
                <Typography fontWeight={600}>
                  No billing services found
                </Typography>

                <Typography color="text.secondary" variant="body2">
                  Try another search or category. Cost Explorer may also
                  have no charge records for this period.
                </Typography>
              </CardContent>
            </Card>
          )}

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: "block",
              textAlign: "center",
              mt: 3,
            }}
          >
            Service costs are based on AWS Cost Explorer billing data
            for the current month.
          </Typography>
        </>
      )}
    </Box>
  );
}
