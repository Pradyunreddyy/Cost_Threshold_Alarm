
import { useEffect, useState } from "react";

import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  MenuItem,
  Chip,
  Stack,
  CircularProgress,
  Alert,
  Button,
} from "@mui/material";

import { LineChart } from "@mui/x-charts/LineChart";
import { BarChart } from "@mui/x-charts/BarChart";

import {
  loadCurrencySettings,
  formatMoney,
  convertAmount,
} from "../services/currency";

const API_URL = "https://costthresholdalarm.duckdns.org/api/analytics/";

const periods = [
  "Last 7 days",
  "Last 30 days",
  "Last 3 months",
  "Last 6 months",
  "Last 12 months",
  "Custom",
];

function getLocalDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function CostAnalytics() {
  const [period, setPeriod] = useState("Last 30 days");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [analytics, setAnalytics] = useState(null);
  const [currencyInfo, setCurrencyInfo] = useState({
    currency: "USD",
    rate: 1,
    warning: "",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dateError, setDateError] = useState("");

  useEffect(() => {
    if (period === "Custom") {
      if (!startDate || !endDate) {
        setLoading(false);
        setAnalytics(null);
        setError("");
        setDateError("Select both dates to view custom analytics.");
        return;
      }

      if (startDate > endDate) {
        setLoading(false);
        setAnalytics(null);
        setDateError("Start date must be earlier than or equal to end date.");
        return;
      }
    }

    const controller = new AbortController();

    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError("");
        setDateError("");

        const query = new URLSearchParams({ period });

        if (period === "Custom") {
          query.set("start_date", startDate);
          query.set("end_date", endDate);
        }

        const [analyticsResponse, currency] = await Promise.all([
          fetch(`${API_URL}?${query.toString()}`, {
            signal: controller.signal,
          }),
          loadCurrencySettings(),
        ]);

        if (!analyticsResponse.ok) {
          throw new Error(
            analyticsResponse.status === 502
              ? "AWS Cost Explorer could not retrieve spending data."
              : "Unable to load cost analytics."
          );
        }

        const data = await analyticsResponse.json();

        setAnalytics(data);
        setCurrencyInfo(currency);
      } catch (err) {
        if (err.name !== "AbortError") {
          setAnalytics(null);
          setError(err.message || "Analytics backend connection failed.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchAnalytics();

    return () => controller.abort();
  }, [period, startDate, endDate]);

  const services = Array.isArray(analytics?.services)
    ? analytics.services
    : [];

  const labels = Array.isArray(analytics?.labels)
    ? analytics.labels
    : [];

  const values = Array.isArray(analytics?.values)
    ? analytics.values
    : [];

  const rate = currencyInfo.rate;

  const total = Math.max(0, Number(analytics?.total_spending || 0));
  const average = Math.max(0, Number(analytics?.average_spending || 0));

  const highestService = analytics?.highest_service;

  const summaryCards = [
    {
      title: "Total Cloud Spending",
      value: formatMoney(total, currencyInfo.currency, rate),
      subtitle: "Actual AWS Cost Explorer spending",
      color: "#EC5E27",
    },
    {
      title: "Average Spending",
      value: formatMoney(average, currencyInfo.currency, rate),
      subtitle: "Average per chart interval",
      color: "#3B82F6",
    },
    {
      title: "Highest Service Cost",
      value: formatMoney(
        highestService?.cost || 0,
        currencyInfo.currency,
        rate
      ),
      subtitle: highestService?.name || "No service data",
      color: "#16A34A",
    },
  ];

  const chartValues = values.map((value) =>
    convertAmount(Math.max(0, Number(value) || 0), rate)
  );

  const chartServices = services.map((service) => ({
    ...service,
    displayCost: convertAmount(
      Math.max(0, Number(service.cost) || 0),
      rate
    ),
  }));

  const serviceTotal = chartServices.reduce(
    (sum, service) => sum + service.displayCost,
    0
  );

  return (
    <Box sx={{ width: "100%", minWidth: 0 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Cost Analytics
          </Typography>

          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Understand your actual AWS cloud spending patterns and trends.
          </Typography>
        </Box>

        <TextField
          select
          size="small"
          label="Date Range"
          value={period}
          onChange={(event) => setPeriod(event.target.value)}
          sx={{ minWidth: 190 }}
        >
          {periods.map((item) => (
            <MenuItem key={item} value={item}>
              {item}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {period === "Custom" && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography fontWeight={600} sx={{ mb: 2 }}>
              Custom Date Range
            </Typography>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              alignItems={{ sm: "center" }}
            >
              <TextField
                type="date"
                label="Start Date"
                size="small"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                slotProps={{
                  inputLabel: { shrink: true },
                  htmlInput: { max: getLocalDateString(new Date()) },
                }}
              />

              <TextField
                type="date"
                label="End Date"
                size="small"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                slotProps={{
                  inputLabel: { shrink: true },
                  htmlInput: {
                    min: startDate || undefined,
                    max: getLocalDateString(new Date()),
                  },
                }}
              />
            </Stack>

            {dateError && (
              <Alert severity="info" sx={{ mt: 2 }}>
                {dateError}
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {currencyInfo.warning && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {currencyInfo.warning}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            py: 5,
          }}
        >
          <CircularProgress sx={{ color: "#EC5E27" }} />
        </Box>
      )}

      {!loading && analytics && !error && (
        <>
          <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
            {summaryCards.map((card) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={card.title}>
                <Card
                  sx={{
                    height: "100%",
                    border: "1px solid #EEECE5",
                    borderRadius: 3,
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Typography
                      color="text.secondary"
                      sx={{ fontSize: 14, fontWeight: 500 }}
                    >
                      {card.title}
                    </Typography>

                    <Typography
                      variant="h4"
                      fontWeight={800}
                      sx={{
                        color: card.color,
                        my: 1.5,
                        overflowWrap: "anywhere",
                      }}
                    >
                      {card.value}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      {card.subtitle}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Card
            sx={{
              mb: 2.5,
              border: "1px solid #EEECE5",
              borderRadius: 3,
            }}
          >
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 1,
                  mb: 2,
                }}
              >
                <Box>
                  <Typography variant="h6" fontWeight={700}>
                    Spending Trend
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    AWS spending over {period.toLowerCase()}
                  </Typography>
                </Box>

                <Chip
                  label="AWS Cost Explorer"
                  color="success"
                  size="small"
                  variant="outlined"
                />
              </Box>

              {labels.length > 0 && chartValues.length > 0 ? (
                <Box sx={{ width: "100%", minWidth: 0 }}>
                  <LineChart
                    height={340}
                    xAxis={[
                      {
                        scaleType: "point",
                        data: labels,
                      },
                    ]}
                    series={[
                      {
                        data: chartValues,
                        label: `Cloud Spending (${currencyInfo.currency})`,
                        area: true,
                        showMark: true,
                        color: "#EC5E27",
                        curve: "monotoneX",
                        valueFormatter: (value) =>
                          formatMoney(value, currencyInfo.currency),
                      },
                    ]}
                    yAxis={[{ width: 75 }]}
                    margin={{
                      left: 15,
                      right: 30,
                      top: 25,
                      bottom: 35,
                    }}
                    grid={{ horizontal: true }}
                    slotProps={{
                      legend: {
                        direction: "horizontal",
                        position: {
                          vertical: "top",
                          horizontal: "middle",
                        },
                      },
                    }}
                  />
                </Box>
              ) : (
                <Alert severity="info">
                  No spending trend data is available for this period.
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card
            sx={{
              mb: 3,
              border: "1px solid #EEECE5",
              borderRadius: 3,
            }}
          >
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Typography variant="h6" fontWeight={700}>
                AWS Service Cost Breakdown
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 2 }}
              >
                Compare actual spending across AWS services.
              </Typography>

              {chartServices.length > 0 ? (
                <Box sx={{ width: "100%", minWidth: 0 }}>
                  <BarChart
                    height={350}
                    xAxis={[
                      {
                        scaleType: "band",
                        data: chartServices.map((service) => service.name),
                        tickLabelStyle: { fontSize: 12 },
                      },
                    ]}
                    series={[
                      {
                        data: chartServices.map(
                          (service) => service.displayCost
                        ),
                        label: `Service Cost (${currencyInfo.currency})`,
                        color: "#EC5E27",
                        valueFormatter: (value) =>
                          formatMoney(value, currencyInfo.currency),
                      },
                    ]}
                    yAxis={[{ width: 75 }]}
                    margin={{
                      left: 15,
                      right: 30,
                      top: 25,
                      bottom: 65,
                    }}
                    grid={{ horizontal: true }}
                  />
                </Box>
              ) : (
                <Alert severity="info">
                  No AWS service cost breakdown is available for this period.
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card
            sx={{
              border: "1px solid #EEECE5",
              borderRadius: 3,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Service Cost Details
              </Typography>

              {chartServices.length === 0 ? (
                <Typography color="text.secondary">
                  No service cost details available.
                </Typography>
              ) : (
                <Stack spacing={2}>
                  {chartServices.map((service) => (
                    <Box key={service.name}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 2,
                          mb: 0.8,
                        }}
                      >
                        <Typography fontWeight={500}>
                          {service.name}
                        </Typography>

                        <Typography fontWeight={700}>
                          {formatMoney(
                            service.displayCost,
                            currencyInfo.currency
                          )}
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          height: 8,
                          bgcolor: "#F1E7E1",
                          borderRadius: 5,
                          overflow: "hidden",
                        }}
                      >
                        <Box
                          sx={{
                            height: "100%",
                            width: `${
                              serviceTotal > 0
                                ? (service.displayCost / serviceTotal) * 100
                                : 0
                            }%`,
                            bgcolor: "#EC5E27",
                            borderRadius: 5,
                          }}
                        />
                      </Box>
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: "block",
              textAlign: "center",
              mt: 3,
              mb: 1,
            }}
          >
            Source: {analytics.source || "AWS Cost Explorer"}.
            AWS billing data may be delayed. Converted amounts use
            exchange rates retrieved for display purposes.
            {analytics.estimated ? " Some figures are estimated." : ""}
          </Typography>
        </>
      )}
    </Box>
  );
}
