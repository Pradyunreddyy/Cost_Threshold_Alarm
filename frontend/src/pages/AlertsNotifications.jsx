
import { useEffect, useState } from "react";

import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  Stack,
  LinearProgress,
  TextField,
  Alert,
  CircularProgress,
} from "@mui/material";

import NotificationsActiveRounded from "@mui/icons-material/NotificationsActiveRounded";
import WarningAmberRounded from "@mui/icons-material/WarningAmberRounded";
import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import EmailRounded from "@mui/icons-material/EmailRounded";
import SettingsRounded from "@mui/icons-material/SettingsRounded";

const API_URL = "https://costthresholdalarm.duckdns.org/api/alerts";

const initialAlerts = [
  {
    id: 1,
    title: "50% Budget Threshold",
    description: "Notify when spending reaches half of the configured budget.",
    threshold: 50,
    enabled: true,
  },
  {
    id: 2,
    title: "80% Budget Threshold",
    description: "Notify when spending reaches 80% of the configured budget.",
    threshold: 80,
    enabled: true,
  },
  {
    id: 3,
    title: "90% Budget Threshold",
    description: "Notify when spending approaches the budget limit.",
    threshold: 90,
    enabled: true,
  },
  {
    id: 4,
    title: "100% Budget Threshold",
    description: "Notify when the configured budget limit is reached.",
    threshold: 100,
    enabled: true,
  },
];

export default function AlertsNotifications() {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [inAppEnabled, setInAppEnabled] = useState(true);
  const [email, setEmail] = useState("");
  const [history, setHistory] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const [settingsResponse, historyResponse] = await Promise.all([
          fetch(`${API_URL}/settings`),
          fetch(`${API_URL}/history`),
        ]);

        if (!settingsResponse.ok || !historyResponse.ok) {
          throw new Error("Unable to load alert information.");
        }

        const settings = await settingsResponse.json();
        const historyData = await historyResponse.json();

        setAlerts((previous) =>
          previous.map((alert) => ({
            ...alert,
            enabled: settings.thresholds.includes(alert.threshold),
          }))
        );

        setEmailEnabled(settings.email_enabled);
        setEmail(settings.email || "");
        setInAppEnabled(settings.in_app_enabled);
        setHistory(historyData);
      } catch (err) {
        setError(err.message || "Backend connection failed.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleAlert = (id) => {
    setAlerts((previous) =>
      previous.map((alert) =>
        alert.id === id
          ? { ...alert, enabled: !alert.enabled }
          : alert
      )
    );

    setSaved(false);
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      setError("");
      setSaved(false);

      const enabledThresholds = alerts
        .filter((alert) => alert.enabled)
        .map((alert) => alert.threshold);

      if (enabledThresholds.length === 0) {
        throw new Error("Enable at least one budget threshold.");
      }

      if (
        emailEnabled &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ) {
        throw new Error("Enter a valid notification email address.");
      }

      const response = await fetch(`${API_URL}/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          thresholds: enabledThresholds,
          email_enabled: emailEnabled,
          email: email,
          in_app_enabled: inAppEnabled,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to save alert settings.");
      }

      setSaved(true);
    } catch (err) {
      setError(err.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const clearHistory = async () => {
    try {
      setClearing(true);
      setError("");

      const response = await fetch(`${API_URL}/history`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Unable to clear notification history.");
      }

      setHistory([]);
    } catch (err) {
      setError(err.message || "Failed to clear history.");
    } finally {
      setClearing(false);
    }
  };

  const getAlertColor = (threshold) => {
    if (threshold >= 100) return "error";
    if (threshold >= 80) return "warning";
    return "success";
  };

  const getHistoryIcon = (threshold) => {
    if (threshold >= 100) {
      return <WarningAmberRounded color="error" />;
    }

    if (threshold >= 80) {
      return <WarningAmberRounded color="warning" />;
    }

    return <CheckCircleRounded color="success" />;
  };

  const formatDate = (date) => {
    if (!date) return "Date unavailable";

    const parsedDate = new Date(
      date.includes("Z") ? date : date.replace(" ", "T") + "Z"
    );

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleString();
  };

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
          Alerts & Notifications
        </Typography>

        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          Configure spending alerts and monitor budget threshold events.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {saved && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Alert settings saved successfully to the backend.
        </Alert>
      )}

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
            <Stack
              direction="row"
              sx={{ justifyContent: "space-between" }}
            >
              <Box>
                <Typography color="text.secondary">
                  Active Thresholds
                </Typography>

                <Typography variant="h4" fontWeight={800} sx={{ mt: 1 }}>
                  {alerts.filter((a) => a.enabled).length}/4
                </Typography>
              </Box>

              <NotificationsActiveRounded
                sx={{ fontSize: 38, color: "#EC5E27" }}
              />
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Stack
              direction="row"
              sx={{ justifyContent: "space-between" }}
            >
              <Box>
                <Typography color="text.secondary">
                  Current Budget Usage
                </Typography>

                <Typography variant="h4" fontWeight={800} sx={{ mt: 1 }}>
                  68.4%
                </Typography>
              </Box>

              <WarningAmberRounded
                sx={{ fontSize: 38, color: "#F59E0B" }}
              />
            </Stack>

            <LinearProgress
              variant="determinate"
              value={68.4}
              sx={{
                mt: 2,
                height: 8,
                borderRadius: 5,
                "& .MuiLinearProgress-bar": {
                  bgcolor: "#EC5E27",
                },
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Stack
              direction="row"
              sx={{ justifyContent: "space-between" }}
            >
              <Box>
                <Typography color="text.secondary">
                  Notification Channel
                </Typography>

                <Typography variant="h6" fontWeight={700} sx={{ mt: 1 }}>
                  {emailEnabled ? "Email Enabled" : "Email Disabled"}
                </Typography>

                <Typography variant="caption" color="text.secondary">
                  Backend configuration
                </Typography>
              </Box>

              <EmailRounded sx={{ fontSize: 38, color: "#3B82F6" }} />
            </Stack>
          </CardContent>
        </Card>
      </Box>

      <Card sx={{ mb: 3, border: "1px solid #EEECE5", borderRadius: 3 }}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Typography variant="h6" fontWeight={700}>
            Budget Threshold Settings
          </Typography>

          <Typography color="text.secondary" variant="body2" sx={{ mb: 2.5 }}>
            Choose which spending levels should trigger an alert.
          </Typography>

          <Stack spacing={1}>
            {alerts.map((alert) => (
              <Box key={alert.id}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  sx={{
                    justifyContent: "space-between",
                    alignItems: { xs: "flex-start", sm: "center" },
                  }}
                  spacing={1}
                  py={1.5}
                >
                  <Box>
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={1}
                    >
                      <Typography fontWeight={600}>
                        {alert.title}
                      </Typography>

                      <Chip
                        label={`${alert.threshold}%`}
                        size="small"
                        color={getAlertColor(alert.threshold)}
                      />
                    </Stack>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 0.5 }}
                    >
                      {alert.description}
                    </Typography>
                  </Box>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={alert.enabled}
                        onChange={() => toggleAlert(alert.id)}
                        color="warning"
                      />
                    }
                    label={alert.enabled ? "Enabled" : "Disabled"}
                  />
                </Stack>

                {alert.id !== 4 && <Divider />}
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3, border: "1px solid #EEECE5", borderRadius: 3 }}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            <SettingsRounded color="action" />

            <Typography variant="h6" fontWeight={700}>
              Notification Channel Settings
            </Typography>
          </Stack>

          <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
            Configure how you want to receive budget notifications.
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={inAppEnabled}
                onChange={(e) => {
                  setInAppEnabled(e.target.checked);
                  setSaved(false);
                }}
                color="warning"
              />
            }
            label="Enable in-app notifications"
          />

          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={emailEnabled}
                  onChange={(e) => {
                    setEmailEnabled(e.target.checked);
                    setSaved(false);
                  }}
                  color="warning"
                />
              }
              label="Enable email notifications"
            />
          </Box>

          <TextField
            fullWidth
            size="small"
            label="Notification Email Address"
            placeholder="you@example.com"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setSaved(false);
            }}
            disabled={!emailEnabled}
            sx={{ mt: 2, maxWidth: 500 }}
          />

          <Box sx={{ mt: 2 }}>
            <Button
              variant="contained"
              onClick={saveSettings}
              disabled={
                saving ||
                alerts.every((alert) => !alert.enabled) ||
                (emailEnabled &&
                  !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
              }
            >
              {saving ? "Saving..." : "Save Notification Settings"}
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ border: "1px solid #EEECE5", borderRadius: 3 }}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Stack
            direction="row"
            sx={{
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
            }}
            gap={2}
            mb={2}
          >
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Notification History
              </Typography>

              <Typography color="text.secondary" variant="body2">
                Recent budget monitoring events.
              </Typography>
            </Box>

            <Button
              color="error"
              size="small"
              onClick={clearHistory}
              disabled={history.length === 0 || clearing}
            >
              {clearing ? "Clearing..." : "Clear History"}
            </Button>
          </Stack>

          {history.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <NotificationsActiveRounded
                sx={{ fontSize: 40, color: "text.disabled" }}
              />

              <Typography fontWeight={600} sx={{ mt: 1 }}>
                No notifications
              </Typography>

              <Typography color="text.secondary" variant="body2">
                Your notification history is empty.
              </Typography>
            </Box>
          ) : (
            <Stack spacing={2}>
              {history.map((item, index) => (
                <Box key={item.id}>
                  <Stack
                    direction="row"
                    spacing={2}
                    alignItems="flex-start"
                  >
                    {getHistoryIcon(item.threshold)}

                    <Box sx={{ flex: 1 }}>
                      <Typography fontWeight={600}>
                        {item.message}
                      </Typography>

                      <Typography color="text.secondary" variant="caption">
                        Threshold: {item.threshold}%
                      </Typography>

                      <Typography
                        color="text.secondary"
                        variant="caption"
                        display="block"
                      >
                        {formatDate(item.created_at)}
                      </Typography>
                    </Box>
                  </Stack>

                  {index !== history.length - 1 && (
                    <Divider sx={{ mt: 2 }} />
                  )}
                </Box>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>

      <Typography
        variant="caption"
        color="text.secondary"
        display="block"
        textAlign="center"
        sx={{ mt: 3 }}
      >
        Alert preferences are stored in the backend. Actual threshold
        monitoring and Amazon SNS email delivery will be connected later.
      </Typography>
    </Box>
  );
}
