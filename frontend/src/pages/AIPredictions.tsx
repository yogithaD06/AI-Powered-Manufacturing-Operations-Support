import { useEffect, useMemo, useState } from "react";
import axios from "axios";

import {
  Add,
  AutoAwesome,
  Edit,
  Psychology,
  Refresh,
  Search,
  SmartToy,
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
  LinearProgress,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";

import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const API = "/api";

interface MLPrediction {
  prediction_id: number;
  incident_id: number | null;
  predicted_priority: string | null;
  priority_confidence: number | null;
  estimated_resolution_time: number | null;
  probable_root_cause: string | null;
  root_cause_confidence: number | null;
  recommended_team: string | null;
  similar_incidents: string | null;
  recurring_pattern: string | null;
  downtime_forecast: number | null;
  model_version: string | null;
  created_at?: string;
}

const emptyForm = {
  incident_id: "",
  predicted_priority: "",
  priority_confidence: "",
  estimated_resolution_time: "",
  probable_root_cause: "",
  root_cause_confidence: "",
  recommended_team: "",
  similar_incidents: "",
  recurring_pattern: "",
  downtime_forecast: "",
  model_version: "",
};

export default function AIPredictions() {
  const [records, setRecords] = useState<MLPrediction[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchText, setSearchText] = useState("");
  const [openForm, setOpenForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const [editingPredictionId, setEditingPredictionId] =
    useState<number | null>(null);

  const [formData, setFormData] = useState(emptyForm);

  const fetchPredictions = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        `${API}/ml-predictions/?skip=0&limit=100`
      );

      setRecords(response.data);
    } catch (error) {
      console.error("Failed to fetch ML predictions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, []);

  const handleChange = (
    field: keyof typeof formData,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingPredictionId(null);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveMessage("");

      const payload = {
        incident_id: Number(formData.incident_id),
        predicted_priority:
          formData.predicted_priority || null,
        priority_confidence: formData.priority_confidence
          ? Number(formData.priority_confidence)
          : null,
        estimated_resolution_time:
          formData.estimated_resolution_time
            ? Number(formData.estimated_resolution_time)
            : null,
        probable_root_cause:
          formData.probable_root_cause || null,
        root_cause_confidence:
          formData.root_cause_confidence
            ? Number(formData.root_cause_confidence)
            : null,
        recommended_team:
          formData.recommended_team || null,
        similar_incidents:
          formData.similar_incidents || null,
        recurring_pattern:
          formData.recurring_pattern || null,
        downtime_forecast:
          formData.downtime_forecast
            ? Number(formData.downtime_forecast)
            : null,
        model_version:
          formData.model_version || null,
      };

      if (editingPredictionId !== null) {
        await axios.put(
          `${API}/ml-predictions/${editingPredictionId}`,
          payload
        );

        setSaveMessage(
          "AI prediction updated successfully."
        );
      } else {
        await axios.post(
          `${API}/ml-predictions/`,
          payload
        );

        setSaveMessage(
          "AI prediction saved successfully."
        );
      }

      await fetchPredictions();

      setTimeout(() => {
        setOpenForm(false);
        resetForm();
        setSaveMessage("");
      }, 1000);
    } catch (error) {
      console.error(
        "Failed to save ML prediction:",
        error
      );

      setSaveMessage(
        "Failed to save AI prediction."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (record: MLPrediction) => {
    setEditingPredictionId(record.prediction_id);

    setFormData({
      incident_id:
        record.incident_id?.toString() || "",

      predicted_priority:
        record.predicted_priority || "",

      priority_confidence:
        record.priority_confidence?.toString() || "",

      estimated_resolution_time:
        record.estimated_resolution_time?.toString() || "",

      probable_root_cause:
        record.probable_root_cause || "",

      root_cause_confidence:
        record.root_cause_confidence?.toString() || "",

      recommended_team:
        record.recommended_team || "",

      similar_incidents:
        record.similar_incidents || "",

      recurring_pattern:
        record.recurring_pattern || "",

      downtime_forecast:
        record.downtime_forecast?.toString() || "",

      model_version:
        record.model_version || "",
    });

    setOpenForm(true);
  };

  const filteredRecords = useMemo(() => {
    const search = searchText.toLowerCase();

    return records.filter((record) =>
      [
        record.prediction_id,
        record.incident_id,
        record.predicted_priority,
        record.probable_root_cause,
        record.recommended_team,
        record.recurring_pattern,
        record.model_version,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search)
    );
  }, [records, searchText]);

  /* ---------------- ANALYTICS ---------------- */

  const totalPredictions = records.length;

  const highPriority = records.filter(
    (r) =>
      r.predicted_priority?.toUpperCase() === "HIGH" ||
      r.predicted_priority?.toUpperCase() === "CRITICAL"
  ).length;

  const averagePriorityConfidence =
    records.length > 0
      ? records.reduce(
          (sum, r) =>
            sum + (r.priority_confidence || 0),
          0
        ) / records.length
      : 0;

  const averageRootCauseConfidence =
    records.length > 0
      ? records.reduce(
          (sum, r) =>
            sum + (r.root_cause_confidence || 0),
          0
        ) / records.length
      : 0;

  const priorityData = useMemo(() => {
    const counts: Record<string, number> = {};

    records.forEach((record) => {
      const priority =
        record.predicted_priority || "UNKNOWN";

      counts[priority] =
        (counts[priority] || 0) + 1;
    });

    return Object.entries(counts).map(
      ([priority, count]) => ({
        priority,
        count,
      })
    );
  }, [records]);

  const rootCauseData = useMemo(() => {
    const counts: Record<string, number> = {};

    records.forEach((record) => {
      const rootCause =
        record.probable_root_cause ||
        "Unknown";

      counts[rootCause] =
        (counts[rootCause] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([cause, count]) => ({
        cause:
          cause.length > 22
            ? `${cause.substring(0, 22)}...`
            : cause,
        count,
      }))
      .slice(0, 8);
  }, [records]);

  const teamData = useMemo(() => {
    const counts: Record<string, number> = {};

    records.forEach((record) => {
      const team =
        record.recommended_team ||
        "Unassigned";

      counts[team] =
        (counts[team] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([team, count]) => ({
        team,
        count,
      }))
      .slice(0, 6);
  }, [records]);

  const avgDowntime =
    records.length > 0
      ? records.reduce(
          (sum, r) =>
            sum + (r.downtime_forecast || 0),
          0
        ) / records.length
      : 0;

  return (
    <Box>
      {/* ================================================= */}
      {/* AI HEADER */}
      {/* ================================================= */}

      <Card
        sx={{
          mb: 3,
          overflow: "hidden",
          position: "relative",
          background:
            "linear-gradient(135deg, #101828 0%, #18263d 55%, #243b5a 100%) !important",
          color: "#ffffff",
          border: "none !important",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            width: 220,
            height: 220,
            borderRadius: "50%",
            background:
              "rgba(99, 102, 241, 0.18)",
            right: -60,
            top: -90,
          }}
        />

        <Box
          sx={{
            position: "absolute",
            width: 150,
            height: 150,
            borderRadius: "50%",
            background:
              "rgba(56, 189, 248, 0.12)",
            right: 130,
            bottom: -100,
          }}
        />

        <CardContent sx={{ position: "relative" }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <Box sx={{ display: "flex", gap: 2 }}>
              <Box
                sx={{
                  width: 54,
                  height: 54,
                  borderRadius: 3,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background:
                    "rgba(255,255,255,0.12)",
                  border:
                    "1px solid rgba(255,255,255,0.16)",
                }}
              >
                <AutoAwesome
                  sx={{ fontSize: 30 }}
                />
              </Box>

              <Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mb: 0.5,
                  }}
                >
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 700 }}
                  >
                    AI Intelligence Center
                  </Typography>

                  <Chip
                    icon={<SmartToy />}
                    label="ML Powered"
                    size="small"
                    sx={{
                      color: "#fff",
                      background:
                        "rgba(255,255,255,0.12)",
                    }}
                  />
                </Box>

                <Typography
                  sx={{
                    color:
                      "rgba(255,255,255,0.72)",
                  }}
                >
                  Predictive insights for incident
                  priority, root cause, resolution
                  and downtime.
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={fetchPredictions}
                sx={{
                  color: "#fff",
                  borderColor:
                    "rgba(255,255,255,0.3)",
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
                  background: "#fff",
                  color: "#18263d",
                  "&:hover": {
                    background: "#f3f4f6",
                  },
                }}
              >
                New Prediction
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* ================================================= */}
      {/* AI KPI CARDS */}
      {/* ================================================= */}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                }}
              >
                <Box>
                  <Typography
                    color="text.secondary"
                    sx={{ fontWeight: 600 }}
                  >
                    Total Predictions
                  </Typography>

                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 700,
                      mt: 1,
                    }}
                  >
                    {totalPredictions}
                  </Typography>
                </Box>

                <Psychology
                  sx={{
                    fontSize: 34,
                    opacity: 0.45,
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography
                color="text.secondary"
                sx={{ fontWeight: 600 }}
              >
                High / Critical Risk
              </Typography>

              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  mt: 1,
                }}
              >
                {highPriority}
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                Predicted priority
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography
                color="text.secondary"
                sx={{ fontWeight: 600 }}
              >
                Priority Confidence
              </Typography>

              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  mt: 1,
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
                sx={{ mt: 1.5 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography
                color="text.secondary"
                sx={{ fontWeight: 600 }}
              >
                Root Cause Confidence
              </Typography>

              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  mt: 1,
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
                sx={{ mt: 1.5 }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ================================================= */}
      {/* AI ANALYTICS */}
      {/* ================================================= */}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* PRIORITY */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography
                variant="h6"
                sx={{ fontWeight: 700 }}
              >
                Predicted Priority
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 2 }}
              >
                Distribution of stored ML priority
                predictions
              </Typography>

              {priorityData.length === 0 ? (
                <Typography
                  color="text.secondary"
                  sx={{ py: 6, textAlign: "center" }}
                >
                  No prediction data available
                </Typography>
              ) : (
                <Box
                  sx={{
                    width: "100%",
                    height: 230,
                  }}
                >
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={priorityData}
                        dataKey="count"
                        nameKey="priority"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                      >
                        {priorityData.map(
                          (_, index) => (
                            <Cell
                              key={index}
                            />
                          )
                        )}
                      </Pie>

                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* ROOT CAUSE */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography
                variant="h6"
                sx={{ fontWeight: 700 }}
              >
                Probable Root Cause Intelligence
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 2 }}
              >
                Root causes appearing across prediction
                records
              </Typography>

              {rootCauseData.length === 0 ? (
                <Typography
                  color="text.secondary"
                  sx={{ py: 6, textAlign: "center" }}
                >
                  No root-cause prediction data
                </Typography>
              ) : (
                <Box
                  sx={{
                    width: "100%",
                    height: 230,
                  }}
                >
                  <ResponsiveContainer>
                    <BarChart
                      data={rootCauseData}
                      layout="vertical"
                    >
                      <XAxis type="number" />
                      <YAxis
                        type="category"
                        dataKey="cause"
                        width={150}
                      />
                      <Tooltip />
                      <Bar
                        dataKey="count"
                        name="Predictions"
                        radius={[
                          0, 6, 6, 0,
                        ]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ================================================= */}
      {/* AI SIGNALS */}
      {/* ================================================= */}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  gap: 1.5,
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <TrendingUp />
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700 }}
                >
                  Downtime Forecast
                </Typography>
              </Box>

              <Typography
                variant="h3"
                sx={{ fontWeight: 700 }}
              >
                {avgDowntime.toFixed(1)}
              </Typography>

              <Typography
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                Average forecast value across
                prediction records
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, mb: 2 }}
              >
                Recommended Teams
              </Typography>

              {teamData.length === 0 ? (
                <Typography color="text.secondary">
                  No team recommendations yet.
                </Typography>
              ) : (
                <Box>
                  {teamData.slice(0, 4).map(
                    (team) => (
                      <Box
                        key={team.team}
                        sx={{
                          display: "flex",
                          justifyContent:
                            "space-between",
                          alignItems: "center",
                          py: 0.8,
                        }}
                      >
                        <Typography>
                          {team.team}
                        </Typography>

                        <Chip
                          size="small"
                          label={`${team.count} prediction${
                            team.count === 1
                              ? ""
                              : "s"
                          }`}
                        />
                      </Box>
                    )
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, mb: 2 }}
              >
                AI Signal Summary
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.3,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    gap: 1,
                    alignItems: "center",
                  }}
                >
                  <AutoAwesome fontSize="small" />
                  <Typography variant="body2">
                    {totalPredictions} prediction
                    records available
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    gap: 1,
                    alignItems: "center",
                  }}
                >
                  <Psychology fontSize="small" />
                  <Typography variant="body2">
                    Root-cause intelligence captured
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    gap: 1,
                    alignItems: "center",
                  }}
                >
                  <SmartToy fontSize="small" />
                  <Typography variant="body2">
                    ML model versions are tracked
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ================================================= */}
      {/* SEARCH */}
      {/* ================================================= */}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            label="Search AI predictions"
            placeholder="Search by incident, priority, root cause, team, pattern or model..."
            value={searchText}
            onChange={(e) =>
              setSearchText(e.target.value)
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

      {/* ================================================= */}
      {/* PREDICTION TABLE */}
      {/* ================================================= */}

      <Card>
        <CardContent>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              mb: 2,
            }}
          >
            Prediction Records
          </Typography>

          <Box sx={{ overflowX: "auto" }}>
            <Box sx={{ minWidth: 1250 }}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns:
                    "70px 90px 120px 120px 1.5fr 150px 130px 110px 100px",
                  gap: 2,
                  px: 2,
                  py: 1.5,
                  borderBottom:
                    "1px solid #e5e7eb",
                }}
              >
                {[
                  "ID",
                  "Incident",
                  "Priority",
                  "Priority Confidence",
                  "Probable Root Cause",
                  "Root Cause Confidence",
                  "Recommended Team",
                  "Model",
                  "Actions",
                ].map((heading) => (
                  <Typography
                    key={heading}
                    sx={{ fontWeight: 700 }}
                  >
                    {heading}
                  </Typography>
                ))}
              </Box>

              {loading ? (
                <Typography
                  sx={{ p: 3 }}
                  color="text.secondary"
                >
                  Loading AI predictions...
                </Typography>
              ) : filteredRecords.length === 0 ? (
                <Typography
                  sx={{ p: 3 }}
                  color="text.secondary"
                >
                  No AI prediction records found.
                </Typography>
              ) : (
                filteredRecords.map((record) => (
                  <Box
                    key={record.prediction_id}
                    sx={{
                      display: "grid",
                      gridTemplateColumns:
                        "70px 90px 120px 120px 1.5fr 150px 130px 110px 100px",
                      gap: 2,
                      alignItems: "center",
                      px: 2,
                      py: 1.7,
                      borderBottom:
                        "1px solid #f0f2f5",
                    }}
                  >
                    <Typography>
                      {record.prediction_id}
                    </Typography>

                    <Typography>
                      {record.incident_id ?? "-"}
                    </Typography>

                    <Chip
                      size="small"
                      label={
                        record.predicted_priority ||
                        "UNKNOWN"
                      }
                    />

                    <Box>
                      <Typography
                        variant="body2"
                        sx={{ mb: 0.5 }}
                      >
                        {record.priority_confidence ??
                          "-"}
                      </Typography>

                      <LinearProgress
                        variant="determinate"
                        value={Math.min(
                          Math.max(
                            record.priority_confidence ||
                              0,
                            0
                          ),
                          100
                        )}
                      />
                    </Box>

                    <Typography
                      sx={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {record.probable_root_cause ||
                        "-"}
                    </Typography>

                    <Box>
                      <Typography
                        variant="body2"
                        sx={{ mb: 0.5 }}
                      >
                        {record.root_cause_confidence ??
                          "-"}
                      </Typography>

                      <LinearProgress
                        variant="determinate"
                        value={Math.min(
                          Math.max(
                            record.root_cause_confidence ||
                              0,
                            0
                          ),
                          100
                        )}
                      />
                    </Box>

                    <Typography>
                      {record.recommended_team ||
                        "-"}
                    </Typography>

                    <Chip
                      size="small"
                      variant="outlined"
                      label={
                        record.model_version ||
                        "-"
                      }
                    />

                    <IconButton
                      color="primary"
                      onClick={() =>
                        handleEdit(record)
                      }
                    >
                      <Edit />
                    </IconButton>
                  </Box>
                ))
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* ================================================= */}
      {/* CREATE / EDIT DIALOG */}
      {/* ================================================= */}

      <Dialog
        open={openForm}
        onClose={() => {
          if (!saving) {
            setOpenForm(false);
            resetForm();
          }
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <AutoAwesome />
            {editingPredictionId !== null
              ? "Edit AI Prediction"
              : "Create AI Prediction"}
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                required
                label="Incident ID"
                type="number"
                value={formData.incident_id}
                onChange={(e) =>
                  handleChange(
                    "incident_id",
                    e.target.value
                  )
                }
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                select
                label="Predicted Priority"
                value={
                  formData.predicted_priority
                }
                onChange={(e) =>
                  handleChange(
                    "predicted_priority",
                    e.target.value
                  )
                }
              >
                <MenuItem value="LOW">
                  LOW
                </MenuItem>
                <MenuItem value="MEDIUM">
                  MEDIUM
                </MenuItem>
                <MenuItem value="HIGH">
                  HIGH
                </MenuItem>
                <MenuItem value="CRITICAL">
                  CRITICAL
                </MenuItem>
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Priority Confidence"
                type="number"
                value={
                  formData.priority_confidence
                }
                onChange={(e) =>
                  handleChange(
                    "priority_confidence",
                    e.target.value
                  )
                }
                helperText="Use the confidence value supported by your backend."
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Estimated Resolution Time"
                type="number"
                value={
                  formData.estimated_resolution_time
                }
                onChange={(e) =>
                  handleChange(
                    "estimated_resolution_time",
                    e.target.value
                  )
                }
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Probable Root Cause"
                value={
                  formData.probable_root_cause
                }
                onChange={(e) =>
                  handleChange(
                    "probable_root_cause",
                    e.target.value
                  )
                }
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Root Cause Confidence"
                type="number"
                value={
                  formData.root_cause_confidence
                }
                onChange={(e) =>
                  handleChange(
                    "root_cause_confidence",
                    e.target.value
                  )
                }
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Recommended Team"
                value={formData.recommended_team}
                onChange={(e) =>
                  handleChange(
                    "recommended_team",
                    e.target.value
                  )
                }
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Similar Incidents"
                value={formData.similar_incidents}
                onChange={(e) =>
                  handleChange(
                    "similar_incidents",
                    e.target.value
                  )
                }
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Recurring Pattern"
                value={formData.recurring_pattern}
                onChange={(e) =>
                  handleChange(
                    "recurring_pattern",
                    e.target.value
                  )
                }
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Downtime Forecast"
                type="number"
                value={formData.downtime_forecast}
                onChange={(e) =>
                  handleChange(
                    "downtime_forecast",
                    e.target.value
                  )
                }
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Model Version"
                value={formData.model_version}
                onChange={(e) =>
                  handleChange(
                    "model_version",
                    e.target.value
                  )
                }
              />
            </Grid>
          </Grid>

          {saveMessage && (
            <Typography
              sx={{
                mt: 2,
                fontWeight: 600,
              }}
              color={
                saveMessage.includes(
                  "successfully"
                )
                  ? "success.main"
                  : "error.main"
              }
            >
              {saveMessage}
            </Typography>
          )}
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => {
              setOpenForm(false);
              resetForm();
            }}
            disabled={saving}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            startIcon={<AutoAwesome />}
            onClick={handleSave}
            disabled={
              saving || !formData.incident_id
            }
          >
            {saving
              ? "Saving..."
              : "Save Prediction"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}