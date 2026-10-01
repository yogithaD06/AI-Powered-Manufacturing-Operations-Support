import { useEffect, useMemo, useState } from "react";
import axios from "axios";

import {
  AccessTime,
  Assessment,
  Factory,
  Refresh,
  TrendingDown,
  WarningAmber,
} from "@mui/icons-material";

import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  IconButton,
  Typography,
} from "@mui/material";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const API = "/api";

interface DowntimeRecord {
  downtime_id: number;
  incident_id: number | null;
  machine_id: number | null;
  line_id: number | null;
  downtime_reason: string;
  downtime_category: string;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  production_units_affected: number | null;
  production_loss: number | null;
  impact_description: string | null;
  created_at?: string;
}

export default function DowntimeTracking() {
  const [records, setRecords] = useState<DowntimeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDowntimeRecords = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        `${API}/downtime-records/?skip=0&limit=100`
      );

      setRecords(response.data);
    } catch (error) {
      console.error("Failed to fetch downtime tracking data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDowntimeRecords();
  }, []);

  /* =========================
     KPI CALCULATIONS
  ========================= */

  const totalDowntime = useMemo(
    () =>
      records.reduce(
        (sum, record) => sum + (record.duration_minutes || 0),
        0
      ),
    [records]
  );

  const totalUnitsAffected = useMemo(
    () =>
      records.reduce(
        (sum, record) => sum + (record.production_units_affected || 0),
        0
      ),
    [records]
  );

  const totalProductionLoss = useMemo(
    () =>
      records.reduce(
        (sum, record) => sum + (record.production_loss || 0),
        0
      ),
    [records]
  );

  const averageDowntime =
    records.length > 0 ? totalDowntime / records.length : 0;

  /* =========================
     DOWNTIME TREND
  ========================= */

  const downtimeTrend = useMemo(() => {
    const grouped: Record<string, number> = {};

    records.forEach((record) => {
      const date = record.start_time
        ? new Date(record.start_time).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
          })
        : "Unknown";

      grouped[date] = (grouped[date] || 0) + (record.duration_minutes || 0);
    });

    return Object.entries(grouped).map(([date, downtime]) => ({
      date,
      downtime,
    }));
  }, [records]);

  /* =========================
     DOWNTIME BY MACHINE
  ========================= */

  const downtimeByMachine = useMemo(() => {
    const grouped: Record<number, number> = {};

    records.forEach((record) => {
      const machineId = record.machine_id ?? 0;

      grouped[machineId] =
        (grouped[machineId] || 0) + (record.duration_minutes || 0);
    });

    return Object.entries(grouped).map(([machine, downtime]) => ({
      machine: machine === "0" ? "Unknown" : `Machine ${machine}`,
      downtime,
    }));
  }, [records]);

  /* =========================
     DOWNTIME BY CATEGORY
  ========================= */

  const downtimeByCategory = useMemo(() => {
    const grouped: Record<string, number> = {};

    records.forEach((record) => {
      const category = record.downtime_category || "Unknown";

      grouped[category] =
        (grouped[category] || 0) + (record.duration_minutes || 0);
    });

    return Object.entries(grouped).map(([category, downtime]) => ({
      category,
      downtime,
    }));
  }, [records]);

  /* =========================
     PRODUCTION LOSS BY MACHINE
  ========================= */

  const productionLossByMachine = useMemo(() => {
    const grouped: Record<number, number> = {};

    records.forEach((record) => {
      const machineId = record.machine_id ?? 0;

      grouped[machineId] =
        (grouped[machineId] || 0) + (record.production_loss || 0);
    });

    return Object.entries(grouped).map(([machine, loss]) => ({
      machine: machine === "0" ? "Unknown" : `Machine ${machine}`,
      loss,
    }));
  }, [records]);

  /* =========================
     RECENT RECORDS
  ========================= */

  const recentRecords = useMemo(() => {
    return [...records]
      .sort(
        (a, b) =>
          new Date(b.start_time).getTime() -
          new Date(a.start_time).getTime()
      )
      .slice(0, 5);
  }, [records]);

  /* =========================
     INSIGHTS
  ========================= */

  const highestDowntimeMachine = useMemo(() => {
    if (downtimeByMachine.length === 0) return null;

    return downtimeByMachine.reduce((max, current) =>
      current.downtime > max.downtime ? current : max
    );
  }, [downtimeByMachine]);

  const highestDowntimeCategory = useMemo(() => {
    if (downtimeByCategory.length === 0) return null;

    return downtimeByCategory.reduce((max, current) =>
      current.downtime > max.downtime ? current : max
    );
  }, [downtimeByCategory]);

  const PIE_COLORS = [
    "#3b82f6",
    "#8b5cf6",
    "#f59e0b",
    "#ef4444",
    "#10b981",
    "#64748b",
  ];

  return (
    <Box>
      {/* HEADER */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              letterSpacing: "-0.5px",
            }}
          >
            Downtime Tracking
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mt: 0.5 }}
          >
            Visual analysis of machine downtime, production impact and losses
          </Typography>
        </Box>

        <IconButton
          onClick={fetchDowntimeRecords}
          disabled={loading}
          sx={{
            border: "1px solid #e0e5ec",
            borderRadius: 2,
          }}
        >
          <Refresh />
        </IconButton>
      </Box>

      {/* KPI CARDS */}

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography color="text.secondary">
                  Total Downtime
                </Typography>

                <AccessTime color="primary" />
              </Box>

              <Typography
                variant="h4"
                sx={{ mt: 1, fontWeight: 700 }}
              >
                {totalDowntime} min
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Across all downtime events
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography color="text.secondary">
                  Downtime Events
                </Typography>

                <WarningAmber color="warning" />
              </Box>

              <Typography
                variant="h4"
                sx={{ mt: 1, fontWeight: 700 }}
              >
                {records.length}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Recorded events
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography color="text.secondary">
                  Units Affected
                </Typography>

                <Factory color="success" />
              </Box>

              <Typography
                variant="h4"
                sx={{ mt: 1, fontWeight: 700 }}
              >
                {totalUnitsAffected}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Production units
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography color="text.secondary">
                  Production Loss
                </Typography>

                <TrendingDown color="error" />
              </Box>

              <Typography
                variant="h4"
                sx={{ mt: 1, fontWeight: 700 }}
              >
                ₹{totalProductionLoss.toLocaleString("en-IN")}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Recorded production loss
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* AVERAGE DOWNTIME */}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Assessment color="primary" />

            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Average Downtime
            </Typography>
          </Box>

          <Typography
            variant="h4"
            sx={{ mt: 1, fontWeight: 700 }}
          >
            {averageDowntime.toFixed(1)} min
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Average duration per downtime event
          </Typography>
        </CardContent>
      </Card>

      {/* DOWNTIME TREND */}

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Downtime Trend
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 2 }}
              >
                Downtime duration recorded over time
              </Typography>

              <Box sx={{ width: "100%", height: 330 }}>
                <ResponsiveContainer>
                  <LineChart data={downtimeTrend}>
                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis dataKey="date" />

                    <YAxis
                      label={{
                        value: "Minutes",
                        angle: -90,
                        position: "insideLeft",
                      }}
                    />

                    <Tooltip />

                    <Legend />

                    <Line
                      type="monotone"
                      dataKey="downtime"
                      name="Downtime"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* MACHINE + CATEGORY */}

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Downtime by Machine
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 2 }}
              >
                Total downtime associated with each machine
              </Typography>

              <Box sx={{ width: "100%", height: 330 }}>
                <ResponsiveContainer>
                  <BarChart data={downtimeByMachine}>
                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis dataKey="machine" />

                    <YAxis
                      label={{
                        value: "Minutes",
                        angle: -90,
                        position: "insideLeft",
                      }}
                    />

                    <Tooltip />

                    <Bar
                      dataKey="downtime"
                      name="Downtime"
                      fill="#6366f1"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Downtime by Category
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 2 }}
              >
                Distribution of downtime across categories
              </Typography>

              <Box sx={{ width: "100%", height: 330 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={downtimeByCategory}
                      dataKey="downtime"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={105}
                      label
                    >
                      {downtimeByCategory.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>

                    <Tooltip />

                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* PRODUCTION LOSS */}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Production Loss by Machine
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 2 }}
          >
            Recorded production loss associated with each machine
          </Typography>

          <Box sx={{ width: "100%", height: 330 }}>
            <ResponsiveContainer>
              <BarChart data={productionLossByMachine}>
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="machine" />

                <YAxis
                  label={{
                    value: "Production Loss",
                    angle: -90,
                    position: "insideLeft",
                  }}
                />

                <Tooltip
                  formatter={(value) =>
                    `₹${Number(value).toLocaleString("en-IN")}`
                  }
                />

                <Legend />

                <Bar
                  dataKey="loss"
                  name="Production Loss"
                  fill="#ef4444"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>

      {/* KEY INSIGHTS */}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            Downtime Insights
          </Typography>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e5e7eb",
                }}
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Highest Downtime Machine
                </Typography>

                <Typography
                  variant="h6"
                  sx={{ mt: 0.5, fontWeight: 700 }}
                >
                  {highestDowntimeMachine
                    ? highestDowntimeMachine.machine
                    : "No data"}
                </Typography>

                {highestDowntimeMachine && (
                  <Chip
                    size="small"
                    label={`${highestDowntimeMachine.downtime} min`}
                    sx={{ mt: 1 }}
                  />
                )}
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e5e7eb",
                }}
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Highest Downtime Category
                </Typography>

                <Typography
                  variant="h6"
                  sx={{ mt: 0.5, fontWeight: 700 }}
                >
                  {highestDowntimeCategory
                    ? highestDowntimeCategory.category
                    : "No data"}
                </Typography>

                {highestDowntimeCategory && (
                  <Chip
                    size="small"
                    label={`${highestDowntimeCategory.downtime} min`}
                    sx={{ mt: 1 }}
                  />
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* RECENT EVENTS */}

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            Recent Downtime Events
          </Typography>

          {recentRecords.length === 0 ? (
            <Typography color="text.secondary">
              {loading
                ? "Loading downtime records..."
                : "No downtime records available."}
            </Typography>
          ) : (
            <Box sx={{ overflowX: "auto" }}>
              <Box
                component="table"
                sx={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: 800,
                }}
              >
                <Box component="thead">
                  <Box component="tr">
                    {[
                      "ID",
                      "Machine",
                      "Category",
                      "Reason",
                      "Duration",
                      "Production Loss",
                      "Start Time",
                    ].map((heading) => (
                      <Box
                        component="th"
                        key={heading}
                        sx={{
                          textAlign: "left",
                          p: 1.5,
                          borderBottom: "1px solid #e5e7eb",
                          color: "#667085",
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                      >
                        {heading}
                      </Box>
                    ))}
                  </Box>
                </Box>

                <Box component="tbody">
                  {recentRecords.map((record) => (
                    <Box
                      component="tr"
                      key={record.downtime_id}
                    >
                      <Box
                        component="td"
                        sx={{
                          p: 1.5,
                          borderBottom: "1px solid #f0f2f5",
                        }}
                      >
                        #{record.downtime_id}
                      </Box>

                      <Box
                        component="td"
                        sx={{
                          p: 1.5,
                          borderBottom: "1px solid #f0f2f5",
                        }}
                      >
                        Machine {record.machine_id ?? "-"}
                      </Box>

                      <Box
                        component="td"
                        sx={{
                          p: 1.5,
                          borderBottom: "1px solid #f0f2f5",
                        }}
                      >
                        <Chip
                          size="small"
                          label={record.downtime_category}
                        />
                      </Box>

                      <Box
                        component="td"
                        sx={{
                          p: 1.5,
                          borderBottom: "1px solid #f0f2f5",
                          fontWeight: 600,
                        }}
                      >
                        {record.downtime_reason}
                      </Box>

                      <Box
                        component="td"
                        sx={{
                          p: 1.5,
                          borderBottom: "1px solid #f0f2f5",
                        }}
                      >
                        {record.duration_minutes ?? 0} min
                      </Box>

                      <Box
                        component="td"
                        sx={{
                          p: 1.5,
                          borderBottom: "1px solid #f0f2f5",
                        }}
                      >
                        ₹
                        {(record.production_loss || 0).toLocaleString(
                          "en-IN"
                        )}
                      </Box>

                      <Box
                        component="td"
                        sx={{
                          p: 1.5,
                          borderBottom: "1px solid #f0f2f5",
                        }}
                      >
                        {record.start_time
                          ? new Date(
                              record.start_time
                            ).toLocaleString("en-IN")
                          : "-"}
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}