
import { useEffect, useState } from "react";

import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  MenuItem,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Chip,
  Stack,
  Alert,
  CircularProgress,
} from "@mui/material";

import CloudRounded from "@mui/icons-material/CloudRounded";
import CurrencyExchangeRounded from "@mui/icons-material/CurrencyExchangeRounded";
import NotificationsActiveRounded from "@mui/icons-material/NotificationsActiveRounded";
import SecurityRounded from "@mui/icons-material/SecurityRounded";
import SaveRounded from "@mui/icons-material/SaveRounded";
import SettingsRounded from "@mui/icons-material/SettingsRounded";

const API_URL = "https://cost-threshold-alarm-backend.onrender.com/api/settings/";

export default function Settings() {
  const [currency, setCurrency] = useState("INR");
  const [region, setRegion] = useState("ap-south-1");
  const [monitoring, setMonitoring] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState("60");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(API_URL);

        if (!response.ok) {
          throw new Error("Unable to load application settings.");
        }

        const data = await response.json();

        setCurrency(data.currency);
        setRegion(data.region);
        setMonitoring(data.monitoring);
        setEmailAlerts(data.email_alerts);
        setRefreshInterval(String(data.refresh_interval));
      } catch (err) {
        setError(err.message || "Could not connect to the backend.");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaved(false);
      setError("");

      const response = await fetch(API_URL, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currency,
          region,
          monitoring,
          email_alerts: emailAlerts,
          refresh_interval: Number(refreshInterval),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to save settings.");
      }

      setCurrency(data.currency);
      setRegion(data.region);
      setMonitoring(data.monitoring);
      setEmailAlerts(data.email_alerts);
      setRefreshInterval(String(data.refresh_interval));

      setSaved(true);
    } catch (err) {
      setError(err.message || "Could not save settings.");
    } finally {
      setSaving(false);
    }
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
        <CircularProgress sx={{ color: "#EC5E27" }} />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h4"
          fontWeight={800}
          sx={{ mb: 1 }}
        >
          Settings
        </Typography>

        <Typography color="text.secondary">
          Manage your application preferences and cloud monitoring settings.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {saved && (
        <Alert
          severity="success"
          onClose={() => setSaved(false)}
          sx={{ mb: 3, borderRadius: 2 }}
        >
          Settings saved successfully in the backend.
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid size={12}>
          <Card sx={{ borderRadius: 3, border: "1px solid #eee" }}>
            <CardContent sx={{ p: 3 }}>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1.5}
                sx={{ mb: 2 }}
              >
                <CloudRounded sx={{ color: "#EC5E27", fontSize: 28 }} />

                <Box>
                  <Typography variant="h6" fontWeight={700}>
                    AWS Connection
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    Configure the AWS environment used for cost monitoring.
                  </Typography>
                </Box>
              </Stack>

              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    select
                    fullWidth
                    label="AWS Region"
                    value={region}
                    onChange={(event) => setRegion(event.target.value)}
                  >
                    <MenuItem value="ap-south-1">
                      Asia Pacific (Mumbai)
                    </MenuItem>

                    <MenuItem value="us-east-1">
                      US East (N. Virginia)
                    </MenuItem>

                    <MenuItem value="us-west-2">
                      US West (Oregon)
                    </MenuItem>

                    <MenuItem value="eu-west-1">
                      Europe (Ireland)
                    </MenuItem>
                  </TextField>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="AWS Account ID"
                    placeholder="Configured securely in backend"
                    disabled
                    helperText="Account credentials must never be stored in frontend code."
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 2 }}>
                <Chip
                  label="AWS connection not configured"
                  color="warning"
                  variant="outlined"
                  size="small"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card
            sx={{
              height: "100%",
              borderRadius: 3,
              border: "1px solid #eee",
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1.5}
                sx={{ mb: 2 }}
              >
                <CurrencyExchangeRounded
                  sx={{ color: "#EC5E27", fontSize: 28 }}
                />

                <Typography variant="h6" fontWeight={700}>
                  Currency Preferences
                </Typography>
              </Stack>

              <Divider sx={{ mb: 3 }} />

              <TextField
                select
                fullWidth
                label="Display Currency"
                value={currency}
                onChange={(event) => setCurrency(event.target.value)}
              >
                <MenuItem value="INR">Indian Rupee (₹)</MenuItem>
                <MenuItem value="USD">US Dollar ($)</MenuItem>
                <MenuItem value="EUR">Euro (€)</MenuItem>
                <MenuItem value="GBP">British Pound (£)</MenuItem>
              </TextField>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 2 }}
              >
                This preference controls the intended dashboard display
                currency. It does not change AWS billing currency.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card
            sx={{
              height: "100%",
              borderRadius: 3,
              border: "1px solid #eee",
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1.5}
                sx={{ mb: 2 }}
              >
                <NotificationsActiveRounded
                  sx={{ color: "#EC5E27", fontSize: 28 }}
                />

                <Typography variant="h6" fontWeight={700}>
                  Monitoring Preferences
                </Typography>
              </Stack>

              <Divider sx={{ mb: 2 }} />

              <FormControlLabel
                control={
                  <Switch
                    checked={monitoring}
                    onChange={(event) => setMonitoring(event.target.checked)}
                    color="warning"
                  />
                }
                label="Enable cost monitoring"
              />

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 2 }}
              >
                Enable or disable automated budget monitoring.
              </Typography>

              <Divider sx={{ mb: 2 }} />

              <FormControlLabel
                control={
                  <Switch
                    checked={emailAlerts}
                    onChange={(event) => setEmailAlerts(event.target.checked)}
                    color="warning"
                  />
                }
                label="Enable email notifications"
              />

              <Typography variant="body2" color="text.secondary">
                Allow email notifications when spending thresholds are reached.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={12}>
          <Card sx={{ borderRadius: 3, border: "1px solid #eee" }}>
            <CardContent sx={{ p: 3 }}>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1.5}
                sx={{ mb: 2 }}
              >
                <SettingsRounded sx={{ color: "#EC5E27", fontSize: 28 }} />

                <Typography variant="h6" fontWeight={700}>
                  Application Preferences
                </Typography>
              </Stack>

              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    select
                    fullWidth
                    label="Data Refresh Interval"
                    value={refreshInterval}
                    onChange={(event) =>
                      setRefreshInterval(event.target.value)
                    }
                  >
                    <MenuItem value="15">Every 15 minutes</MenuItem>
                    <MenuItem value="30">Every 30 minutes</MenuItem>
                    <MenuItem value="60">Every 1 hour</MenuItem>
                    <MenuItem value="360">Every 6 hours</MenuItem>
                    <MenuItem value="1440">Every 24 hours</MenuItem>
                  </TextField>
                </Grid>
              </Grid>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 2 }}
              >
                The selected refresh interval is saved as a preference.
                Automatic refresh scheduling is not yet implemented.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={12}>
          <Card sx={{ borderRadius: 3, border: "1px solid #eee" }}>
            <CardContent sx={{ p: 3 }}>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1.5}
                sx={{ mb: 2 }}
              >
                <SecurityRounded sx={{ color: "#EC5E27", fontSize: 28 }} />

                <Typography variant="h6" fontWeight={700}>
                  Security & Information
                </Typography>
              </Stack>

              <Divider sx={{ mb: 2 }} />

              <Typography fontWeight={600}>
                Cost Threshold Alarm
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 1 }}
              >
                Software-Based Cloud Cost Monitoring System
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 1 }}
              >
                Frontend: React, Vite and Material UI
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Planned cloud integration: AWS Cost Explorer, Lambda and SNS
              </Typography>

              <Chip
                label="Development Version"
                size="small"
                sx={{
                  mt: 2,
                  bgcolor: "#FFF0E9",
                  color: "#C84B1C",
                  fontWeight: 600,
                }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          mt: 3,
        }}
      >
        <Button
          variant="contained"
          startIcon={<SaveRounded />}
          onClick={handleSave}
          disabled={saving}
          sx={{
            bgcolor: "#EC5E27",
            px: 4,
            py: 1.2,
            borderRadius: 2,
            "&:hover": { bgcolor: "#D94F1C" },
          }}
        >
          {saving ? "Saving..." : "Save Preferences"}
        </Button>
      </Box>
    </Box>
  );
}
