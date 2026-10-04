import { useEffect, useMemo, useState } from "react";
import axios from "axios";

import { mlApi } from "../api/ml";
import CAPAAssistant, {
  type CAPAFeedbackContext,
} from "../components/ml/CAPAAssistant";

import {
  Add,
  Assessment,
  CheckCircle,
  Edit,
  PendingActions,
  Refresh,
  Search,
  Verified,
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

const API = "/api";

interface CAPARecord {
  capa_id: number;
  incident_id: number | null;
  action_type: string | null;
  action_description: string | null;
  assigned_to: number | null;
  target_date: string | null;
  completion_date: string | null;
  status: string;
  verification_notes: string | null;
  verification_result: string | null;
  verified_by: number | null;
  verification_date: string | null;
  effectiveness_status: string | null;
  created_at?: string;
}

const STATUS_COLORS: Record<string, string> = {
  OPEN: "#f59e0b",
  IN_PROGRESS: "#3b82f6",
  COMPLETED: "#22c55e",
  CLOSED: "#16a34a",
};

const EFFECTIVENESS_COLORS: Record<string, string> = {
  EFFECTIVE: "#16a34a",
  PARTIALLY_EFFECTIVE: "#f59e0b",
  NOT_EFFECTIVE: "#ef4444",
};

const formatStatus = (status: string) =>
  status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const getStatusColor = (status: string) =>
  STATUS_COLORS[status] || "#64748b";

const getEffectivenessColor = (status: string) =>
  EFFECTIVENESS_COLORS[status] || "#64748b";

export default function CAPAManagement() {
  const [records, setRecords] = useState<CAPARecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchText, setSearchText] = useState("");

  const [openForm, setOpenForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const [editingCapaId, setEditingCapaId] = useState<number | null>(
    null
  );

  // Set when the form was filled from an AI-drafted action: saving then also
  // sends the human-approved action to the ML service as training feedback.
  const [aiContext, setAiContext] =
    useState<CAPAFeedbackContext | null>(null);

  const [formData, setFormData] = useState({
    incident_id: "",
    action_type: "",
    action_description: "",
    assigned_to: "",
    target_date: "",
    completion_date: "",
    status: "OPEN",
    verification_notes: "",
    verification_result: "",
    verified_by: "",
    verification_date: "",
    effectiveness_status: "",
  });

  const fetchCAPARecords = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        `${API}/capa-records/?skip=0&limit=100`
      );

      setRecords(response.data);
    } catch (error) {
      console.error("Failed to fetch CAPA records:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCAPARecords();
  }, []);

  const resetForm = () => {
    setFormData({
      incident_id: "",
      action_type: "",
      action_description: "",
      assigned_to: "",
      target_date: "",
      completion_date: "",
      status: "OPEN",
      verification_notes: "",
      verification_result: "",
      verified_by: "",
      verification_date: "",
      effectiveness_status: "",
    });

    setEditingCapaId(null);
    setAiContext(null);
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

        action_type: formData.action_type,

        action_description:
          formData.action_description || null,

        assigned_to: formData.assigned_to
          ? Number(formData.assigned_to)
          : null,

        target_date: formData.target_date || null,

        completion_date:
          formData.completion_date || null,

        status: formData.status,

        verification_notes:
          formData.verification_notes || null,

        verification_result:
          formData.verification_result || null,

        verified_by: formData.verified_by
          ? Number(formData.verified_by)
          : null,

        verification_date:
          formData.verification_date || null,

        effectiveness_status:
          formData.effectiveness_status || null,
      };

      if (editingCapaId !== null) {
        await axios.put(
          `${API}/capa-records/${editingCapaId}`,
          payload
        );

        setSaveMessage(
          "CAPA record updated successfully."
        );
      } else {
        await axios.post(
          `${API}/capa-records/`,
          payload
        );

        setSaveMessage(
          "CAPA record saved successfully."
        );
      }

      if (aiContext) {
        const isPreventive = formData.action_type === "PREVENTIVE";
        try {
          await mlApi.feedback({
            title: aiContext.title,
            description: aiContext.description,
            root_cause: aiContext.root_cause || null,
            root_cause_category: aiContext.root_cause_category || null,
            corrective_action: isPreventive ? null : formData.action_description,
            preventive_action: isPreventive ? formData.action_description : null,
            source: "capa_page",
          });
          setSaveMessage(
            "CAPA saved successfully and added to the ML knowledge base (used from the next retrain)."
          );
        } catch (error) {
          console.error("Failed to send CAPA feedback to the ML service:", error);
        }
      }

      await fetchCAPARecords();

      setTimeout(() => {
        setOpenForm(false);
        resetForm();
        setSaveMessage("");
      }, 900);
    } catch (error) {
      console.error("Failed to save CAPA record:", error);
      setSaveMessage("Failed to save CAPA record.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (record: CAPARecord) => {
    setEditingCapaId(record.capa_id);

    setFormData({
      incident_id:
        record.incident_id?.toString() || "",

      action_type:
        record.action_type || "",

      action_description:
        record.action_description || "",

      assigned_to:
        record.assigned_to?.toString() || "",

      target_date:
        record.target_date
          ? record.target_date.slice(0, 10)
          : "",

      completion_date:
        record.completion_date
          ? record.completion_date.slice(0, 10)
          : "",

      status:
        record.status || "OPEN",

      verification_notes:
        record.verification_notes || "",

      verification_result:
        record.verification_result || "",

      verified_by:
        record.verified_by?.toString() || "",

      verification_date:
        record.verification_date
          ? record.verification_date.slice(0, 16)
          : "",

      effectiveness_status:
        record.effectiveness_status || "",
    });

    setOpenForm(true);
  };

  const filteredRecords = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    if (!query) return records;

    return records.filter((record) =>
      [
        record.capa_id,
        record.incident_id,
        record.action_type,
        record.action_description,
        record.assigned_to,
        record.status,
        record.effectiveness_status,
      ]
        .filter(
          (value) =>
            value !== null &&
            value !== undefined
        )
        .some((value) =>
          String(value)
            .toLowerCase()
            .includes(query)
        )
    );
  }, [records, searchText]);

  /* =========================
     ANALYTICS
  ========================= */

  const totalCAPA = records.length;

  const openCAPA = records.filter(
    (record) => record.status === "OPEN"
  ).length;

  const inProgressCAPA = records.filter(
    (record) =>
      record.status === "IN_PROGRESS" ||
      record.status === "IN PROGRESS"
  ).length;

  const completedCAPA = records.filter(
    (record) =>
      record.status === "COMPLETED" ||
      record.status === "CLOSED"
  ).length;

  const verifiedCAPA = records.filter(
    (record) =>
      record.verification_result &&
      record.verification_result.trim().length > 0
  ).length;

  const effectiveCAPA = records.filter(
    (record) =>
      record.effectiveness_status ===
      "EFFECTIVE"
  ).length;

  const completionRate =
    totalCAPA > 0
      ? Math.round(
          (completedCAPA / totalCAPA) * 100
        )
      : 0;

  const verificationRate =
    totalCAPA > 0
      ? Math.round(
          (verifiedCAPA / totalCAPA) * 100
        )
      : 0;

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100%",
        pb: 5,
      }}
    >
      {/* HEADER */}

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
            <Assessment
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
              CAPA Management
            </Typography>

            <Chip
              label="CORRECTIVE ACTION"
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
            Track corrective and preventive actions,
            verification and effectiveness.
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
            onClick={fetchCAPARecords}
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
            New CAPA
          </Button>
        </Box>
      </Box>

      {/* KPI CARDS */}

      <Grid
        container
        spacing={2}
        sx={{ mb: 3 }}
      >
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
                Total CAPA
              </Typography>

              <Typography
                variant="h4"
                sx={{ fontWeight: 700 }}
              >
                {totalCAPA}
              </Typography>
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
                Open
              </Typography>

              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: "#f59e0b",
                }}
              >
                {openCAPA}
              </Typography>
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
                In Progress
              </Typography>

              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: "#3b82f6",
                }}
              >
                {inProgressCAPA}
              </Typography>
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
                Completed
              </Typography>

              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: "#16a34a",
                }}
              >
                {completedCAPA}
              </Typography>
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
                Verification Rate
              </Typography>

              <Typography
                variant="h4"
                sx={{ fontWeight: 700 }}
              >
                {verificationRate}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* INSIGHTS */}

      <Grid
        container
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 1,
                }}
              >
                <PendingActions
                  sx={{ color: "#f59e0b" }}
                />

                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700 }}
                >
                  Completion
                </Typography>
              </Box>

              <Typography
                variant="h3"
                sx={{
                  fontWeight: 700,
                  color: "#172033",
                }}
              >
                {completionRate}%
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  color: "#667085",
                  mt: 1,
                }}
              >
                CAPA actions completed or closed.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 1,
                }}
              >
                <Verified
                  sx={{ color: "#3b82f6" }}
                />

                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700 }}
                >
                  Verification
                </Typography>
              </Box>

              <Typography
                variant="h3"
                sx={{
                  fontWeight: 700,
                  color: "#172033",
                }}
              >
                {verifiedCAPA}
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  color: "#667085",
                  mt: 1,
                }}
              >
                CAPA records with verification results.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 1,
                }}
              >
                <CheckCircle
                  sx={{ color: "#16a34a" }}
                />

                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700 }}
                >
                  Effective Actions
                </Typography>
              </Box>

              <Typography
                variant="h3"
                sx={{
                  fontWeight: 700,
                  color: "#16a34a",
                }}
              >
                {effectiveCAPA}
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  color: "#667085",
                  mt: 1,
                }}
              >
                Actions marked as effective.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* SEARCH */}

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <TextField
            fullWidth
            size="small"
            label="Search CAPA records"
            placeholder="Search by CAPA ID, incident, action type, status or effectiveness..."
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

      {/* TABLE */}

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
                minWidth: 1200,
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
                  <th>Action Type</th>
                  <th>Action Description</th>
                  <th>Assigned To</th>
                  <th>Target Date</th>
                  <th>Status</th>
                  <th>Effectiveness</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={9}
                      style={{
                        textAlign: "center",
                        padding: 40,
                      }}
                    >
                      Loading CAPA records...
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      style={{
                        textAlign: "center",
                        padding: 40,
                      }}
                    >
                      No CAPA records found.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record) => (
                    <tr key={record.capa_id}>
                      <td>
                        <Typography
                          sx={{
                            fontWeight: 700,
                          }}
                        >
                          CAPA-{record.capa_id}
                        </Typography>
                      </td>

                      <td>
                        {record.incident_id
                          ? `INC-${record.incident_id}`
                          : "—"}
                      </td>

                      <td>
                        {record.action_type || "—"}
                      </td>

                      <td>
                        <Typography
                          sx={{
                            maxWidth: 260,
                          }}
                        >
                          {record.action_description ||
                            "—"}
                        </Typography>
                      </td>

                      <td>
                        {record.assigned_to ?? "—"}
                      </td>

                      <td>
                        {record.target_date
                          ? new Date(
                              record.target_date
                            ).toLocaleDateString()
                          : "—"}
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
                        {record.effectiveness_status ? (
                          <Chip
                            label={formatStatus(
                              record.effectiveness_status
                            )}
                            size="small"
                            sx={{
                              fontWeight: 700,
                              backgroundColor: `${getEffectivenessColor(
                                record.effectiveness_status
                              )}18`,
                              color:
                                getEffectivenessColor(
                                  record.effectiveness_status
                                ),
                            }}
                          />
                        ) : (
                          "—"
                        )}
                      </td>

                      <td>
                        <Tooltip title="Edit CAPA">
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

      {/* CREATE / EDIT DIALOG */}

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
          }}
        >
          {editingCapaId !== null
            ? "Edit CAPA Record"
            : "Create CAPA Record"}
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

            <Grid size={{ xs: 12 }}>
              <CAPAAssistant
                incidentId={formData.incident_id}
                onApply={(values, context) => {
                  setFormData((prev) => ({ ...prev, ...values }));
                  setAiContext(context);
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                required
                label="Action Type"
                value={formData.action_type}
                onChange={(event) =>
                  handleChange(
                    "action_type",
                    event.target.value
                  )
                }
                placeholder="Corrective / Preventive"
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                minRows={3}
                label="Action Description"
                value={
                  formData.action_description
                }
                onChange={(event) =>
                  handleChange(
                    "action_description",
                    event.target.value
                  )
                }
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Assigned To"
                type="number"
                value={formData.assigned_to}
                onChange={(event) =>
                  handleChange(
                    "assigned_to",
                    event.target.value
                  )
                }
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                type="date"
                label="Target Date"
                value={formData.target_date}
                onChange={(event) =>
                  handleChange(
                    "target_date",
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

            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                type="date"
                label="Completion Date"
                value={formData.completion_date}
                onChange={(event) =>
                  handleChange(
                    "completion_date",
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

                <MenuItem value="CLOSED">
                  CLOSED
                </MenuItem>
              </TextField>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                minRows={3}
                label="Verification Notes"
                value={formData.verification_notes}
                onChange={(event) =>
                  handleChange(
                    "verification_notes",
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
                label="Verification Result"
                value={
                  formData.verification_result
                }
                onChange={(event) =>
                  handleChange(
                    "verification_result",
                    event.target.value
                  )
                }
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Verified By"
                type="number"
                value={formData.verified_by}
                onChange={(event) =>
                  handleChange(
                    "verified_by",
                    event.target.value
                  )
                }
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                type="datetime-local"
                label="Verification Date"
                value={formData.verification_date}
                onChange={(event) =>
                  handleChange(
                    "verification_date",
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

            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                select
                fullWidth
                label="Effectiveness Status"
                value={
                  formData.effectiveness_status
                }
                onChange={(event) =>
                  handleChange(
                    "effectiveness_status",
                    event.target.value
                  )
                }
              >
                <MenuItem value="">
                  Not Evaluated
                </MenuItem>

                <MenuItem value="EFFECTIVE">
                  EFFECTIVE
                </MenuItem>

                <MenuItem value="PARTIALLY_EFFECTIVE">
                  PARTIALLY_EFFECTIVE
                </MenuItem>

                <MenuItem value="NOT_EFFECTIVE">
                  NOT_EFFECTIVE
                </MenuItem>
              </TextField>
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
              : editingCapaId !== null
              ? "Update CAPA"
              : "Save CAPA"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}