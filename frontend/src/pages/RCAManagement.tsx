import { useEffect, useMemo, useState } from "react";
import axios from "axios";

import { mlApi } from "../api/ml";
import RCAAssistant from "../components/ml/RCAAssistant";

import {
  Add,
  Analytics,
  Category,
  CheckCircle,
  Edit,
  PendingActions,
  Refresh,
  Search,
  TrendingUp,
} from "@mui/icons-material";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";

const API = "/api";

interface RCARecord {
  rca_id: number;
  incident_id: number | null;
  investigation_notes: string | null;
  investigation_method: string | null;
  evidence_observations: string | null;
  contributing_factors: string | null;
  root_cause: string | null;
  root_cause_category: string | null;
  corrective_action_required: string | null;
  rca_findings: string | null;
  identified_by: number | null;
  status: string;
  completed_at: string | null;
  created_at?: string;
}

const STATUS_COLORS: Record<string, string> = {
  OPEN: "#f59e0b",
  IN_PROGRESS: "#3b82f6",
  COMPLETED: "#22c55e",
};

const formatStatus = (status: string) =>
  status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const getStatusColor = (status: string) =>
  STATUS_COLORS[status] || "#64748b";

export default function RCAManagement() {
  const [records, setRecords] = useState<RCARecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchText, setSearchText] = useState("");

  const [openForm, setOpenForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const [editingRcaId, setEditingRcaId] = useState<number | null>(null);

  // Set when the form was filled from the AI draft: saving then also sends the
  // human-approved RCA to the ML service as training feedback.
  const [aiIncident, setAiIncident] = useState<{
    title: string;
    description: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    incident_id: "",
    investigation_notes: "",
    investigation_method: "",
    evidence_observations: "",
    contributing_factors: "",
    root_cause: "",
    root_cause_category: "",
    corrective_action_required: "",
    rca_findings: "",
    identified_by: "",
    status: "OPEN",
    completed_at: "",
  });

  const fetchRCARecords = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        `${API}/rca-records/?skip=0&limit=100`
      );

      setRecords(response.data);
    } catch (error) {
      console.error("Failed to fetch RCA records:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRCARecords();
  }, []);

  const resetForm = () => {
    setFormData({
      incident_id: "",
      investigation_notes: "",
      investigation_method: "",
      evidence_observations: "",
      contributing_factors: "",
      root_cause: "",
      root_cause_category: "",
      corrective_action_required: "",
      rca_findings: "",
      identified_by: "",
      status: "OPEN",
      completed_at: "",
    });

    setEditingRcaId(null);
    setAiIncident(null);
  };

  const handleChange = (
    field: keyof typeof formData,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveMessage("");

      const payload = {
        incident_id: Number(formData.incident_id),

        investigation_notes:
          formData.investigation_notes || null,

        investigation_method:
          formData.investigation_method || null,

        evidence_observations:
          formData.evidence_observations || null,

        contributing_factors:
          formData.contributing_factors || null,

        root_cause:
          formData.root_cause || null,

        root_cause_category:
          formData.root_cause_category || null,

        corrective_action_required:
          formData.corrective_action_required || null,

        rca_findings:
          formData.rca_findings || null,

        identified_by: formData.identified_by
          ? Number(formData.identified_by)
          : null,

        status: formData.status,

        completed_at:
          formData.completed_at || null,
      };

      if (editingRcaId !== null) {
        await axios.put(
          `${API}/rca-records/${editingRcaId}`,
          payload
        );

        setSaveMessage("RCA record updated successfully.");
      } else {
        await axios.post(
          `${API}/rca-records/`,
          payload
        );

        setSaveMessage("RCA record saved successfully.");
      }

      if (aiIncident) {
        try {
          await mlApi.feedback({
            title: aiIncident.title,
            description: aiIncident.description,
            root_cause_category: formData.root_cause_category || null,
            root_cause: formData.root_cause || null,
            corrective_action: formData.corrective_action_required || null,
            source: "rca_page",
          });
          setSaveMessage(
            "RCA saved successfully and added to the ML knowledge base (used from the next retrain)."
          );
        } catch (error) {
          console.error("Failed to send RCA feedback to the ML service:", error);
        }
      }

      await fetchRCARecords();

      setEditingRcaId(null);

      setTimeout(() => {
        setOpenForm(false);
        resetForm();
        setSaveMessage("");
      }, 900);
    } catch (error) {
      console.error("Failed to save RCA record:", error);
      setSaveMessage("Failed to save RCA record.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (record: RCARecord) => {
    setEditingRcaId(record.rca_id);

    setFormData({
      incident_id:
        record.incident_id?.toString() || "",

      investigation_notes:
        record.investigation_notes || "",

      investigation_method:
        record.investigation_method || "",

      evidence_observations:
        record.evidence_observations || "",

      contributing_factors:
        record.contributing_factors || "",

      root_cause:
        record.root_cause || "",

      root_cause_category:
        record.root_cause_category || "",

      corrective_action_required:
        record.corrective_action_required || "",

      rca_findings:
        record.rca_findings || "",

      identified_by:
        record.identified_by?.toString() || "",

      status:
        record.status || "OPEN",

      completed_at:
        record.completed_at
          ? record.completed_at.slice(0, 16)
          : "",
    });

    setOpenForm(true);
  };

  const filteredRecords = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    if (!query) return records;

    return records.filter((record) =>
      [
        record.rca_id,
        record.incident_id,
        record.root_cause,
        record.root_cause_category,
        record.status,
        record.identified_by,
      ]
        .filter((value) => value !== null && value !== undefined)
        .some((value) =>
          String(value).toLowerCase().includes(query)
        )
    );
  }, [records, searchText]);

  /* =========================
     ANALYTICS
  ========================= */

  const totalRCA = records.length;

  const openRCA = records.filter(
    (record) => record.status === "OPEN"
  ).length;

  const inProgressRCA = records.filter(
    (record) =>
      record.status === "IN_PROGRESS" ||
      record.status === "IN PROGRESS"
  ).length;

  const completedRCA = records.filter(
    (record) => record.status === "COMPLETED"
  ).length;

  const completionRate =
    totalRCA > 0
      ? Math.round((completedRCA / totalRCA) * 100)
      : 0;

  const identifiedRootCauseCount = records.filter(
    (record) =>
      record.root_cause &&
      record.root_cause.trim().length > 0
  ).length;

  const correctiveActionCount = records.filter(
    (record) =>
      record.corrective_action_required &&
      record.corrective_action_required.trim().length > 0
  ).length;

  const statusData = [
    {
      name: "OPEN",
      value: openRCA,
    },
    {
      name: "IN_PROGRESS",
      value: inProgressRCA,
    },
    {
      name: "COMPLETED",
      value: completedRCA,
    },
  ].filter((item) => item.value > 0);

  const categoryData = useMemo(() => {
    const categoryMap: Record<string, number> = {};

    records.forEach((record) => {
      const category =
        record.root_cause_category?.trim() ||
        "Uncategorized";

      categoryMap[category] =
        (categoryMap[category] || 0) + 1;
    });

    return Object.entries(categoryMap)
      .map(([name, value]) => ({
        name,
        value,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [records]);

  const trendData = useMemo(() => {
    const dateMap: Record<string, number> = {};

    records.forEach((record) => {
      if (!record.created_at) return;

      const date = new Date(record.created_at);

      if (Number.isNaN(date.getTime())) return;

      const key = date.toISOString().slice(0, 10);

      dateMap[key] = (dateMap[key] || 0) + 1;
    });

    return Object.entries(dateMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({
        date: new Date(date).toLocaleDateString(
          "en-GB",
          {
            day: "2-digit",
            month: "short",
          }
        ),
        count,
      }));
  }, [records]);

  const mostCommonCategory =
    categoryData.length > 0
      ? categoryData[0].name
      : "—";

  const statusChartColors = statusData.map(
    (item) => getStatusColor(item.name)
  );

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100%",
        pb: 5,
      }}
    >
      {/* =========================
          HEADER
      ========================= */}

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: {
            xs: "flex-start",
            md: "center",
          },
          gap: 2,
          flexWrap: "wrap",
          mb: 3,
        }}
      >
        <Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.2,
              mb: 0.6,
            }}
          >
            <Analytics
              sx={{
                color: "#4f46e5",
                fontSize: 30,
              }}
            />

            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: "#172033",
              }}
            >
              RCA Analysis & Intelligence
            </Typography>

            <Chip
              label="ANALYTICS"
              size="small"
              sx={{
                backgroundColor: "#eef2ff",
                color: "#4338ca",
                fontWeight: 700,
              }}
            />
          </Box>

          <Typography
            variant="body1"
            sx={{
              color: "#667085",
            }}
          >
            Investigate incidents, identify root causes and
            analyze corrective-action performance.
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchRCARecords}
            disabled={loading}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Refresh
          </Button>

          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              resetForm();
              setOpenForm(true);
            }}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 700,
              boxShadow: "none",
            }}
          >
            New RCA Record
          </Button>
        </Box>
      </Box>

      {/* =========================
          KPI CARDS
      ========================= */}

      <Grid
        container
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "#667085",
                      mb: 1,
                    }}
                  >
                    Total RCA
                  </Typography>

                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 700 }}
                  >
                    {totalRCA}
                  </Typography>
                </Box>

                <Analytics
                  sx={{
                    fontSize: 34,
                    color: "#4f46e5",
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "#667085",
                      mb: 1,
                    }}
                  >
                    Open
                  </Typography>

                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 700 }}
                  >
                    {openRCA}
                  </Typography>
                </Box>

                <PendingActions
                  sx={{
                    fontSize: 34,
                    color: "#f59e0b",
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "#667085",
                      mb: 1,
                    }}
                  >
                    In Progress
                  </Typography>

                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 700 }}
                  >
                    {inProgressRCA}
                  </Typography>
                </Box>

                <TrendingUp
                  sx={{
                    fontSize: 34,
                    color: "#3b82f6",
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "#667085",
                      mb: 1,
                    }}
                  >
                    Completed
                  </Typography>

                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 700 }}
                  >
                    {completedRCA}
                  </Typography>
                </Box>

                <CheckCircle
                  sx={{
                    fontSize: 34,
                    color: "#22c55e",
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card>
            <CardContent>
              <Typography
                variant="body2"
                sx={{
                  color: "#667085",
                  mb: 1,
                }}
              >
                Completion Rate
              </Typography>

              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color:
                    completionRate >= 75
                      ? "#16a34a"
                      : "#172033",
                }}
              >
                {completionRate}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* =========================
          CHARTS
      ========================= */}

      <Grid
        container
        spacing={2}
        sx={{ mb: 3 }}
      >
        {/* STATUS DONUT */}

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700 }}
                >
                  RCA Status Distribution
                </Typography>

                <Typography
                  variant="body2"
                  sx={{ color: "#667085" }}
                >
                  Current investigation status.
                </Typography>
              </Box>

              {statusData.length > 0 ? (
                <Box
                  sx={{
                    width: "100%",
                    height: 280,
                  }}
                >
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <PieChart>
                      <Pie
                        data={statusData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="45%"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={3}
                      >
                        {statusData.map(
                          (entry, index) => (
                            <Cell
                              key={`cell-${entry.name}`}
                              fill={
                                statusChartColors[index]
                              }
                            />
                          )
                        )}
                      </Pie>

                      <RechartsTooltip />

                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value) =>
                          formatStatus(value)
                        }
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Box
                  sx={{
                    height: 280,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography
                    sx={{ color: "#98a2b3" }}
                  >
                    No RCA data available
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* ROOT CAUSE CATEGORY */}

        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700 }}
                >
                  Root Cause Category Analysis
                </Typography>

                <Typography
                  variant="body2"
                  sx={{ color: "#667085" }}
                >
                  Frequency of identified root-cause
                  categories.
                </Typography>
              </Box>

              {categoryData.length > 0 ? (
                <Box
                  sx={{
                    width: "100%",
                    height: 280,
                  }}
                >
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <BarChart
                      data={categoryData}
                      margin={{
                        top: 10,
                        right: 20,
                        left: 0,
                        bottom: 10,
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                      />

                      <XAxis
                        dataKey="name"
                        tick={{
                          fontSize: 11,
                        }}
                      />

                      <YAxis allowDecimals={false} />

                      <RechartsTooltip />

                      <Bar
                        dataKey="value"
                        name="RCA Count"
                        fill="#4f46e5"
                        radius={[
                          5,
                          5,
                          0,
                          0,
                        ]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Box
                  sx={{
                    height: 280,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography
                    sx={{ color: "#98a2b3" }}
                  >
                    No root-cause categories available
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* =========================
          TREND + INSIGHTS
      ========================= */}

      <Grid
        container
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700 }}
                >
                  RCA Investigation Trend
                </Typography>

                <Typography
                  variant="body2"
                  sx={{ color: "#667085" }}
                >
                  RCA records created over time.
                </Typography>
              </Box>

              {trendData.length > 0 ? (
                <Box
                  sx={{
                    width: "100%",
                    height: 280,
                  }}
                >
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <LineChart
                      data={trendData}
                      margin={{
                        top: 10,
                        right: 20,
                        left: 0,
                        bottom: 10,
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                      />

                      <XAxis dataKey="date" />

                      <YAxis allowDecimals={false} />

                      <RechartsTooltip />

                      <Line
                        type="monotone"
                        dataKey="count"
                        name="RCA Investigations"
                        stroke="#0ea5e9"
                        strokeWidth={3}
                        dot={{
                          r: 4,
                        }}
                        activeDot={{
                          r: 6,
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Box
                  sx={{
                    height: 280,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography
                    sx={{ color: "#98a2b3" }}
                  >
                    No trend data available
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* INTELLIGENCE INSIGHTS */}

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 0.5,
                }}
              >
                <Analytics
                  sx={{
                    color: "#4f46e5",
                  }}
                />

                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700 }}
                >
                  RCA Intelligence Insights
                </Typography>
              </Box>

              <Typography
                variant="body2"
                sx={{
                  color: "#667085",
                  mb: 2.5,
                }}
              >
                Insights calculated from current RCA
                records.
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.5,
                }}
              >
                <Box
                  sx={{
                    p: 1.7,
                    borderRadius: 2,
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 0.5,
                    }}
                  >
                    <Category
                      sx={{
                        fontSize: 20,
                        color: "#4f46e5",
                      }}
                    />

                    <Typography
                      variant="caption"
                      sx={{
                        color: "#667085",
                        fontWeight: 600,
                      }}
                    >
                      Most common category
                    </Typography>
                  </Box>

                  <Typography
                    sx={{
                      fontWeight: 700,
                      color: "#172033",
                    }}
                  >
                    {mostCommonCategory}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    p: 1.7,
                    borderRadius: 2,
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: "#667085",
                      fontWeight: 600,
                    }}
                  >
                    Root causes identified
                  </Typography>

                  <Typography
                    sx={{
                      fontWeight: 700,
                      mt: 0.4,
                    }}
                  >
                    {identifiedRootCauseCount} /{" "}
                    {totalRCA}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    p: 1.7,
                    borderRadius: 2,
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: "#667085",
                      fontWeight: 600,
                    }}
                  >
                    Corrective-action coverage
                  </Typography>

                  <Typography
                    sx={{
                      fontWeight: 700,
                      mt: 0.4,
                    }}
                  >
                    {correctiveActionCount} /{" "}
                    {totalRCA}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    p: 1.7,
                    borderRadius: 2,
                    backgroundColor: "#eefbf3",
                    border: "1px solid #bbf7d0",
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: "#15803d",
                      fontWeight: 600,
                    }}
                  >
                    Completion rate
                  </Typography>

                  <Typography
                    sx={{
                      fontWeight: 700,
                      mt: 0.4,
                      color: "#166534",
                    }}
                  >
                    {completionRate}%
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* =========================
          SEARCH
      ========================= */}

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <TextField
            fullWidth
            size="small"
            label="Search RCA records"
            placeholder="Search by RCA ID, incident, root cause, category or status..."
            value={searchText}
            onChange={(event) =>
              setSearchText(event.target.value)
            }
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              },
            }}
          />
        </CardContent>
      </Card>

      {/* =========================
          TABLE
      ========================= */}

      <Card>
        <CardContent sx={{ p: 0 }}>
          <Box
            sx={{
              width: "100%",
              overflowX: "auto",
            }}
          >
            <Box
              component="table"
              sx={{
                width: "100%",
                minWidth: 950,
                borderCollapse: "collapse",

                "& th": {
                  textAlign: "left",
                  padding: "14px 16px",
                  backgroundColor: "#f8fafc",
                  color: "#475467",
                  fontSize: "13px",
                  fontWeight: 700,
                  borderBottom:
                    "1px solid #e4e7ec",
                  whiteSpace: "nowrap",
                },

                "& td": {
                  padding: "14px 16px",
                  borderBottom:
                    "1px solid #eef0f3",
                  color: "#344054",
                  fontSize: "14px",
                  verticalAlign: "top",
                },

                "& tbody tr:hover": {
                  backgroundColor: "#fafbfc",
                },
              }}
            >
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Incident</th>
                  <th>Root Cause</th>
                  <th>Category</th>
                  <th>Identified By</th>
                  <th>Status</th>
                  <th>Completed</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={8}
                      style={{
                        textAlign: "center",
                        padding: 40,
                      }}
                    >
                      Loading RCA records...
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      style={{
                        textAlign: "center",
                        padding: 40,
                      }}
                    >
                      No RCA records found.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record) => (
                    <tr key={record.rca_id}>
                      <td>
                        <Typography
                          sx={{
                            fontWeight: 700,
                            color: "#172033",
                          }}
                        >
                          RCA-{record.rca_id}
                        </Typography>
                      </td>

                      <td>
                        {record.incident_id
                          ? `INC-${record.incident_id}`
                          : "—"}
                      </td>

                      <td>
                        <Typography
                          sx={{
                            maxWidth: 260,
                            whiteSpace: "normal",
                          }}
                        >
                          {record.root_cause || "—"}
                        </Typography>
                      </td>

                      <td>
                        {record.root_cause_category ? (
                          <Chip
                            label={
                              record.root_cause_category
                            }
                            size="small"
                            sx={{
                              fontWeight: 600,
                              backgroundColor:
                                "#eef2ff",
                              color: "#4338ca",
                            }}
                          />
                        ) : (
                          "—"
                        )}
                      </td>

                      <td>
                        {record.identified_by ?? "—"}
                      </td>

                      <td>
                        <Chip
                          label={formatStatus(
                            record.status
                          )}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            backgroundColor: `${getStatusColor(
                              record.status
                            )}18`,
                            color: getStatusColor(
                              record.status
                            ),
                          }}
                        />
                      </td>

                      <td>
                        {record.completed_at
                          ? new Date(
                              record.completed_at
                            ).toLocaleString()
                          : "—"}
                      </td>

                      <td>
                        <Tooltip title="Edit RCA">
                          <IconButton
                            size="small"
                            onClick={() =>
                              handleEdit(record)
                            }
                            sx={{
                              color: "#4f46e5",
                            }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* =========================
          CREATE / EDIT DIALOG
      ========================= */}

      <Dialog
        open={openForm}
        onClose={() => {
          if (!saving) {
            setOpenForm(false);
            resetForm();
          }
        }}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            pb: 1,
          }}
        >
          {editingRcaId !== null
            ? "Edit RCA Record"
            : "Create RCA Record"}
        </DialogTitle>

        <DialogContent dividers>
          <Grid
            container
            spacing={2}
            sx={{ pt: 0.5 }}
          >
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                required
                label="Incident ID"
                type="number"
                value={formData.incident_id}
                onChange={(event) =>
                  handleChange(
                    "incident_id",
                    event.target.value
                  )
                }
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Identified By"
                type="number"
                value={formData.identified_by}
                onChange={(event) =>
                  handleChange(
                    "identified_by",
                    event.target.value
                  )
                }
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Root Cause Category"
                value={formData.root_cause_category}
                onChange={(event) =>
                  handleChange(
                    "root_cause_category",
                    event.target.value
                  )
                }
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                select
                fullWidth
                label="Status"
                value={formData.status}
                onChange={(event) =>
                  handleChange(
                    "status",
                    event.target.value
                  )
                }
              >
                <MenuItem value="OPEN">
                  OPEN
                </MenuItem>

                <MenuItem value="IN_PROGRESS">
                  IN_PROGRESS
                </MenuItem>

                <MenuItem value="COMPLETED">
                  COMPLETED
                </MenuItem>
              </TextField>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <RCAAssistant
                incidentId={formData.incident_id}
                onApply={(values, incident) => {
                  setFormData((prev) => ({ ...prev, ...values }));
                  setAiIncident(incident);
                }}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                minRows={3}
                label="Investigation Notes"
                value={formData.investigation_notes}
                onChange={(event) =>
                  handleChange(
                    "investigation_notes",
                    event.target.value
                  )
                }
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                minRows={2}
                label="Investigation Method"
                value={formData.investigation_method}
                onChange={(event) =>
                  handleChange(
                    "investigation_method",
                    event.target.value
                  )
                }
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                minRows={3}
                label="Evidence / Observations"
                value={
                  formData.evidence_observations
                }
                onChange={(event) =>
                  handleChange(
                    "evidence_observations",
                    event.target.value
                  )
                }
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                minRows={3}
                label="Contributing Factors"
                value={formData.contributing_factors}
                onChange={(event) =>
                  handleChange(
                    "contributing_factors",
                    event.target.value
                  )
                }
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                minRows={3}
                label="Root Cause"
                value={formData.root_cause}
                onChange={(event) =>
                  handleChange(
                    "root_cause",
                    event.target.value
                  )
                }
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                minRows={3}
                label="Corrective Action Required"
                value={
                  formData.corrective_action_required
                }
                onChange={(event) =>
                  handleChange(
                    "corrective_action_required",
                    event.target.value
                  )
                }
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                minRows={3}
                label="RCA Findings"
                value={formData.rca_findings}
                onChange={(event) =>
                  handleChange(
                    "rca_findings",
                    event.target.value
                  )
                }
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                type="datetime-local"
                label="Completed At"
                value={formData.completed_at}
                onChange={(event) =>
                  handleChange(
                    "completed_at",
                    event.target.value
                  )
                }
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
              />
            </Grid>
          </Grid>

          {saveMessage && (
            <Box
              sx={{
                mt: 2,
                p: 1.5,
                borderRadius: 2,
                backgroundColor:
                  saveMessage.includes("successfully")
                    ? "#ecfdf3"
                    : "#fef3f2",
                color:
                  saveMessage.includes("successfully")
                    ? "#027a48"
                    : "#b42318",
              }}
            >
              <Typography
                variant="body2"
                sx={{ fontWeight: 600 }}
              >
                {saveMessage}
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 2,
          }}
        >
          <Button
            onClick={() => {
              setOpenForm(false);
              resetForm();
            }}
            disabled={saving}
            sx={{
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleSave}
            disabled={
              saving || !formData.incident_id
            }
            sx={{
              textTransform: "none",
              fontWeight: 700,
              minWidth: 130,
            }}
          >
            {saving
              ? "Saving..."
              : editingRcaId !== null
              ? "Update RCA"
              : "Save RCA"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}