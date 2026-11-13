
import { useEffect, useMemo, useState } from "react";

import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  MenuItem,
  Chip,
  InputAdornment,
  Stack,
  LinearProgress,
  CircularProgress,
  Alert,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import CloudQueueIcon from "@mui/icons-material/CloudQueue";

const API_URL = "https://cost-threshold-alarm-backend.onrender.com/api/aws-services/";

const categories = [
  "All",
  "Compute",
  "Storage",
  "Database",
  "Monitoring",
  "Notifications",
];

export default function AWSServices() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const [services, setServices] = useState([]);
  const [total, setTotal] = useState(0);
  const [highestService, setHighestService] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(API_URL);

        if (!response.ok) {
          throw new Error("Unable to fetch AWS services.");
        }

        const data = await response.json();

        setServices(data.services || []);
        setTotal(Number(data.total_cost) || 0);
        setHighestService(data.highest_service || null);
      } catch (err) {
        setError(err.message || "Failed to connect to the backend.");
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const matchesSearch = service.name
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesCategory =
        category === "All" || service.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [services, search, category]);

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
          AWS Services
        </Typography>

        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          Monitor costs across your AWS cloud services.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
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
            <Typography color="text.secondary">
              Total Service Cost
            </Typography>

            <Typography
              variant="h4"
              fontWeight={800}
              color="primary"
              sx={{ mt: 1 }}
            >
              ${total.toFixed(2)}
            </Typography>

            <Chip
              label="Demo data"
              color="warning"
              size="small"
              sx={{ mt: 1 }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography color="text.secondary">
              Monitored Services
            </Typography>

            <Typography variant="h4" fontWeight={800} sx={{ mt: 1 }}>
              {services.length}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              AWS services in this demonstration
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography color="text.secondary">
              Highest Spending Service
            </Typography>

            <Typography variant="h5" fontWeight={800} sx={{ mt: 1 }}>
              {highestService?.name || "N/A"}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              {highestService
                ? `$${Number(highestService.cost).toFixed(2)} in sample spending`
                : "No service data available"}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
          >
            <TextField
              fullWidth
              size="small"
              placeholder="Search AWS services..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <TextField
              select
              size="small"
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              sx={{ minWidth: { sm: 190 } }}
            >
              {categories.map((item) => (
                <MenuItem key={item} value={item}>
                  {item}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </CardContent>
      </Card>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "repeat(2, minmax(0, 1fr))",
          },
          gap: 2.5,
        }}
      >
        {filteredServices.map((service) => (
          <Card
            key={service.name}
            sx={{
              border: "1px solid #EEECE5",
              borderRadius: 3,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 2,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                  }}
                >
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 2,
                      bgcolor: "#FFF0E8",
                      color: "#EC5E27",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CloudQueueIcon />
                  </Box>

                  <Box>
                    <Typography fontWeight={700}>
                      {service.name}
                    </Typography>

                    <Typography variant="caption" color="text.secondary">
                      {service.category}
                    </Typography>
                  </Box>
                </Box>

                <Chip
                  label={service.status}
                  color="success"
                  size="small"
                  variant="outlined"
                />
              </Box>

              <Typography
                variant="h4"
                fontWeight={800}
                sx={{ mt: 3 }}
              >
                ${Number(service.cost).toFixed(2)}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Estimated service cost
              </Typography>

              <Box sx={{ mt: 2.5 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Share of total spending
                  </Typography>

                  <Typography variant="body2" fontWeight={700}>
                    {service.percentage}%
                  </Typography>
                </Box>

                <LinearProgress
                  variant="determinate"
                  value={Math.min(Number(service.percentage) || 0, 100)}
                  sx={{
                    height: 8,
                    borderRadius: 5,
                    bgcolor: "#F1E7E1",
                    "& .MuiLinearProgress-bar": {
                      bgcolor: "#EC5E27",
                      borderRadius: 5,
                    },
                  }}
                />
              </Box>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 2 }}
              >
                Usage: {service.usage}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {filteredServices.length === 0 && (
        <Card sx={{ mt: 2 }}>
          <CardContent sx={{ textAlign: "center", py: 5 }}>
            <Typography fontWeight={600}>
              No services found
            </Typography>

            <Typography color="text.secondary" variant="body2">
              Try another search or category.
            </Typography>
          </CardContent>
        </Card>
      )}

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          display: "block",
          textAlign: "center",
          mt: 3,
        }}
      >
        Service costs are sample demonstration data, not live AWS billing.
      </Typography>
    </Box>
  );
}
