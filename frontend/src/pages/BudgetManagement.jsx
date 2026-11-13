
import { useEffect, useState } from "react";

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

const API_URL = "https://cost-threshold-alarm-backend.onrender.com/api/budgets/";

export default function BudgetManagement() {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState("Monthly");

  const [notification, setNotification] = useState("");

  const loadBudgets = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Unable to load budgets.");
      }

      const data = await response.json();
      setBudgets(data);
    } catch (err) {
      setError(err.message || "Backend connection failed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBudgets();
  }, []);

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
      !Number.isFinite(Number(amount)) ||
      Number(amount) <= 0
    ) {
      setNotification("Enter a valid name and budget amount.");
      return;
    }

    const isEditing = editingId !== null;

    try {
      setSaving(true);

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
        throw new Error("Unable to save budget.");
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

  return (
    <Box>
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
          <Typography variant="h5">
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

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            py: 6,
          }}
        >
          <CircularProgress />
        </Box>
      ) : budgets.length === 0 ? (
        <Alert severity="info">
          No budgets found. Create your first budget.
        </Alert>
      ) : (
        <Grid container spacing={2.5}>
          {budgets.map((b) => {
            const percent = Math.min(
              (b.spent / b.amount) * 100,
              100
            );

            return (
              <Grid size={{ xs: 12, md: 6 }} key={b.id}>
                <Card>
                  <CardContent sx={{ p: 3 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <Box>
                        <Typography variant="h6">
                          {b.name}
                        </Typography>

                        <Chip
                          size="small"
                          label={b.period}
                          sx={{ mt: 1 }}
                        />
                      </Box>

                      <Box>
                        <IconButton
                          onClick={() => editBudget(b)}
                          aria-label="Edit budget"
                        >
                          <EditOutlined />
                        </IconButton>

                        <IconButton
                          color="error"
                          onClick={() => deleteBudget(b.id)}
                          aria-label="Delete budget"
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </Box>

                    <Typography
                      variant="h4"
                      fontWeight={700}
                      sx={{ mt: 3 }}
                    >
                      ${Number(b.amount).toFixed(2)}
                    </Typography>

                    <Typography
                      color="text.secondary"
                      variant="body2"
                    >
                      Budget limit
                    </Typography>

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mt: 3,
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2">
                        Spent: ${Number(b.spent).toFixed(2)}
                      </Typography>

                      <Typography variant="body2">
                        {percent.toFixed(1)}%
                      </Typography>
                    </Box>

                    <LinearProgress
                      variant="determinate"
                      value={percent}
                      sx={{ height: 9, borderRadius: 5 }}
                    />

                    <Typography
                      color="text.secondary"
                      variant="body2"
                      sx={{ mt: 1 }}
                    >
                      Remaining: $
                      {(Number(b.amount) - Number(b.spent)).toFixed(2)}
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
        onClose={resetForm}
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
            onChange={(e) => setName(e.target.value)}
            margin="normal"
          />

          <TextField
            fullWidth
            label="Budget Amount ($)"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            margin="normal"
          />

          <TextField
            fullWidth
            select
            label="Budget Period"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            margin="normal"
          >
            {["Daily", "Weekly", "Monthly", "Yearly", "No Deadline"].map(
              (p) => (
                <MenuItem key={p} value={p}>
                  {p}
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
