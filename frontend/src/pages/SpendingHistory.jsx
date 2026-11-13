
import { useEffect, useMemo, useState } from "react";

import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  MenuItem,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,
  Stack,
  CircularProgress,
  Alert,
} from "@mui/material";

import SearchRounded from "@mui/icons-material/SearchRounded";
import HistoryRounded from "@mui/icons-material/HistoryRounded";
import CurrencyRupeeRounded from "@mui/icons-material/CurrencyRupeeRounded";
import CloudRounded from "@mui/icons-material/CloudRounded";

const API_URL =
  "https://costthresholdalarm.duckdns.org/api/spending-history/";

const SETTINGS_URL =
  "https://costthresholdalarm.duckdns.org/api/settings/";

const EXCHANGE_URL =
  "https://api.frankfurter.dev/v1/latest?base=USD&symbols=INR,EUR,GBP";

const SUPPORTED_CURRENCIES = ["INR", "USD", "EUR", "GBP"];

export default function SpendingHistory() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [period, setPeriod] = useState("All");

  const [spendingRecords, setSpendingRecords] = useState([]);
  const [currency, setCurrency] = useState("USD");
  const [exchangeRate, setExchangeRate] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currencyWarning, setCurrencyWarning] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");
        setCurrencyWarning("");

        const [historyResponse, settingsResponse] =
          await Promise.all([
            fetch(API_URL),
            fetch(SETTINGS_URL),
          ]);

        if (!historyResponse.ok) {
          throw new Error("Unable to fetch actual AWS spending history.");
        }

        const historyData = await historyResponse.json();

        const records = (historyData.records || []).map((record) => ({
          ...record,
          cost: Math.max(0, Number(record.amount) || 0),
        }));

        if (cancelled) return;

        setSpendingRecords(records);

        let selectedCurrency = "USD";

        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json();

          if (
            SUPPORTED_CURRENCIES.includes(settingsData.currency)
          ) {
            selectedCurrency = settingsData.currency;
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
                "Live exchange rates are unavailable. Amounts are displayed in USD."
              );
            }
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Backend connection failed.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredRecords = useMemo(() => {
    return spendingRecords.filter((record) => {
      const service = (record.service || "").toLowerCase();
      const recordCategory = (record.category || "").toLowerCase();

      const matchesSearch =
        service.includes(search.toLowerCase()) ||
        recordCategory.includes(search.toLowerCase());

      const matchesCategory =
        category === "All" || record.category === category;

      const recordDate = new Date(`${record.date}T00:00:00`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const daysAgo = Math.floor(
        (today - recordDate) / (1000 * 60 * 60 * 24)
      );

      const matchesPeriod =
        period === "All" ||
        (period === "7 days" && daysAgo >= 0 && daysAgo < 7) ||
        (period === "30 days" && daysAgo >= 0 && daysAgo < 30);

      return matchesSearch && matchesCategory && matchesPeriod;
    });
  }, [spendingRecords, search, category, period]);

  const totalSpending = filteredRecords.reduce(
    (sum, record) => sum + record.cost,
    0
  );

  const averageSpending =
    filteredRecords.length > 0
      ? totalSpending / filteredRecords.length
      : 0;

  const highestRecord =
    filteredRecords.length > 0
      ? Math.max(...filteredRecords.map((record) => record.cost))
      : 0;

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount * exchangeRate);

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
        <Typography variant="h4" fontWeight={800} sx={{ mb: 1 }}>
          Spending History
        </Typography>

        <Typography color="text.secondary">
          Review and search your actual AWS cloud spending records.
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
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Card sx={{ borderRadius: 3, border: "1px solid #eee" }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography color="text.secondary" fontWeight={600}>
                      Total Spending
                    </Typography>
                    <CurrencyRupeeRounded sx={{ color: "#EC5E27" }} />
                  </Stack>

                  <Typography variant="h5" fontWeight={800} sx={{ mt: 1 }}>
                    {formatCurrency(totalSpending)}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Based on filtered records
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <Card sx={{ borderRadius: 3, border: "1px solid #eee" }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography color="text.secondary" fontWeight={600}>
                      Average Cost
                    </Typography>
                    <HistoryRounded sx={{ color: "#3B82F6" }} />
                  </Stack>

                  <Typography variant="h5" fontWeight={800} sx={{ mt: 1 }}>
                    {formatCurrency(averageSpending)}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Per spending record
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <Card sx={{ borderRadius: 3, border: "1px solid #eee" }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography color="text.secondary" fontWeight={600}>
                      Highest Cost
                    </Typography>
                    <CloudRounded sx={{ color: "#F59E0B" }} />
                  </Stack>

                  <Typography variant="h5" fontWeight={800} sx={{ mt: 1 }}>
                    {formatCurrency(highestRecord)}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Highest individual record
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card sx={{ borderRadius: 3, border: "1px solid #eee" }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Spending Records
              </Typography>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, md: 5 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search AWS service..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchRounded />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3.5 }}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Category"
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                  >
                    <MenuItem value="All">All Categories</MenuItem>
                    <MenuItem value="Compute">Compute</MenuItem>
                    <MenuItem value="Storage">Storage</MenuItem>
                    <MenuItem value="Database">Database</MenuItem>
                    <MenuItem value="Monitoring">Monitoring</MenuItem>
                    <MenuItem value="Notifications">Notifications</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </TextField>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3.5 }}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Date Range"
                    value={period}
                    onChange={(event) => setPeriod(event.target.value)}
                  >
                    <MenuItem value="All">All Records</MenuItem>
                    <MenuItem value="7 days">Last 7 Days</MenuItem>
                    <MenuItem value="30 days">Last 30 Days</MenuItem>
                  </TextField>
                </Grid>
              </Grid>

              <TableContainer sx={{ overflowX: "auto" }}>
                <Table sx={{ minWidth: 650 }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#F8F7F2" }}>
                      <TableCell sx={{ fontWeight: 700 }}>AWS Service</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Cost</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {filteredRecords.map((record) => (
                      <TableRow key={record.id} hover>
                        <TableCell>
                          <Typography fontWeight={600}>
                            {record.service}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Chip
                            label={record.category}
                            size="small"
                            sx={{
                              bgcolor: "#FFF0E9",
                              color: "#C84B1C",
                              fontWeight: 600,
                            }}
                          />
                        </TableCell>

                        <TableCell>{record.date}</TableCell>

                        <TableCell>
                          <Typography fontWeight={700}>
                            {formatCurrency(record.cost)}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          {record.description || "AWS billing record"}
                        </TableCell>
                      </TableRow>
                    ))}

                    {filteredRecords.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                          <Typography color="text.secondary">
                            No actual spending records found.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Showing {filteredRecords.length} records from AWS Cost Explorer.
              </Typography>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
}
