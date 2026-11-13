
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
  Avatar,
  useMediaQuery,
  useTheme,
} from "@mui/material";

import {
  MenuRounded,
  CloudRounded,
  DashboardRounded,
  AccountBalanceWalletRounded,
  AnalyticsRounded,
  CloudQueueRounded,
  NotificationsActiveRounded,
  HistoryRounded,
  SettingsRounded,
} from "@mui/icons-material";

import Overview from "./pages/Overview";
import BudgetManagement from "./pages/BudgetManagement";
import CostAnalytics from "./pages/CostAnalytics";
import AWSServices from "./pages/AWSServices";
import AlertsNotifications from "./pages/AlertsNotifications";
import SpendingHistory from "./pages/SpendingHistory";
import Settings from "./pages/Settings";

import { checkBackendHealth } from "./services/api";

const drawerWidth = 250;
const collapsedDrawerWidth = 76;

const menuItems = [
  {
    text: "Overview",
    icon: <DashboardRounded />,
  },
  {
    text: "Budget Management",
    icon: <AccountBalanceWalletRounded />,
  },
  {
    text: "Cost Analytics",
    icon: <AnalyticsRounded />,
  },
  {
    text: "AWS Services",
    icon: <CloudQueueRounded />,
  },
  {
    text: "Alerts & Notifications",
    icon: <NotificationsActiveRounded />,
  },
  {
    text: "Spending History",
    icon: <HistoryRounded />,
  },
  {
    text: "Settings",
    icon: <SettingsRounded />,
  },
];

export default function App() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [selectedPage, setSelectedPage] = useState("Overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [backendStatus, setBackendStatus] = useState("checking");

  const currentDrawerWidth = desktopCollapsed
    ? collapsedDrawerWidth
    : drawerWidth;

  // Check backend availability every 10 seconds.
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

  // Shared sidebar content for desktop and mobile.
  const drawerContent = (
    <Box
      sx={{
        height: "100%",
        bgcolor: "#292524",
        color: "#fff",
        overflowX: "hidden",
        position: "relative",
      }}
    >
      {/* Branding */}
      <Box
        sx={{
          px: desktopCollapsed && !isMobile ? 1 : 3,
          py: 3,
          display: "flex",
          justifyContent:
            desktopCollapsed && !isMobile
              ? "center"
              : "flex-start",
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
            variant="rounded"
            sx={{
              bgcolor: "#EC5E27",
              width: 42,
              height: 42,
              borderRadius: 2,
              flexShrink: 0,
            }}
          >
            <CloudRounded />
          </Avatar>

          {(!desktopCollapsed || isMobile) && (
            <Box>
              <Typography fontWeight={800} fontSize={19}>
                Cost Alarm
              </Typography>

              <Typography
                fontSize={11}
                sx={{ color: "#C4BDB8" }}
              >
                CLOUD COST MONITORING
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      <Divider sx={{ borderColor: "#49413D" }} />

      {/* Menu heading */}
      {(!desktopCollapsed || isMobile) && (
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
      )}

      {/* Navigation */}
      <List
        sx={{
          px: desktopCollapsed && !isMobile ? 1 : 1.5,
          pt: desktopCollapsed && !isMobile ? 2 : 0,
        }}
      >
        {menuItems.map((item) => (
          <ListItemButton
            key={item.text}
            selected={selectedPage === item.text}
            onClick={() => handleNavigation(item.text)}
            title={
              desktopCollapsed && !isMobile
                ? item.text
                : undefined
            }
            sx={{
              borderRadius: 2,
              mb: 0.5,
              minHeight: 46,
              justifyContent:
                desktopCollapsed && !isMobile
                  ? "center"
                  : "flex-start",
              px:
                desktopCollapsed && !isMobile
                  ? 1
                  : 2,

              color:
                selectedPage === item.text
                  ? "#fff"
                  : "#D6D3D1",

              "& .MuiListItemIcon-root": {
                color:
                  selectedPage === item.text
                    ? "#fff"
                    : "#A8A29E",
                minWidth:
                  desktopCollapsed && !isMobile
                    ? 0
                    : 40,
                justifyContent: "center",
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

            {(!desktopCollapsed || isMobile) && (
              <ListItemText
                primary={item.text}
                slotProps={{
                  primary: {
                    sx: {
                      fontSize: 13,
                      fontWeight:
                        selectedPage === item.text
                          ? 700
                          : 500,
                    },
                  },
                }}
              />
            )}
          </ListItemButton>
        ))}
      </List>

      {/* Sidebar footer */}
      {(!desktopCollapsed || isMobile) && (
        <Box
          sx={{
            position: "absolute",
            bottom: 18,
            left: 22,
          }}
        >
          <Typography fontSize={11} color="#A8A29E">
            Cost Threshold Alarm
          </Typography>

          <Typography fontSize={10} color="#78716C">
            Software-Based Monitoring
          </Typography>
        </Box>
      )}
    </Box>
  );

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: "#FDFDF1",
      }}
    >
      <CssBaseline />

      {/* Top navigation bar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: {
            md: `calc(100% - ${currentDrawerWidth}px)`,
          },
          ml: {
            md: `${currentDrawerWidth}px`,
          },
          bgcolor: "#FFFFFF",
          color: "#292524",
          borderBottom: "1px solid #EAE8E2",
          transition: "width 0.25s ease, margin 0.25s ease",
        }}
      >
        <Toolbar>
          {/* Mobile menu button */}
          {isMobile && (
            <IconButton
              edge="start"
              onClick={() => setMobileOpen(true)}
              sx={{
                mr: 2,
                color: "#292524",
              }}
              aria-label="Open navigation"
            >
              <MenuRounded />
            </IconButton>
          )}

          {/* Desktop sidebar collapse button */}
          {!isMobile && (
            <IconButton
              onClick={() =>
                setDesktopCollapsed((previous) => !previous)
              }
              sx={{
                mr: 2,
                color: "#EC5E27",
              }}
              aria-label="Toggle sidebar"
            >
              <MenuRounded />
            </IconButton>
          )}

          <Typography
            fontWeight={700}
            sx={{ flexGrow: 1 }}
          >
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

      {/* Sidebar navigation */}
      <Box
        component="nav"
        sx={{
          width: {
            md: currentDrawerWidth,
          },
          flexShrink: {
            md: 0,
          },
          transition: "width 0.25s ease",
        }}
      >
        {isMobile ? (
          // Mobile temporary drawer
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            ModalProps={{
              keepMounted: true,
            }}
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
          // Desktop permanent drawer
          <Drawer
            variant="permanent"
            open
            sx={{
              "& .MuiDrawer-paper": {
                width: currentDrawerWidth,
                boxSizing: "border-box",
                bgcolor: "#292524",
                border: "none",
                overflowX: "hidden",
                transition: "width 0.25s ease",
              },
            }}
          >
            {drawerContent}
          </Drawer>
        )}
      </Box>

      {/* Main page content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: {
            md: `calc(100% - ${currentDrawerWidth}px)`,
          },
          minWidth: 0,
          p: {
            xs: 2,
            sm: 3,
            md: 4,
          },
          mt: "64px",
          transition: "width 0.25s ease",
        }}
      >
        {renderPage()}
      </Box>
    </Box>
  );
}
