import { useCallback, useEffect, useState } from "react";

import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import CloudRounded from "@mui/icons-material/CloudRounded";
import AccountBalanceWalletRounded from "@mui/icons-material/AccountBalanceWalletRounded";
import SavingsRounded from "@mui/icons-material/SavingsRounded";
import TrendingUpRounded from "@mui/icons-material/TrendingUpRounded";
import RefreshRounded from "@mui/icons-material/Refresh";

import {
  loadCurrencySettings,
  formatMoney,
} from "../services/currency";

const API_BASE_URL = "https://costthresholdalarm.duckdns.org";

export default function Overview({ backendStatus }) {
  const [budgets, setBudgets] = useState([]);
  const [spendingRecords, setSpendingRecords] = useState([]);
  const [awsCost, setAwsCost] = useState(null);
  const [currencyInfo, setCurrencyInfo] = useState({
    currency: "USD",
    rate: 1,
    warning: "",
  });
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState([]);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setErrors([]);

    const [budgetResult, historyResult, costResult, currencyResult] =
      await Promise.allSettled([
        fetch(`${API_BASE_URL}/api/budgets/`).then(async (response) => {
          if (!response.ok) {
            const body = await response.json().catch(() => ({}));
            throw new Error(body.detail || "Unable to load budgets.");
          }
          return response.json();
        }),
        fetch(`${API_BASE_URL}/api/spending-history/`).then(async (response) => {
          if (!response.ok) {
            const body = await response.json().catch(() => ({}));
            throw new Error(body.detail || "Unable to load spending history.");
          }
          return response.json();
        }),
        fetch(`${API_BASE_URL}/api/aws-costs/?granularity=MONTHLY`).then(async (response) => {
          if (!response.ok) {
            const body = await response.json().catch(() => ({}));
            throw new Error(body.detail || "Unable to load AWS Cost Explorer data.");
          }
          return response.json();
        }),
        loadCurrencySettings(),
      ]);

    const nextErrors = [];

    if (budgetResult.status === "fulfilled" && Array.isArray(budgetResult.value)) {
      setBudgets(budgetResult.value);
    } else {
      setBudgets([]);
      nextErrors.push(
        budgetResult.status === "rejected"
          ? budgetResult.reason.message
          : "Unexpected budget response."
      );
    }

    if (historyResult.status === "fulfilled") {
      setSpendingRecords(historyResult.value.records || []);
    } else {
      setSpendingRecords([]);
      nextErrors.push(historyResult.reason.message);
    }

    if (costResult.status === "fulfilled") {
      const latest = costResult.value.results?.[0];
      setAwsCost(latest ? {
        ...latest,
        source: costResult.value.source,
        currency: latest.unit || costResult.value.currency || "USD",
      } : null);
      if (!latest) nextErrors.push("No AWS cost records were returned for this period.");
    } else {
      setAwsCost(null);
      nextErrors.push(costResult.reason.message);
    }

    if (currencyResult.status === "fulfilled") {
      setCurrencyInfo(currencyResult.value);
    }

    setErrors(nextErrors);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const monthlyBudgets = budgets.filter((budget) => budget.period === "Monthly");
  const totalBudget = monthlyBudgets.reduce(
    (sum, budget) => sum + Math.max(0, Number(budget.amount) || 0),
    0
  );
  const totalBudgetSpent = monthlyBudgets.reduce(
    (sum, budget) => sum + Math.max(0, Number(budget.spent) || 0),
    0
  );
  const remainingBudget = totalBudget - totalBudgetSpent;
  const utilization = totalBudget > 0 ? (totalBudgetSpent / totalBudget) * 100 : 0;
  const { currency, rate, warning } = currencyInfo;
  const awsAmount = Math.max(0, Number(awsCost?.amount) || 0);

  const stats = [
    {
      title: "AWS Monthly Cost",
      value: awsCost ? formatMoney(awsAmount, currency, rate) : "Unavailable",
      subtitle: "Current month · AWS Cost Explorer",
      icon: <CloudRounded />,
      color: "#EC5E27",
    },
    {
      title: "Monthly Budget",
      value: formatMoney(totalBudget, currency, rate),
      subtitle: "Combined monthly budget limits",
      icon: <AccountBalanceWalletRounded />,
      color: "#3B82F6",
    },
    {
      title: "Budget Spending",
      value: formatMoney(totalBudgetSpent, currency, rate),
      subtitle: "Actual spending across monthly budgets",
      icon: <TrendingUpRounded />,
      color: "#D97706",
    },
    {
      title: "Remaining Budget",
      value: formatMoney(remainingBudget, currency, rate),
      subtitle: "Combined monthly balance",
      icon: <SavingsRounded />,
      color: remainingBudget < 0 ? "#DC2626" : "#16A34A",
    },
  ];

  const connection = {
    checking: { label: "Checking connection", color: "warning" },
    connected: { label: "Backend connected", color: "success" },
    disconnected: { label: "Backend unavailable", color: "error" },
  }[backendStatus] || { label: "Checking connection", color: "warning" };

  return (
    <Box sx={{ width: "100%", minWidth: 0 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
          mb: 1,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Dashboard Overview
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Monitor actual AWS costs and your budget performance.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshRounded />}
          onClick={fetchDashboardData}
          disabled={loading}
          sx={{
            color: "#EC5E27",
            borderColor: "#EC5E27",
            "&:hover": { borderColor: "#D94F1C", bgcolor: "#FFF0E9" },
          }}
        >
          Refresh
        </Button>
      </Box>

      <Card sx={{ my: 3, borderRadius: 3, border: "1px solid #EEECE5" }}>
        <CardContent sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
          <Box>
            <Typography fontWeight={700}>Backend Connection</Typography>
            <Typography variant="body2" color="text.secondary">
              {backendStatus === "connected"
                ? "The FastAPI backend is responding."
                : backendStatus === "disconnected"
                  ? "The backend is currently unavailable. AWS data cannot be refreshed."
                  : "Checking backend availability..."}
            </Typography>
          </Box>
          <Chip label={connection.label} color={connection.color} variant="outlined" />
        </CardContent>
      </Card>

      {warning && <Alert severity="warning" sx={{ mb: 2 }}>{warning}</Alert>}
      {errors.map((error, index) => (
        <Alert severity="warning" sx={{ mb: 1 }} key={index}>{error}</Alert>
      ))}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 7 }}>
          <CircularProgress sx={{ color: "#EC5E27" }} />
        </Box>
      ) : (
        <>
          <Grid container spacing={2.5}>
            {stats.map((stat) => (
              <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={stat.title}>
                <Card sx={{ height: "100%", borderRadius: 3, border: "1px solid #EEECE5" }}>
                  <CardContent>
                    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, mb: 2 }}>
                      <Typography color="text.secondary" fontWeight={600}>{stat.title}</Typography>
                      <Avatar sx={{ bgcolor: `${stat.color}18`, color: stat.color }}>{stat.icon}</Avatar>
                    </Box>
                    <Typography variant="h5" fontWeight={800} sx={{ overflowWrap: "anywhere" }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {stat.subtitle}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Card sx={{ mt: 3, borderRadius: 3, border: "1px solid #F4C6B3" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
                <Box>
                  <Typography variant="h6" fontWeight={700}>AWS Cost Explorer</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {awsCost
                      ? `${awsCost.start_date} to ${awsCost.end_date} · ${awsCost.currency || "USD"}`
                      : "No AWS billing data currently available"}
                  </Typography>
                </Box>
                <Chip
                  label={awsCost ? "AWS data received" : "AWS data unavailable"}
                  color={awsCost ? "success" : "warning"}
                  variant="outlined"
                />
              </Box>
              {awsCost && (
                <>
                  <Typography variant="h3" fontWeight={800} color="#EC5E27" sx={{ my: 2 }}>
                    {formatMoney(awsAmount, currency, rate)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Source: {awsCost.source}. Cost Explorer billing data can be delayed; this is not instant real-time billing.
                    {awsCost.estimated ? " The returned amount is estimated." : ""}
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>

          <Card sx={{ mt: 3, borderRadius: 3, border: "1px solid #EEECE5" }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700}>Monthly Budget Utilization</Typography>
              <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
                {formatMoney(totalBudgetSpent, currency, rate)} used of {formatMoney(totalBudget, currency, rate)}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={Math.min(Math.max(utilization, 0), 100)}
                sx={{ height: 12, borderRadius: 8, bgcolor: "#F1F1ED", "& .MuiLinearProgress-bar": { bgcolor: "#EC5E27" } }}
              />
              <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1, flexWrap: "wrap", gap: 1 }}>
                <Typography variant="body2" fontWeight={600}>{utilization.toFixed(1)}% used</Typography>
                <Typography variant="body2" color="text.secondary">{Math.max(0, 100 - utilization).toFixed(1)}% remaining</Typography>
              </Box>
              {monthlyBudgets.length === 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>No monthly budgets configured yet. Create a monthly budget to track utilization.</Alert>
              )}
            </CardContent>
          </Card>

          <Card sx={{ mt: 3, borderRadius: 3, border: "1px solid #EEECE5" }}>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 2 }}>
                <Box>
                  <Typography variant="h6" fontWeight={700}>Recent AWS Spending</Typography>
                  <Typography variant="body2" color="text.secondary">Latest records returned by AWS Cost Explorer</Typography>
                </Box>
                <Chip label={`${spendingRecords.length} records`} sx={{ bgcolor: "#FFF0E9", color: "#C84B1C", fontWeight: 700 }} />
              </Box>
              {spendingRecords.length === 0 ? (
                <Typography color="text.secondary" sx={{ py: 2 }}>No spending records available for this period.</Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>AWS Service</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {spendingRecords.slice(0, 6).map((record) => (
                        <TableRow key={record.id} hover>
                          <TableCell>{record.service}</TableCell>
                          <TableCell>{record.category}</TableCell>
                          <TableCell>{record.date}</TableCell>
                          <TableCell align="right">{formatMoney(record.amount, currency, rate)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
}
