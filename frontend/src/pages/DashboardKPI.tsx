import { useEffect, useMemo, useState } from "react";
import axios from "axios";

import {
  AccessTime,
  AutoAwesome,
  CheckCircle,
  ConfirmationNumber,
  ErrorOutlined,
  Factory,
  Groups,
  Insights,
  Psychology,
  Refresh,
  Speed,
  TrendingDown,
  TrendingUp,
  Warning,
} from "@mui/icons-material";

import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  IconButton,
  LinearProgress,
  Typography,
} from "@mui/material";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const API = "/api";

interface Incident {
  incident_id: number;
  incident_title?: string;
  incident_description?: string;
  issue_category_id?: number | null;
  machine_id?: number | null;
  reported_by?: number | null;
  priority?: string;
  status?: string;
  occurrence_time?: string;
  reported_time?: string | null;
  production_impact?: string | null;
  safety_impact?: string | null;
  created_at?: string;
}

interface DowntimeRecord {
  downtime_id: number;
  incident_id?: number | null;
  machine_id?: number | null;
  line_id?: number | null;
  downtime_reason?: string;
  downtime_category?: string;
  start_time?: string;
  end_time?: string | null;
  duration_minutes?: number | null;
  production_units_affected?: number | null;
  production_loss?: number | null;
}

interface Ticket {
  ticket_id: number;
  incident_id?: number;
  priority?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

interface Resolution {
  resolution_id: number;
  incident_id?: number | null;
  ticket_id?: number | null;
  resolved_at?: string | null;
  verification_status?: string | null;
  closure_status?: string | null;
}

interface MLPrediction {
  prediction_id: number;
  incident_id?: number | null;
  predicted_priority?: string | null;
  priority_confidence?: number | null;
  root_cause_confidence?: number | null;
  probable_root_cause?: string | null;
  recommended_team?: string | null;
  recurring_pattern?: string | null;
  downtime_forecast?: number | null;
}

const COLORS = {
  blue: "#2563eb",
  cyan: "#06b6d4",
  green: "#16a34a",
  emerald: "#10b981",
  orange: "#f97316",
  amber: "#f59e0b",
  red: "#ef4444",
  rose: "#e11d48",
  purple: "#7c3aed",
  violet: "#8b5cf6",
  pink: "#ec4899",
  slate: "#64748b",
};

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: "#dc2626",
  HIGH: "#ef4444",
  MEDIUM: "#f59e0b",
  LOW: "#22c55e",
  UNKNOWN: "#94a3b8",
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: "#ef4444",
  IN_PROGRESS: "#f59e0b",
  COMPLETED: "#22c55e",
  CLOSED: "#16a34a",
  HOLD: "#8b5cf6",
  UNKNOWN: "#94a3b8",
};

function formatNumber(value: number) {
  return value.toLocaleString("en-IN");
}

function formatDate(date?: string | null) {
  if (!date) return "-";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  gradient,
  progress,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  gradient: string;
  progress?: number;
}) {
  return (
    <Card
      sx={{
        height: "100%",
        overflow: "hidden",
        position: "relative",
        border: "none !important",
      }}
    >
      <Box
        sx={{
          height: 5,
          background: gradient,
        }}
      />

      <CardContent sx={{ p: 2.5 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Box>
            <Typography
              variant="body2"
              sx={{
                color: "#667085",
                fontWeight: 600,
              }}
            >
              {title}
            </Typography>

            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                mt: 0.8,
                color: "#101828",
              }}
            >
              {value}
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: "#98a2b3",
                mt: 0.5,
              }}
            >
              {subtitle}
            </Typography>
          </Box>

          <Box
            sx={{
              width: 46,
              height: 46,
              borderRadius: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: gradient,
              color: "#fff",
              boxShadow: "0 8px 18px rgba(0,0,0,0.12)",
            }}
          >
            {icon}
          </Box>
        </Box>

        {progress !== undefined && (
          <LinearProgress
            variant="determinate"
            value={Math.min(Math.max(progress, 0), 100)}
            sx={{
              mt: 2,
              height: 6,
              borderRadius: 10,
              backgroundColor: "#eef2f6",
              "& .MuiLinearProgress-bar": {
                borderRadius: 10,
                background: gradient,
              },
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardKPI() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [downtime, setDowntime] = useState<DowntimeRecord[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [resolutions, setResolutions] = useState<Resolution[]>([]);
  const [predictions, setPredictions] = useState<MLPrediction[]>([]);

  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [
        incidentResponse,
        downtimeResponse,
        ticketResponse,
        resolutionResponse,
        predictionResponse,
      ] = await Promise.all([
        axios.get(`${API}/incidents/?skip=0&limit=100`),
        axios.get(`${API}/downtime-records/?skip=0&limit=100`),
        axios.get(`${API}/tickets/?skip=0&limit=100`),
        axios.get(`${API}/resolution-records/?skip=0&limit=100`),
        axios.get(`${API}/ml-predictions/?skip=0&limit=100`),
      ]);

      setIncidents(incidentResponse.data);
      setDowntime(downtimeResponse.data);
      setTickets(ticketResponse.data);
      setResolutions(resolutionResponse.data);
      setPredictions(predictionResponse.data);
    } catch (error) {
      console.error("Dashboard data loading error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  /* =====================================================
     CORE KPIs
  ===================================================== */

  const totalIncidents = incidents.length;

  const activeIncidents = incidents.filter(
    (incident) =>
      incident.status === "OPEN" ||
      incident.status === "IN_PROGRESS"
  ).length;

  const criticalIncidents = incidents.filter(
    (incident) =>
      incident.priority === "CRITICAL"
  ).length;

  const resolvedIncidents = incidents.filter(
    (incident) =>
      incident.status === "COMPLETED" ||
      incident.status === "CLOSED" ||
      incident.status === "RESOLVED"
  ).length;

  const totalDowntime = downtime.reduce(
    (sum, item) =>
      sum + (item.duration_minutes || 0),
    0
  );

  const productionLoss = downtime.reduce(
    (sum, item) =>
      sum + (item.production_loss || 0),
    0
  );

  const unitsAffected = downtime.reduce(
    (sum, item) =>
      sum + (item.production_units_affected || 0),
    0
  );

  const resolutionRate =
    totalIncidents > 0
      ? (resolvedIncidents / totalIncidents) * 100
      : 0;

  const highPriorityIncidents =
    incidents.filter(
      (incident) =>
        incident.priority === "HIGH" ||
        incident.priority === "CRITICAL"
    ).length;

  /* =====================================================
     RESPONSE TIME
  ===================================================== */

  const responseTimes = incidents
    .filter(
      (incident) =>
        incident.occurrence_time &&
        incident.reported_time
    )
    .map((incident) => {
      const occurrence = new Date(
        incident.occurrence_time as string
      ).getTime();

      const reported = new Date(
        incident.reported_time as string
      ).getTime();

      return Math.max(
        0,
        (reported - occurrence) / 60000
      );
    });

  const averageResponseTime =
    responseTimes.length > 0
      ? responseTimes.reduce(
          (sum, value) => sum + value,
          0
        ) / responseTimes.length
      : 0;

  /* =====================================================
     RESOLUTION TIME
  ===================================================== */

  const incidentMap = new Map(
    incidents.map((incident) => [
      incident.incident_id,
      incident,
    ])
  );

  const resolutionTimes = resolutions
    .filter(
      (resolution) =>
        resolution.incident_id &&
        resolution.resolved_at &&
        incidentMap.has(resolution.incident_id)
    )
    .map((resolution) => {
      const incident = incidentMap.get(
        resolution.incident_id as number
      );

      if (!incident?.occurrence_time) {
        return 0;
      }

      const start = new Date(
        incident.occurrence_time
      ).getTime();

      const end = new Date(
        resolution.resolved_at as string
      ).getTime();

      return Math.max(
        0,
        (end - start) / 60000
      );
    })
    .filter((value) => value > 0);

  const averageResolutionTime =
    resolutionTimes.length > 0
      ? resolutionTimes.reduce(
          (sum, value) => sum + value,
          0
        ) / resolutionTimes.length
      : 0;

  /* =====================================================
     INCIDENT STATUS
  ===================================================== */

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};

    incidents.forEach((incident) => {
      const status =
        incident.status || "UNKNOWN";

      counts[status] =
        (counts[status] || 0) + 1;
    });

    return Object.entries(counts).map(
      ([name, value]) => ({
        name,
        value,
      })
    );
  }, [incidents]);

  /* =====================================================
     PRIORITY
  ===================================================== */

  const priorityData = useMemo(() => {
    const counts: Record<string, number> = {};

    incidents.forEach((incident) => {
      const priority =
        incident.priority || "UNKNOWN";

      counts[priority] =
        (counts[priority] || 0) + 1;
    });

    return Object.entries(counts).map(
      ([name, value]) => ({
        name,
        value,
      })
    );
  }, [incidents]);

  /* =====================================================
     INCIDENT TREND
  ===================================================== */

  const incidentTrend = useMemo(() => {
    const counts: Record<string, number> = {};

    incidents.forEach((incident) => {
      const date =
        incident.occurrence_time ||
        incident.created_at;

      if (!date) return;

      const key = formatDate(date);

      counts[key] =
        (counts[key] || 0) + 1;
    });

    return Object.entries(counts).map(
      ([date, count]) => ({
        date,
        incidents: count,
      })
    );
  }, [incidents]);

  /* =====================================================
     DOWNTIME TREND
  ===================================================== */

  const downtimeTrend = useMemo(() => {
    const grouped: Record<string, number> = {};

    downtime.forEach((item) => {
      if (!item.start_time) return;

      const key = formatDate(item.start_time);

      grouped[key] =
        (grouped[key] || 0) +
        (item.duration_minutes || 0);
    });

    return Object.entries(grouped).map(
      ([date, minutes]) => ({
        date,
        downtime: minutes,
      })
    );
  }, [downtime]);

  /* =====================================================
     MACHINE PERFORMANCE
  ===================================================== */

  const machinePerformance = useMemo(() => {
    const grouped: Record<string, number> = {};

    downtime.forEach((item) => {
      const machine =
        item.machine_id
          ? `Machine ${item.machine_id}`
          : "Unknown";

      grouped[machine] =
        (grouped[machine] || 0) +
        (item.duration_minutes || 0);
    });

    return Object.entries(grouped)
      .map(([machine, minutes]) => ({
        machine,
        minutes,
      }))
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 8);
  }, [downtime]);

  /* =====================================================
     CATEGORY PERFORMANCE
  ===================================================== */

  const categoryPerformance = useMemo(() => {
    const grouped: Record<string, number> = {};

    incidents.forEach((incident) => {
      const category =
        incident.issue_category_id
          ? `Category ${incident.issue_category_id}`
          : "Uncategorized";

      grouped[category] =
        (grouped[category] || 0) + 1;
    });

    return Object.entries(grouped)
      .map(([category, count]) => ({
        category,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [incidents]);

  /* =====================================================
     AI INTELLIGENCE
  ===================================================== */

  const averagePriorityConfidence =
    predictions.length > 0
      ? predictions.reduce(
          (sum, prediction) =>
            sum +
            (prediction.priority_confidence || 0),
          0
        ) / predictions.length
      : 0;

  const averageRootCauseConfidence =
    predictions.length > 0
      ? predictions.reduce(
          (sum, prediction) =>
            sum +
            (prediction.root_cause_confidence || 0),
          0
        ) / predictions.length
      : 0;

  const aiHighRisk = predictions.filter(
    (prediction) =>
      prediction.predicted_priority ===
        "HIGH" ||
      prediction.predicted_priority ===
        "CRITICAL"
  ).length;

  const recurringSignals =
    predictions.filter(
      (prediction) =>
        prediction.recurring_pattern &&
        prediction.recurring_pattern.trim()
          .length > 0
    ).length;

  const recommendedTeams = useMemo(() => {
    const counts: Record<string, number> = {};

    predictions.forEach((prediction) => {
      const team =
        prediction.recommended_team ||
        "Unassigned";

      counts[team] =
        (counts[team] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([team, count]) => ({
        team,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [predictions]);

  /* =====================================================
     UI
  ===================================================== */

  return (
    <Box>
      {/* =================================================
          HERO
      ================================================= */}

      <Card
        sx={{
          mb: 3,
          overflow: "hidden",
          border: "none !important",
          background:
            "linear-gradient(135deg, #0f172a 0%, #172554 45%, #312e81 100%) !important",
          color: "#fff",
          position: "relative",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            width: 280,
            height: 280,
            borderRadius: "50%",
            right: -80,
            top: -120,
            background:
              "rgba(56,189,248,0.12)",
          }}
        />

        <Box
          sx={{
            position: "absolute",
            width: 220,
            height: 220,
            borderRadius: "50%",
            right: 160,
            bottom: -160,
            background:
              "rgba(139,92,246,0.15)",
          }}
        />

        <CardContent
          sx={{
            position: "relative",
            p: { xs: 2.5, md: 3.5 },
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 1,
                }}
              >
                <Insights />

                <Typography
                  variant="body2"
                  sx={{
                    color:
                      "rgba(255,255,255,0.7)",
                    fontWeight: 700,
                    letterSpacing: 1.2,
                  }}
                >
                  MANUFACTURING INTELLIGENCE
                </Typography>
              </Box>

              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  letterSpacing: -0.6,
                }}
              >
                Operations Command Center
              </Typography>

              <Typography
                sx={{
                  mt: 0.8,
                  color:
                    "rgba(255,255,255,0.7)",
                }}
              >
                Real-time operational performance,
                downtime intelligence and AI-driven
                incident insights.
              </Typography>
            </Box>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
              }}
            >
              <Chip
                icon={<CheckCircle />}
                label={
                  loading
                    ? "Syncing..."
                    : "System Connected"
                }
                sx={{
                  color: "#fff",
                  background:
                    "rgba(16,185,129,0.18)",
                  border:
                    "1px solid rgba(16,185,129,0.3)",
                }}
              />

              <IconButton
                onClick={fetchDashboardData}
                sx={{
                  color: "#fff",
                  background:
                    "rgba(255,255,255,0.1)",
                  "&:hover": {
                    background:
                      "rgba(255,255,255,0.18)",
                  },
                }}
              >
                <Refresh />
              </IconButton>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* =================================================
          PRIMARY KPI ROW
      ================================================= */}

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Incidents"
            value={formatNumber(totalIncidents)}
            subtitle="All recorded incidents"
            icon={<ConfirmationNumber />}
            gradient="linear-gradient(135deg,#2563eb,#06b6d4)"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Active Incidents"
            value={formatNumber(activeIncidents)}
            subtitle="Currently requiring attention"
            icon={<Warning />}
            gradient="linear-gradient(135deg,#f97316,#f59e0b)"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Critical Incidents"
            value={formatNumber(criticalIncidents)}
            subtitle="Critical severity cases"
            icon={<ErrorOutlined />}
            gradient="linear-gradient(135deg,#dc2626,#e11d48)"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Resolved Incidents"
            value={formatNumber(resolvedIncidents)}
            subtitle={`${resolutionRate.toFixed(
              1
            )}% resolution rate`}
            icon={<CheckCircle />}
            gradient="linear-gradient(135deg,#059669,#22c55e)"
            progress={resolutionRate}
          />
        </Grid>
      </Grid>

      {/* =================================================
          SECONDARY KPI ROW
      ================================================= */}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Downtime"
            value={`${formatNumber(
              totalDowntime
            )} min`}
            subtitle="Recorded downtime duration"
            icon={<AccessTime />}
            gradient="linear-gradient(135deg,#7c3aed,#8b5cf6)"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Production Loss"
            value={`₹${formatNumber(
              productionLoss
            )}`}
            subtitle="Recorded production impact"
            icon={<TrendingDown />}
            gradient="linear-gradient(135deg,#db2777,#ec4899)"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Units Affected"
            value={formatNumber(unitsAffected)}
            subtitle="Production units impacted"
            icon={<Factory />}
            gradient="linear-gradient(135deg,#0891b2,#06b6d4)"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="High / Critical"
            value={formatNumber(highPriorityIncidents)}
            subtitle="Priority requiring attention"
            icon={<Speed />}
            gradient="linear-gradient(135deg,#ea580c,#f97316)"
          />
        </Grid>
      </Grid>

      {/* =================================================
          INCIDENT TRENDS + STATUS
      ================================================= */}

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ height: 420 }}>
            <CardContent sx={{ height: "100%" }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 2,
                }}
              >
                <Box>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 800 }}
                  >
                    Incident Trend
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Incident occurrence over the
                    recorded timeline
                  </Typography>
                </Box>

                <Chip
                  icon={<TrendingUp />}
                  label="Live data"
                  size="small"
                  sx={{
                    background:
                      "rgba(37,99,235,0.08)",
                    color: COLORS.blue,
                  }}
                />
              </Box>

              <ResponsiveContainer
                width="100%"
                height="80%"
              >
                <AreaChart data={incidentTrend}>
                  <defs>
                    <linearGradient
                      id="incidentGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#2563eb"
                        stopOpacity={0.35}
                      />
                      <stop
                        offset="95%"
                        stopColor="#2563eb"
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis dataKey="date" />

                  <YAxis allowDecimals={false} />

                  <Tooltip />

                  <Area
                    type="monotone"
                    dataKey="incidents"
                    stroke="#2563eb"
                    strokeWidth={3}
                    fill="url(#incidentGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: 420 }}>
            <CardContent sx={{ height: "100%" }}>
              <Typography
                variant="h6"
                sx={{ fontWeight: 800 }}
              >
                Incident Status
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 1 }}
              >
                Current operational state
              </Typography>

              <ResponsiveContainer
                width="100%"
                height="82%"
              >
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={4}
                  >
                    {statusData.map(
                      (entry) => (
                        <Cell
                          key={entry.name}
                          fill={
                            STATUS_COLORS[
                              entry.name
                            ] ||
                            COLORS.slate
                          }
                        />
                      )
                    )}
                  </Pie>

                  <Tooltip />

                  <Legend
                    verticalAlign="bottom"
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* =================================================
          DOWNTIME + PRIORITY
      ================================================= */}

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ height: 420 }}>
            <CardContent sx={{ height: "100%" }}>
              <Typography
                variant="h6"
                sx={{ fontWeight: 800 }}
              >
                Downtime Trend
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 2 }}
              >
                Recorded downtime duration by date
              </Typography>

              <ResponsiveContainer
                width="100%"
                height="82%"
              >
                <AreaChart data={downtimeTrend}>
                  <defs>
                    <linearGradient
                      id="downtimeGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#8b5cf6"
                        stopOpacity={0.35}
                      />
                      <stop
                        offset="95%"
                        stopColor="#8b5cf6"
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis dataKey="date" />

                  <YAxis />

                  <Tooltip />

                  <Area
                    type="monotone"
                    dataKey="downtime"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    fill="url(#downtimeGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: 420 }}>
            <CardContent sx={{ height: "100%" }}>
              <Typography
                variant="h6"
                sx={{ fontWeight: 800 }}
              >
                Priority Intelligence
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 1 }}
              >
                Incident priority distribution
              </Typography>

              <ResponsiveContainer
                width="100%"
                height="82%"
              >
                <PieChart>
                  <Pie
                    data={priorityData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={65}
                    outerRadius={105}
                    paddingAngle={4}
                  >
                    {priorityData.map(
                      (entry) => (
                        <Cell
                          key={entry.name}
                          fill={
                            PRIORITY_COLORS[
                              entry.name
                            ] ||
                            PRIORITY_COLORS.UNKNOWN
                          }
                        />
                      )
                    )}
                  </Pie>

                  <Tooltip />

                  <Legend
                    verticalAlign="bottom"
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* =================================================
          MACHINE + CATEGORY
      ================================================= */}

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: 410 }}>
            <CardContent sx={{ height: "100%" }}>
              <Typography
                variant="h6"
                sx={{ fontWeight: 800 }}
              >
                Machine-wise Downtime
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 2 }}
              >
                Downtime concentration across
                machines
              </Typography>

              <ResponsiveContainer
                width="100%"
                height="78%"
              >
                <BarChart
                  data={machinePerformance}
                  layout="vertical"
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                  />

                  <XAxis type="number" />

                  <YAxis
                    type="category"
                    dataKey="machine"
                    width={90}
                  />

                  <Tooltip />

                  <Bar
                    dataKey="minutes"
                    fill="#06b6d4"
                    radius={[
                      0, 8, 8, 0,
                    ]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: 410 }}>
            <CardContent sx={{ height: "100%" }}>
              <Typography
                variant="h6"
                sx={{ fontWeight: 800 }}
              >
                Category-wise Incidents
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 2 }}
              >
                Incident concentration by issue
                category
              </Typography>

              <ResponsiveContainer
                width="100%"
                height="78%"
              >
                <BarChart
                  data={categoryPerformance}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis dataKey="category" />

                  <YAxis
                    allowDecimals={false}
                  />

                  <Tooltip />

                  <Bar
                    dataKey="count"
                    fill="#f97316"
                    radius={[
                      8, 8, 0, 0,
                    ]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* =================================================
          AI INTELLIGENCE
      ================================================= */}

      <Card
        sx={{
          mb: 3,
          overflow: "hidden",
          border:
            "1px solid rgba(124,58,237,0.2) !important",
          background:
            "linear-gradient(135deg,#faf5ff 0%,#eef2ff 100%) !important",
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2.5,
              flexWrap: "wrap",
              gap: 1,
            }}
          >
            <Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <AutoAwesome
                  sx={{ color: COLORS.purple }}
                />

                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                  }}
                >
                  AI Intelligence Layer
                </Typography>
              </Box>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                Insights generated from stored ML
                prediction records
              </Typography>
            </Box>

            <Chip
              icon={<Psychology />}
              label={`${predictions.length} predictions`}
              sx={{
                background:
                  "rgba(124,58,237,0.1)",
                color: COLORS.purple,
                fontWeight: 700,
              }}
            />
          </Box>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Box
                sx={{
                  p: 2.2,
                  borderRadius: 3,
                  background: "#fff",
                  border:
                    "1px solid #e9d5ff",
                }}
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  AI Predictions
                </Typography>

                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    color: COLORS.purple,
                    mt: 0.5,
                  }}
                >
                  {predictions.length}
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Stored prediction records
                </Typography>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Box
                sx={{
                  p: 2.2,
                  borderRadius: 3,
                  background: "#fff",
                  border:
                    "1px solid #c4b5fd",
                }}
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Priority Confidence
                </Typography>

                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    color: COLORS.blue,
                    mt: 0.5,
                  }}
                >
                  {averagePriorityConfidence.toFixed(
                    1
                  )}
                </Typography>

                <LinearProgress
                  variant="determinate"
                  value={Math.min(
                    Math.max(
                      averagePriorityConfidence,
                      0
                    ),
                    100
                  )}
                  sx={{
                    mt: 1,
                    height: 6,
                    borderRadius: 5,
                  }}
                />
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Box
                sx={{
                  p: 2.2,
                  borderRadius: 3,
                  background: "#fff",
                  border:
                    "1px solid #bae6fd",
                }}
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Root Cause Confidence
                </Typography>

                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    color: COLORS.cyan,
                    mt: 0.5,
                  }}
                >
                  {averageRootCauseConfidence.toFixed(
                    1
                  )}
                </Typography>

                <LinearProgress
                  variant="determinate"
                  value={Math.min(
                    Math.max(
                      averageRootCauseConfidence,
                      0
                    ),
                    100
                  )}
                  sx={{
                    mt: 1,
                    height: 6,
                    borderRadius: 5,
                  }}
                />
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Box
                sx={{
                  p: 2.2,
                  borderRadius: 3,
                  background: "#fff",
                  border:
                    "1px solid #fecdd3",
                }}
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  High-risk Predictions
                </Typography>

                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    color: COLORS.red,
                    mt: 0.5,
                  }}
                >
                  {aiHighRisk}
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  HIGH / CRITICAL
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Grid
            container
            spacing={2}
            sx={{ mt: 0.5 }}
          >
            <Grid size={{ xs: 12, md: 7 }}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 3,
                  background: "#fff",
                  border:
                    "1px solid #e9d5ff",
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 700,
                    mb: 1.5,
                  }}
                >
                  Recommended Support Teams
                </Typography>

                {recommendedTeams.length ===
                0 ? (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    No team recommendation data
                    available.
                  </Typography>
                ) : (
                  recommendedTeams.map(
                    (team) => (
                      <Box
                        key={team.team}
                        sx={{
                          display: "flex",
                          justifyContent:
                            "space-between",
                          alignItems: "center",
                          py: 0.8,
                          borderBottom:
                            "1px solid #f2f4f7",
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems:
                              "center",
                            gap: 1,
                          }}
                        >
                          <Groups
                            fontSize="small"
                            sx={{
                              color:
                                COLORS.purple,
                            }}
                          />

                          <Typography
                            variant="body2"
                          >
                            {team.team}
                          </Typography>
                        </Box>

                        <Chip
                          size="small"
                          label={`${team.count}`}
                        />
                      </Box>
                    )
                  )
                )}
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 5 }}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 3,
                  height: "100%",
                  background:
                    "linear-gradient(135deg,#312e81,#7c3aed)",
                  color: "#fff",
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 700,
                    mb: 1,
                  }}
                >
                  AI Signal Monitor
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      opacity: 0.7,
                    }}
                  >
                    Recurring failure signals
                  </Typography>

                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 800,
                    }}
                  >
                    {recurringSignals}
                  </Typography>
                </Box>

                <Typography
                  variant="body2"
                  sx={{
                    opacity: 0.78,
                    lineHeight: 1.6,
                  }}
                >
                  Prediction records with recurring
                  failure patterns identified by the
                  existing ML layer.
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* =================================================
          OPERATIONAL HEALTH
      ================================================= */}

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography
            variant="h6"
            sx={{ fontWeight: 800 }}
          >
            Operational Health
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 2.5 }}
          >
            Current performance indicators calculated
            from available operational records
          </Typography>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 3 }}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 3,
                  background:
                    "linear-gradient(135deg,#eff6ff,#dbeafe)",
                }}
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Resolution Rate
                </Typography>

                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 800,
                    color: COLORS.blue,
                  }}
                >
                  {resolutionRate.toFixed(1)}%
                </Typography>

                <LinearProgress
                  variant="determinate"
                  value={resolutionRate}
                  sx={{
                    mt: 1,
                    height: 7,
                    borderRadius: 5,
                  }}
                />
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 3,
                  background:
                    "linear-gradient(135deg,#ecfdf5,#d1fae5)",
                }}
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Average Response
                </Typography>

                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 800,
                    color: COLORS.green,
                  }}
                >
                  {averageResponseTime.toFixed(1)} min
                </Typography>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 3,
                  background:
                    "linear-gradient(135deg,#fff7ed,#ffedd5)",
                }}
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Average Resolution
                </Typography>

                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 800,
                    color: COLORS.orange,
                  }}
                >
                  {averageResolutionTime.toFixed(
                    1
                  )}{" "}
                  min
                </Typography>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 3,
                  background:
                    "linear-gradient(135deg,#f5f3ff,#ede9fe)",
                }}
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Active Tickets
                </Typography>

                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 800,
                    color: COLORS.purple,
                  }}
                >
                  {
                    tickets.filter(
                      (ticket) =>
                        ticket.status === "OPEN" ||
                        ticket.status ===
                          "IN_PROGRESS"
                    ).length
                  }
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}