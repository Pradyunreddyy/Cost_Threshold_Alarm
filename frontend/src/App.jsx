
import { useEffect, useState } from "react";

import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  CssBaseline,
  Divider,
  Card,
  CardContent,
  Grid,
  Avatar,
  useMediaQuery,
  Chip,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
} from "@mui/material";

import { useTheme } from "@mui/material/styles";

import MenuRounded from "@mui/icons-material/MenuRounded";
import DashboardRounded from "@mui/icons-material/DashboardRounded";
import AccountBalanceWalletRounded from "@mui/icons-material/AccountBalanceWalletRounded";
import AnalyticsRounded from "@mui/icons-material/AnalyticsRounded";
import CloudRounded from "@mui/icons-material/CloudRounded";
import NotificationsActiveRounded from "@mui/icons-material/NotificationsActiveRounded";
import HistoryRounded from "@mui/icons-material/History";
import SettingsRounded from "@mui/icons-material/SettingsRounded";
import CurrencyRupeeRounded from "@mui/icons-material/CurrencyRupeeRounded";
import TrendingUpRounded from "@mui/icons-material/TrendingUpRounded";
import SavingsRounded from "@mui/icons-material/SavingsRounded";
import RefreshRounded from "@mui/icons-material/RefreshRounded";

import BudgetManagement from "./pages/BudgetManagement";
import CostAnalytics from "./pages/CostAnalytics";
import AWSServices from "./pages/AWSServices";
import AlertsNotifications from "./pages/AlertsNotifications";
import SpendingHistory from "./pages/SpendingHistory";
import Settings from "./pages/Settings";

import { checkBackendHealth } from "./services/api";

const drawerWidth = 250;
const API_BASE_URL = "https://cost-threshold-alarm-backend.onrender.com";

const menuItems = [
  { text: "Overview", icon: <DashboardRounded /> },
  { text: "Budget Management", icon: <AccountBalanceWalletRounded /> },
  { text: "Cost Analytics", icon: <AnalyticsRounded /> },
  { text: "AWS Services", icon: <CloudRounded /> },
  { text: "Alerts & Notifications", icon: <NotificationsActiveRounded /> },
  { text: "Spending History", icon: <HistoryRounded /> },
  { text: "Settings", icon: <SettingsRounded /> },
];

const currencySymbols = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

function Overview({ backendStatus }) {
  const [budgets, setBudgets] = useState([]);
  const [spendingRecords, setSpendingRecords] = useState([]);
  const [currency, setCurrency] = useState("INR");

  const [awsCost, setAwsCost] = useState(null);
  const [awsError, setAwsError] = useState("");

  const [loading, setLoading] = useState(true);
  const [budgetError, setBudgetError] = useState("");
  const [historyError, setHistoryError] = useState("");

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setBudgetError("");
      setHistoryError("");
      setAwsError("");

      const [budgetResponse, historyResponse, settingsResponse] =
        await Promise.all([
          fetch(`${API_BASE_URL}/api/budgets/`),
          fetch(`${API_BASE_URL}/api/spending-history/`),
          fetch(`${API_BASE_URL}/api/settings/`),
        ]);

      if (!budgetResponse.ok) {
        throw new Error("Unable to load budget information.");
      }

      const budgetData = await budgetResponse.json();
      setBudgets(budgetData);

      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setSpendingRecords(historyData.records || []);
      } else {
        setHistoryError("Unable to load recent spending records.");
      }

      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        setCurrency(settingsData.currency || "INR");
      }
    } catch (error) {
      setBudgetError(error.message || "Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }

    // Retrieve actual AWS Cost Explorer data separately.
    try {
      const awsResponse = await fetch(
        `${API_BASE_URL}/api/aws-costs/?granularity=MONTHLY`
      );

      if (!awsResponse.ok) {
        throw new Error("Unable to retrieve AWS Cost Explorer data.");
      }

      const awsData = await awsResponse.json();
      const latestResult = awsData.results?.[0];

      if (!latestResult) {
        throw new Error("No AWS cost records were returned.");
      }

      setAwsCost({
        ...latestResult,
        source: awsData.source,
        currency: latestResult.unit || awsData.currency || "USD",
      });
    } catch (error) {
      setAwsCost(null);
      setAwsError(
        error.message || "Unable to retrieve AWS Cost Explorer data."
      );
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const monthlyBudgets = budgets.filter(
    (budget) => budget.period === "Monthly"
  );

  const totalBudget = monthlyBudgets.reduce(
    (total, budget) => total + Number(budget.amount),
    0
  );

  const totalSpending = monthlyBudgets.reduce(
    (total, budget) => total + Number(budget.spent),
    0
  );

  const remainingBudget = totalBudget - totalSpending;

  const utilization =
    totalBudget > 0 ? (totalSpending / totalBudget) * 100 : 0;

  const currencySymbol = currencySymbols[currency] || "₹";

  const awsAmount = Number(awsCost?.amount || 0);

  const awsDisplayAmount =
    Math.abs(awsAmount) < 0.005
      ? "$0.00"
      : `$${awsAmount.toFixed(2)}`;

  const stats = [
    {
      title: "Total Spending",
      value: `${currencySymbol}${totalSpending.toFixed(2)}`,
      subtitle: "Monthly budget spending",
      icon: <CurrencyRupeeRounded />,
      color: "#EC5E27",
    },
    {
      title: "Total Budget",
      value: `${currencySymbol}${totalBudget.toFixed(2)}`,
      subtitle: "Combined monthly limits",
      icon: <AccountBalanceWalletRounded />,
      color: "#3B82F6",
    },
    {
      title: "Remaining Budget",
      value: `${currencySymbol}${remainingBudget.toFixed(2)}`,
      subtitle: "Available monthly balance",
      icon: <SavingsRounded />,
      color: "#16A34A",
    },
    {
      title: "Budget Utilization",
      value: `${utilization.toFixed(1)}%`,
      subtitle: "Monthly budget usage",
      icon: <TrendingUpRounded />,
      color: "#F59E0B",
    },
  ];

  const connectionDetails = {
    checking: {
      label: "Checking connection",
      color: "warning",
      message: "Checking FastAPI backend...",
    },
    connected: {
      label: "Backend Connected",
      color: "success",
      message: "FastAPI backend is responding successfully.",
    },
    disconnected: {
      label: "Backend Disconnected",
      color: "error",
      message: "Unable to communicate with the backend.",
    },
  };

  const connection =
    connectionDetails[backendStatus] || connectionDetails.checking;

  return (
    <Box>
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
        <Typography variant="h4" fontWeight={800}>
          Dashboard Overview
        </Typography>

        <Button
          variant="outlined"
          startIcon={<RefreshRounded />}
          onClick={fetchDashboardData}
          disabled={loading}
          sx={{
            color: "#EC5E27",
            borderColor: "#EC5E27",
            "&:hover": {
              borderColor: "#D94F1C",
              bgcolor: "#FFF0E9",
            },
          }}
        >
          Refresh
        </Button>
      </Box>

      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Monitor your cloud spending and budget performance.
      </Typography>

      <Card
        sx={{
          mb: 3,
          borderRadius: 3,
          border: "1px solid #eee",
          boxShadow: "0 3px 12px rgba(0,0,0,0.04)",
        }}
      >
        <CardContent
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box>
            <Typography fontWeight={700}>
              Backend Connection
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.5 }}
            >
              {connection.message}
            </Typography>
          </Box>

          <Chip
            label={connection.label}
            color={connection.color}
            variant="outlined"
            sx={{ fontWeight: 700 }}
          />
        </CardContent>
      </Card>

      {budgetError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {budgetError}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
          <CircularProgress sx={{ color: "#EC5E27" }} />
        </Box>
      ) : (
        <>
          <Grid container spacing={2.5}>
            {stats.map((stat) => (
              <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={stat.title}>
                <Card
                  sx={{
                    height: "100%",
                    borderRadius: 3,
                    border: "1px solid #eee",
                    boxShadow: "0 3px 12px rgba(0,0,0,0.04)",
                  }}
                >
                  <CardContent>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 2,
                      }}
                    >
                      <Typography color="text.secondary" fontWeight={600}>
                        {stat.title}
                      </Typography>

                      <Avatar
                        sx={{
                          bgcolor: `${stat.color}18`,
                          color: stat.color,
                        }}
                      >
                        {stat.icon}
                      </Avatar>
                    </Box>

                    <Typography variant="h5" fontWeight={800}>
                      {stat.value}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      {stat.subtitle}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* AWS Cost Explorer Card */}
          <Card
            sx={{
              mt: 3,
              borderRadius: 3,
              border: "1px solid #F4C6B3",
              boxShadow: "0 3px 12px rgba(0,0,0,0.04)",
            }}
          >
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 2,
                  mb: 2,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: "#FFF0E9",
                      color: "#EC5E27",
                    }}
                  >
                    <CloudRounded />
                  </Avatar>

                  <Box>
                    <Typography variant="h6" fontWeight={700}>
                      AWS Cost Explorer
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      Actual AWS account costs for the current month
                    </Typography>
                  </Box>
                </Box>

                <Chip
                  label={awsCost ? "AWS Connected" : "Waiting for AWS Data"}
                  color={awsCost ? "success" : "warning"}
                  variant="outlined"
                  sx={{ fontWeight: 700 }}
                />
              </Box>

              {awsError ? (
                <Alert severity="warning">{awsError}</Alert>
              ) : awsCost ? (
                <>
                  <Typography
                    variant="h3"
                    fontWeight={800}
                    color="#EC5E27"
                    sx={{ my: 2 }}
                  >
                    {awsDisplayAmount}
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        Currency
                      </Typography>
                      <Typography fontWeight={700}>
                        {awsCost.currency}
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        Period
                      </Typography>
                      <Typography fontWeight={700}>
                        {awsCost.start_date} to {awsCost.end_date}
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        Estimate Status
                      </Typography>
                      <Chip
                        size="small"
                        label={awsCost.estimated ? "Estimated" : "Final"}
                        color={awsCost.estimated ? "warning" : "success"}
                        variant="outlined"
                      />
                    </Grid>
                  </Grid>

                  {Math.abs(awsAmount) < 0.005 && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 2 }}
                    >
                      AWS returned a very small adjustment below one cent.
                      The amount is rounded for dashboard display.
                    </Typography>
                  )}

                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mt: 2 }}
                  >
                    Source: {awsCost.source}. AWS Cost Explorer data may be
                    delayed and is not instant real-time billing.
                  </Typography>
                </>
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <CircularProgress size={22} sx={{ color: "#EC5E27" }} />
                  <Typography color="text.secondary">
                    Retrieving AWS Cost Explorer data...
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Budget Status */}
          <Card
            sx={{
              mt: 3,
              borderRadius: 3,
              border: "1px solid #eee",
              boxShadow: "0 3px 12px rgba(0,0,0,0.04)",
            }}
          >
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                Budget Status
              </Typography>

              <Typography color="text.secondary" sx={{ mb: 2 }}>
                Combined monthly budget utilization
              </Typography>

              <Box
                sx={{
                  height: 13,
                  bgcolor: "#F1F1ED",
                  borderRadius: 10,
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    width: `${Math.min(utilization, 100)}%`,
                    height: "100%",
                    bgcolor: "#EC5E27",
                    borderRadius: 10,
                    transition: "width 0.5s ease",
                  }}
                />
              </Box>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mt: 1,
                }}
              >
                <Typography variant="body2" fontWeight={600}>
                  {utilization.toFixed(1)}% Used
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  {(100 - Math.min(utilization, 100)).toFixed(1)}% Remaining
                </Typography>
              </Box>

              {monthlyBudgets.length === 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  No monthly budgets configured. Create a monthly budget to
                  view utilization.
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Recent Spending */}
          <Card
            sx={{
              mt: 3,
              borderRadius: 3,
              border: "1px solid #eee",
              boxShadow: "0 3px 12px rgba(0,0,0,0.04)",
            }}
          >
            <CardContent>
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
                    Recent Spending
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    Latest records retrieved from the backend
                  </Typography>
                </Box>

                <Chip
                  label={`${spendingRecords.length} Records`}
                  sx={{
                    bgcolor: "#FFF0E9",
                    color: "#C84B1C",
                    fontWeight: 700,
                  }}
                />
              </Box>

              {historyError && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  {historyError}
                </Alert>
              )}

              {spendingRecords.length === 0 ? (
                <Typography color="text.secondary" sx={{ py: 2 }}>
                  No spending records available.
                </Typography>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>
                          AWS Service
                        </TableCell>

                        <TableCell sx={{ fontWeight: 700 }}>
                          Category
                        </TableCell>

                        <TableCell sx={{ fontWeight: 700 }}>
                          Date
                        </TableCell>

                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          Amount (USD)
                        </TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {spendingRecords.slice(0, 5).map((record) => (
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
                              variant="outlined"
                            />
                          </TableCell>

                          <TableCell>{record.date}</TableCell>

                          <TableCell align="right">
                            <Typography fontWeight={700}>
                              ${Number(record.amount).toFixed(2)}
                            </Typography>
                          </TableCell>
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

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mt: 2 }}
      >
        AWS Cost Explorer provides live account cost data through FastAPI.
        Budget figures and recent spending history are maintained separately.
        Budget currency selection does not convert AWS costs from USD.
      </Typography>
    </Box>
  );
}

export default function App() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [selectedPage, setSelectedPage] = useState("Overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [backendStatus, setBackendStatus] = useState("checking");

  useEffect(() => {
    let isMounted = true;

    const checkConnection = async () => {
      try {
        await checkBackendHealth();

        if (isMounted) {
          setBackendStatus("connected");
        }
      } catch (error) {
        if (isMounted) {
          setBackendStatus("disconnected");
        }
      }
    };

    checkConnection();

    const intervalId = setInterval(checkConnection, 10000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  const handleNavigation = (page) => {
    setSelectedPage(page);
    setMobileOpen(false);
  };

  const renderPage = () => {
    switch (selectedPage) {
      case "Overview":
        return <Overview backendStatus={backendStatus} />;

      case "Budget Management":
        return <BudgetManagement />;

      case "Cost Analytics":
        return <CostAnalytics />;

      case "AWS Services":
        return <AWSServices />;

      case "Alerts & Notifications":
        return <AlertsNotifications />;

      case "Spending History":
        return <SpendingHistory />;

      case "Settings":
        return <Settings />;

      default:
        return <Overview backendStatus={backendStatus} />;
    }
  };

  const drawerContent = (
    <Box sx={{ height: "100%", bgcolor: "#292524", color: "#fff" }}>
      <Box sx={{ px: 3, py: 3 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <Avatar
            variant="rounded"
            sx={{
              bgcolor: "#EC5E27",
              width: 42,
              height: 42,
              borderRadius: 2,
            }}
          >
            <CloudRounded />
          </Avatar>

          <Box>
            <Typography fontWeight={800} fontSize={19}>
              Cost Alarm
            </Typography>

            <Typography fontSize={11} sx={{ color: "#C4BDB8" }}>
              CLOUD COST MONITORING
            </Typography>
          </Box>
        </Box>
      </Box>

      <Divider sx={{ borderColor: "#49413D" }} />

      <Typography
        sx={{
          px: 3,
          pt: 3,
          pb: 1,
          fontSize: 11,
          fontWeight: 700,
          color: "#A8A29E",
          letterSpacing: 1,
        }}
      >
        MAIN MENU
      </Typography>

      <List sx={{ px: 1.5 }}>
        {menuItems.map((item) => (
          <ListItemButton
            key={item.text}
            selected={selectedPage === item.text}
            onClick={() => handleNavigation(item.text)}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              color: selectedPage === item.text ? "#fff" : "#D6D3D1",
              "& .MuiListItemIcon-root": {
                color: selectedPage === item.text ? "#fff" : "#A8A29E",
                minWidth: 40,
              },
              "&.Mui-selected": {
                bgcolor: "#EC5E27",
              },
              "&.Mui-selected:hover": {
                bgcolor: "#D94F1C",
              },
              "&:hover": {
                bgcolor: "#403A36",
              },
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>

            <ListItemText
              primary={item.text}
              slotProps={{
                primary: {
                  sx: {
                    fontSize: 13,
                    fontWeight: selectedPage === item.text ? 700 : 500,
                  },
                },
              }}
            />
          </ListItemButton>
        ))}
      </List>

      <Box sx={{ position: "absolute", bottom: 18, left: 22 }}>
        <Typography fontSize={11} color="#A8A29E">
          Cost Threshold Alarm
        </Typography>

        <Typography fontSize={10} color="#78716C">
          Software-Based Monitoring
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#FDFDF1" }}>
      <CssBaseline />

      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: "#FFFFFF",
          color: "#292524",
          borderBottom: "1px solid #EAE8E2",
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton
              edge="start"
              onClick={() => setMobileOpen(true)}
              sx={{ mr: 2, color: "#292524" }}
            >
              <MenuRounded />
            </IconButton>
          )}

          <Typography fontWeight={700} sx={{ flexGrow: 1 }}>
            {selectedPage}
          </Typography>

          <Avatar
            sx={{
              bgcolor: "#EC5E27",
              width: 36,
              height: 36,
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            U
          </Avatar>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        {isMobile ? (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{
              "& .MuiDrawer-paper": {
                width: drawerWidth,
                bgcolor: "#292524",
                border: "none",
              },
            }}
          >
            {drawerContent}
          </Drawer>
        ) : (
          <Drawer
            variant="permanent"
            open
            sx={{
              "& .MuiDrawer-paper": {
                width: drawerWidth,
                boxSizing: "border-box",
                bgcolor: "#292524",
                border: "none",
              },
            }}
          >
            {drawerContent}
          </Drawer>
        )}
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minWidth: 0,
          p: { xs: 2, sm: 3, md: 4 },
          mt: "64px",
        }}
      >
        {renderPage()}
      </Box>
    </Box>
  );
}
