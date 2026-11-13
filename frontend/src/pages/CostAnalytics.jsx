
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
} from "@mui/material";

import { LineChart } from "@mui/x-charts/LineChart";
import { BarChart } from "@mui/x-charts/BarChart";

const API_URL = "https://cost-threshold-alarm-backend.onrender.com/api/analytics/";

const periods = [
  "Last 7 days",
  "Last 30 days",
  "Last 3 months",
  "Last 6 months",
  "Last 12 months",
  "Custom",
];

export default function CostAnalytics() {
  const [period, setPeriod] = useState("Last 30 days");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError("");

        const selectedPeriod =
          period === "Custom" ? "Last 30 days" : period;

        const query = new URLSearchParams({
          period: selectedPeriod,
        });

        const response = await fetch(`${API_URL}?${query.toString()}`);

        if (!response.ok) {
          throw new Error("Unable to load cost analytics.");
        }

        const data = await response.json();

        if (isMounted) {
          setAnalytics(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Analytics backend connection failed.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAnalytics();

    return () => {
      isMounted = false;
    };
  }, [period]);

  const services = analytics?.services || [];
  const labels = analytics?.labels || [];
  const values = analytics?.values || [];

  const total = Number(analytics?.total_spending || 0);
  const average = Number(analytics?.average_spending || 0);

  const highestService = analytics?.highest_service;

  const summaryCards = [
    {
      title: "Total Cloud Spending",
      value: `$${total.toFixed(2)}`,
      subtitle: "Current demo spending",
      color: "#EC5E27",
    },
    {
      title: "Average Spending",
      value: `$${average.toFixed(2)}`,
      subtitle: "Average per chart interval",
      color: "#3B82F6",
    },
    {
      title: "Highest Service Cost",
      value: `$${Number(highestService?.cost || 0).toFixed(2)}`,
      subtitle: highestService?.name || "No service data",
      color: "#16A34A",
    },
  ];

  return (
    <Box sx={{ width: "100%", minWidth: 0 }}>
      {/* PAGE HEADER */}

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
            Understand your cloud spending patterns and trends.
          </Typography>
        </Box>

        <TextField
          select
          size="small"
          label="Date Range"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          sx={{ minWidth: 190 }}
        >
          {periods.map((p) => (
            <MenuItem key={p} value={p}>
              {p}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {/* CUSTOM DATE FILTER */}

      {period === "Custom" && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography fontWeight={600} sx={{ mb: 2 }}>
              Custom Date Range
            </Typography>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
            >
              <TextField
                type="date"
                label="Start Date"
                size="small"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                slotProps={{
                  inputLabel: { shrink: true },
                }}
              />

              <TextField
                type="date"
                label="End Date"
                size="small"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                slotProps={{
                  inputLabel: { shrink: true },
                }}
              />
            </Stack>

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: "block",
                mt: 2,
              }}
            >
              Custom date filtering is not yet implemented. The dashboard
              currently displays the Last 30 days demo dataset.
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* LOADING AND ERROR STATES */}

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
          <CircularProgress />
        </Box>
      )}

      {/* ANALYTICS CONTENT */}

      {!loading && analytics && (
        <>
          {/* SUMMARY CARDS */}

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
                      sx={{
                        fontSize: 14,
                        fontWeight: 500,
                      }}
                    >
                      {card.title}
                    </Typography>

                    <Typography
                      variant="h4"
                      fontWeight={800}
                      sx={{ color: card.color, my: 1.5 }}
                    >
                      {card.value}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      {card.subtitle}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* SPENDING TREND */}

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
                    Cloud spending over {period.toLowerCase()}
                  </Typography>
                </Box>

                <Chip
                  label="Demo Data"
                  color="warning"
                  size="small"
                  variant="outlined"
                />
              </Box>

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
                      data: values,
                      label: "Cloud Spending ($)",
                      area: true,
                      showMark: true,
                      color: "#EC5E27",
                      curve: "monotoneX",
                    },
                  ]}
                  yAxis={[
                    {
                      width: 65,
                    },
                  ]}
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
            </CardContent>
          </Card>

          {/* AWS SERVICE BREAKDOWN */}

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
                Compare spending across different AWS services.
              </Typography>

              <Box sx={{ width: "100%", minWidth: 0 }}>
                <BarChart
                  height={350}
                  xAxis={[
                    {
                      scaleType: "band",
                      data: services.map((s) => s.name),
                      tickLabelStyle: {
                        fontSize: 12,
                      },
                    },
                  ]}
                  series={[
                    {
                      data: services.map((s) => s.cost),
                      label: "Service Cost ($)",
                      color: "#EC5E27",
                      valueFormatter: (value) =>
                        `$${Number(value).toFixed(2)}`,
                    },
                  ]}
                  yAxis={[{ width: 65 }]}
                  margin={{
                    left: 15,
                    right: 30,
                    top: 25,
                    bottom: 65,
                  }}
                  grid={{ horizontal: true }}
                />
              </Box>
            </CardContent>
          </Card>

          {/* SERVICE COST DETAILS */}

          <Card
            sx={{
              border: "1px solid #EEECE5",
              borderRadius: 3,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography
                variant="h6"
                fontWeight={700}
                sx={{ mb: 2 }}
              >
                Service Cost Details
              </Typography>

              <Stack spacing={2}>
                {services.map((service) => (
                  <Box key={service.name}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 0.8,
                      }}
                    >
                      <Typography fontWeight={500}>
                        {service.name}
                      </Typography>

                      <Typography fontWeight={700}>
                        ${Number(service.cost).toFixed(2)}
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
                            total > 0
                              ? (service.cost / total) * 100
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
            Analytics data is retrieved from FastAPI. All spending figures
            are sample demonstration data, not actual AWS costs.
          </Typography>
        </>
      )}
    </Box>
  );
}
