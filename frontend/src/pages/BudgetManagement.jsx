
import { useCallback, useEffect, useState } from "react";

import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  LinearProgress,
  IconButton,
  CircularProgress,
  Alert,
  Snackbar,
} from "@mui/material";

import Add from "@mui/icons-material/Add";
import Delete from "@mui/icons-material/Delete";
import EditOutlined from "@mui/icons-material/EditOutlined";

import {
  loadCurrencySettings,
  formatMoney,
} from "../services/currency";

const API_URL = "https://costthresholdalarm.duckdns.org/api/budgets/";

export default function BudgetManagement() {
  const [budgets, setBudgets] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [currencyInfo, setCurrencyInfo] = useState({
    currency: "USD",
    rate: 1,
    warning: "",
  });

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState("Monthly");

  const [notification, setNotification] = useState("");

  const loadBudgets = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(API_URL);

      if (!response.ok) {
        let message = "Unable to load budgets.";

        try {
          const errorData = await response.json();
          message = errorData.detail || message;
        } catch {
          // Keep the default message.
        }

        throw new Error(message);
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Unexpected budget data received from backend.");
      }

      setBudgets(data);
    } catch (err) {
      setBudgets([]);
      setError(err.message || "Backend connection failed.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    const initialize = async () => {
      const [currency, budgetResult] = await Promise.all([
        loadCurrencySettings(),
        loadBudgets(),
      ]);

      if (active) {
        setCurrencyInfo(currency);
      }
    };

    initialize();

    return () => {
      active = false;
    };
  }, [loadBudgets]);

  const resetForm = () => {
    setName("");
    setAmount("");
    setPeriod("Monthly");
    setEditingId(null);
    setOpen(false);
  };

  const saveBudget = async () => {
    if (
      !name.trim() ||
      amount.trim() === "" ||
      !Number.isFinite(Number(amount)) ||
      Number(amount) <= 0
    ) {
      setNotification("Enter a valid name and budget amount.");
      return;
    }

    const isEditing = editingId !== null;

    try {
      setSaving(true);

      // Budget amounts are stored in USD in the backend.
      // Currency conversion is only for display.
      const budgetData = {
        name: name.trim(),
        amount: Number(amount),
        period,
      };

      const url = isEditing
        ? `${API_URL}${editingId}`
        : API_URL;

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(budgetData),
      });

      if (!response.ok) {
        let message = "Unable to save budget.";

        try {
          const errorData = await response.json();
          message = errorData.detail || message;
        } catch {
          // Keep the default message.
        }

        throw new Error(message);
      }

      await loadBudgets();
      resetForm();

      setNotification(
        isEditing
          ? "Budget updated successfully."
          : "Budget created successfully."
      );
    } catch (err) {
      setNotification(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const editBudget = (budget) => {
    setEditingId(budget.id);
    setName(budget.name);
    setAmount(String(budget.amount));
    setPeriod(budget.period);
    setOpen(true);
  };

  const deleteBudget = async (id) => {
    try {
      const response = await fetch(`${API_URL}${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Unable to delete budget.");
      }

      await loadBudgets();
      setNotification("Budget deleted successfully.");
    } catch (err) {
      setNotification(err.message || "Delete failed.");
    }
  };

  const { currency, rate, warning } = currencyInfo;

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
            Budget Management
          </Typography>

          <Typography color="text.secondary">
            Create and manage your cloud spending limits.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpen(true)}
        >
          Create Budget
        </Button>
      </Box>

      {warning && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {warning}
        </Alert>
      )}

      <Alert severity="info" sx={{ mb: 2 }}>
        Budget amounts are stored in USD. Display values are converted to{" "}
        {currency} using the retrieved exchange rate.
      </Alert>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress sx={{ color: "#EC5E27" }} />
        </Box>
      ) : budgets.length === 0 ? (
        <Alert severity="info">
          No budgets found. Create your first budget.
        </Alert>
      ) : (
        <Grid container spacing={2.5}>
          {budgets.map((budget) => {
            const budgetAmount = Math.max(
              0,
              Number(budget.amount) || 0
            );

            const spent = Math.max(
              0,
              Number(budget.spent) || 0
            );

            const remaining = budgetAmount - spent;

            const percent =
              budgetAmount > 0
                ? (spent / budgetAmount) * 100
                : 0;

            const progress = Math.min(percent, 100);
            const isOverBudget = spent > budgetAmount;

            return (
              <Grid size={{ xs: 12, md: 6 }} key={budget.id}>
                <Card
                  sx={{
                    height: "100%",
                    border: "1px solid #EEECE5",
                    borderRadius: 3,
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 1,
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="h6" fontWeight={700}>
                          {budget.name}
                        </Typography>

                        <Chip
                          size="small"
                          label={budget.period}
                          sx={{ mt: 1 }}
                        />
                      </Box>

                      <Box sx={{ flexShrink: 0 }}>
                        <IconButton
                          onClick={() => editBudget(budget)}
                          aria-label="Edit budget"
                        >
                          <EditOutlined />
                        </IconButton>

                        <IconButton
                          color="error"
                          onClick={() => deleteBudget(budget.id)}
                          aria-label="Delete budget"
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </Box>

                    <Typography
                      variant="h4"
                      fontWeight={700}
                      sx={{ mt: 3, overflowWrap: "anywhere" }}
                    >
                      {formatMoney(budgetAmount, currency, rate)}
                    </Typography>

                    <Typography color="text.secondary" variant="body2">
                      Budget limit
                    </Typography>

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 1,
                        mt: 3,
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2">
                        Spent: {formatMoney(spent, currency, rate)}
                      </Typography>

                      <Typography
                        variant="body2"
                        fontWeight={600}
                        color={isOverBudget ? "error.main" : "text.primary"}
                      >
                        {percent.toFixed(1)}%
                      </Typography>
                    </Box>

                    <LinearProgress
                      variant="determinate"
                      value={progress}
                      color={isOverBudget ? "error" : "primary"}
                      sx={{ height: 9, borderRadius: 5 }}
                    />

                    <Typography
                      color={isOverBudget ? "error.main" : "text.secondary"}
                      variant="body2"
                      sx={{ mt: 1 }}
                    >
                      {isOverBudget ? "Over budget: " : "Remaining: "}
                      {formatMoney(
                        Math.abs(remaining),
                        currency,
                        rate
                      )}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      <Dialog
        open={open}
        onClose={saving ? undefined : resetForm}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {editingId !== null ? "Edit Budget" : "Create New Budget"}
        </DialogTitle>

        <DialogContent>
          <TextField
            fullWidth
            label="Budget Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            margin="normal"
          />

          <TextField
            fullWidth
            label="Budget Amount (USD)"
            type="number"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            margin="normal"
            slotProps={{
              htmlInput: {
                min: 0,
                step: "0.01",
              },
            }}
            helperText="Enter the budget limit in USD. It will be converted for display."
          />

          <TextField
            fullWidth
            select
            label="Budget Period"
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
            margin="normal"
          >
            {["Daily", "Weekly", "Monthly", "Yearly", "No Deadline"].map(
              (item) => (
                <MenuItem key={item} value={item}>
                  {item}
                </MenuItem>
              )
            )}
          </TextField>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={resetForm} disabled={saving}>
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={saveBudget}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Budget"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(notification)}
        autoHideDuration={3000}
        onClose={() => setNotification("")}
        message={notification}
      />
    </Box>
  );
}
