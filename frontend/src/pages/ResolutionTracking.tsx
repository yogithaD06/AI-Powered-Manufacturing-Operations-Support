import { useEffect, useMemo, useState } from "react";
import axios from "axios";

import {
  Add,
  Edit,
  Refresh,
  Search,
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
  Typography,
} from "@mui/material";

const API = "/api";

interface ResolutionRecord {
  resolution_id: number;
  incident_id: number | null;
  ticket_id: number | null;
  resolution_description: string | null;
  resolution_method: string | null;
  parts_resources_used: string | null;
  resolution_notes: string | null;
  resolved_by: number | null;
  resolved_at: string | null;
  verification_result: string | null;
  verification_status: string | null;
  verified_by: number | null;
  verification_date: string | null;
  closure_notes: string | null;
  closure_status: string | null;
  created_at?: string;
}

const emptyForm = {
  incident_id: "",
  ticket_id: "",
  resolution_description: "",
  resolution_method: "",
  parts_resources_used: "",
  resolution_notes: "",
  resolved_by: "",
  resolved_at: "",
  verification_result: "",
  verification_status: "PENDING",
  verified_by: "",
  verification_date: "",
  closure_notes: "",
  closure_status: "OPEN",
};

export default function ResolutionTracking() {
  const [records, setRecords] = useState<ResolutionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchText, setSearchText] = useState("");
  const [openForm, setOpenForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const [editingResolutionId, setEditingResolutionId] =
    useState<number | null>(null);

  const [formData, setFormData] = useState(emptyForm);

  const fetchRecords = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        `${API}/resolution-records/?skip=0&limit=100`
      );

      setRecords(response.data);
    } catch (error) {
      console.error("Failed to fetch resolution records:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
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
    setEditingResolutionId(null);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveMessage("");

      const payload = {
        incident_id: Number(formData.incident_id),
        ticket_id: Number(formData.ticket_id),
        resolution_description:
          formData.resolution_description || null,
        resolution_method:
          formData.resolution_method || null,
        parts_resources_used:
          formData.parts_resources_used || null,
        resolution_notes:
          formData.resolution_notes || null,
        resolved_by: formData.resolved_by
          ? Number(formData.resolved_by)
          : null,
        resolved_at: formData.resolved_at || null,
        verification_result:
          formData.verification_result || null,
        verification_status:
          formData.verification_status || null,
        verified_by: formData.verified_by
          ? Number(formData.verified_by)
          : null,
        verification_date:
          formData.verification_date || null,
        closure_notes:
          formData.closure_notes || null,
        closure_status:
          formData.closure_status || null,
      };

      if (editingResolutionId !== null) {
        await axios.put(
          `${API}/resolution-records/${editingResolutionId}`,
          payload
        );

        setSaveMessage(
          "Resolution record updated successfully."
        );
      } else {
        await axios.post(
          `${API}/resolution-records/`,
          payload
        );

        setSaveMessage(
          "Resolution record saved successfully."
        );
      }

      await fetchRecords();

      setTimeout(() => {
        setOpenForm(false);
        resetForm();
        setSaveMessage("");
      }, 1000);
    } catch (error) {
      console.error("Failed to save resolution record:", error);
      setSaveMessage("Failed to save resolution record.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (record: ResolutionRecord) => {
    setEditingResolutionId(record.resolution_id);

    setFormData({
      incident_id:
        record.incident_id?.toString() || "",
      ticket_id:
        record.ticket_id?.toString() || "",
      resolution_description:
        record.resolution_description || "",
      resolution_method:
        record.resolution_method || "",
      parts_resources_used:
        record.parts_resources_used || "",
      resolution_notes:
        record.resolution_notes || "",
      resolved_by:
        record.resolved_by?.toString() || "",
      resolved_at:
        record.resolved_at || "",
      verification_result:
        record.verification_result || "",
      verification_status:
        record.verification_status || "PENDING",
      verified_by:
        record.verified_by?.toString() || "",
      verification_date:
        record.verification_date || "",
      closure_notes:
        record.closure_notes || "",
      closure_status:
        record.closure_status || "OPEN",
    });

    setOpenForm(true);
  };

  const filteredRecords = useMemo(() => {
    const search = searchText.toLowerCase();

    return records.filter((record) =>
      [
        record.resolution_id,
        record.incident_id,
        record.ticket_id,
        record.resolution_method,
        record.resolution_description,
        record.verification_status,
        record.closure_status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search)
    );
  }, [records, searchText]);

  const total = records.length;

  const verified = records.filter(
    (r) =>
      r.verification_status?.toUpperCase() === "VERIFIED" ||
      r.verification_status?.toUpperCase() === "PASS"
  ).length;

  const closed = records.filter(
    (r) =>
      r.closure_status?.toUpperCase() === "CLOSED" ||
      r.closure_status?.toUpperCase() === "COMPLETED"
  ).length;

  const pending = records.filter(
    (r) =>
      !r.verification_status ||
      r.verification_status.toUpperCase() === "PENDING"
  ).length;

  const verificationRate =
    total > 0 ? Math.round((verified / total) * 100) : 0;

  const closureRate =
    total > 0 ? Math.round((closed / total) * 100) : 0;

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
            sx={{ fontWeight: 700, mb: 0.5 }}
          >
            Resolution Tracking
          </Typography>

          <Typography color="text.secondary">
            Track resolution activities, verification and incident closure
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchRecords}
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
          >
            New Resolution
          </Button>
        </Box>
      </Box>

      {/* KPI CARDS */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">
                Total Resolutions
              </Typography>

              <Typography
                variant="h4"
                sx={{ fontWeight: 700, mt: 1 }}
              >
                {total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">
                Pending Verification
              </Typography>

              <Typography
                variant="h4"
                sx={{ fontWeight: 700, mt: 1 }}
              >
                {pending}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">
                Verification Rate
              </Typography>

              <Typography
                variant="h4"
                sx={{ fontWeight: 700, mt: 1 }}
              >
                {verificationRate}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">
                Closure Rate
              </Typography>

              <Typography
                variant="h4"
                sx={{ fontWeight: 700, mt: 1 }}
              >
                {closureRate}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* SEARCH */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            label="Search resolution records"
            placeholder="Search by ID, incident, ticket, method or status..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
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
        <CardContent>
          <Box sx={{ overflowX: "auto" }}>
            <Box sx={{ minWidth: 1150 }}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns:
                    "80px 90px 90px 1.4fr 1.2fr 130px 130px 130px 100px",
                  gap: 2,
                  alignItems: "center",
                  px: 2,
                  py: 1.5,
                  borderBottom: "1px solid #e5e7eb",
                  fontWeight: 700,
                }}
              >
                <Typography sx={{ fontWeight: 700 }}>
                  ID
                </Typography>

                <Typography sx={{ fontWeight: 700 }}>
                  Incident
                </Typography>

                <Typography sx={{ fontWeight: 700 }}>
                  Ticket
                </Typography>

                <Typography sx={{ fontWeight: 700 }}>
                  Resolution
                </Typography>

                <Typography sx={{ fontWeight: 700 }}>
                  Method
                </Typography>

                <Typography sx={{ fontWeight: 700 }}>
                  Verification
                </Typography>

                <Typography sx={{ fontWeight: 700 }}>
                  Closure
                </Typography>

                <Typography sx={{ fontWeight: 700 }}>
                  Resolved At
                </Typography>

                <Typography sx={{ fontWeight: 700 }}>
                  Actions
                </Typography>
              </Box>

              {loading ? (
                <Typography
                  sx={{ p: 3 }}
                  color="text.secondary"
                >
                  Loading resolution records...
                </Typography>
              ) : filteredRecords.length === 0 ? (
                <Typography
                  sx={{ p: 3 }}
                  color="text.secondary"
                >
                  No resolution records found.
                </Typography>
              ) : (
                filteredRecords.map((record) => (
                  <Box
                    key={record.resolution_id}
                    sx={{
                      display: "grid",
                      gridTemplateColumns:
                        "80px 90px 90px 1.4fr 1.2fr 130px 130px 130px 100px",
                      gap: 2,
                      alignItems: "center",
                      px: 2,
                      py: 1.8,
                      borderBottom:
                        "1px solid #f0f2f5",
                    }}
                  >
                    <Typography>
                      {record.resolution_id}
                    </Typography>

                    <Typography>
                      {record.incident_id ?? "-"}
                    </Typography>

                    <Typography>
                      {record.ticket_id ?? "-"}
                    </Typography>

                    <Typography
                      sx={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {record.resolution_description ||
                        "-"}
                    </Typography>

                    <Typography>
                      {record.resolution_method || "-"}
                    </Typography>

                    <Chip
                      size="small"
                      label={
                        record.verification_status ||
                        "PENDING"
                      }
                    />

                    <Chip
                      size="small"
                      label={
                        record.closure_status ||
                        "OPEN"
                      }
                    />

                    <Typography>
                      {record.resolved_at
                        ? new Date(
                            record.resolved_at
                          ).toLocaleString()
                        : "-"}
                    </Typography>

                    <IconButton
                      color="primary"
                      onClick={() => handleEdit(record)}
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

      {/* CREATE / EDIT DIALOG */}
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
          {editingResolutionId !== null
            ? "Edit Resolution Record"
            : "New Resolution Record"}
        </DialogTitle>

        <DialogContent dividers>
          <Grid container spacing={2}>
            {/* INCIDENT / TICKET */}
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
                required
                label="Ticket ID"
                type="number"
                value={formData.ticket_id}
                onChange={(e) =>
                  handleChange(
                    "ticket_id",
                    e.target.value
                  )
                }
              />
            </Grid>

            {/* RESOLUTION */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Resolution Description"
                value={
                  formData.resolution_description
                }
                onChange={(e) =>
                  handleChange(
                    "resolution_description",
                    e.target.value
                  )
                }
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Resolution Method"
                value={formData.resolution_method}
                onChange={(e) =>
                  handleChange(
                    "resolution_method",
                    e.target.value
                  )
                }
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Parts / Resources Used"
                value={
                  formData.parts_resources_used
                }
                onChange={(e) =>
                  handleChange(
                    "parts_resources_used",
                    e.target.value
                  )
                }
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Resolution Notes"
                value={formData.resolution_notes}
                onChange={(e) =>
                  handleChange(
                    "resolution_notes",
                    e.target.value
                  )
                }
              />
            </Grid>

            {/* RESOLVED */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Resolved By"
                type="number"
                value={formData.resolved_by}
                onChange={(e) =>
                  handleChange(
                    "resolved_by",
                    e.target.value
                  )
                }
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Resolved At"
                type="datetime-local"
                value={formData.resolved_at}
                onChange={(e) =>
                  handleChange(
                    "resolved_at",
                    e.target.value
                  )
                }
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
              />
            </Grid>

            {/* VERIFICATION */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Verification Result"
                value={
                  formData.verification_result
                }
                onChange={(e) =>
                  handleChange(
                    "verification_result",
                    e.target.value
                  )
                }
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                select
                label="Verification Status"
                value={
                  formData.verification_status
                }
                onChange={(e) =>
                  handleChange(
                    "verification_status",
                    e.target.value
                  )
                }
              >
                <MenuItem value="PENDING">
                  PENDING
                </MenuItem>
                <MenuItem value="VERIFIED">
                  VERIFIED
                </MenuItem>
                <MenuItem value="PASS">
                  PASS
                </MenuItem>
                <MenuItem value="FAILED">
                  FAILED
                </MenuItem>
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Verified By"
                type="number"
                value={formData.verified_by}
                onChange={(e) =>
                  handleChange(
                    "verified_by",
                    e.target.value
                  )
                }
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Verification Date"
                type="datetime-local"
                value={formData.verification_date}
                onChange={(e) =>
                  handleChange(
                    "verification_date",
                    e.target.value
                  )
                }
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
              />
            </Grid>

            {/* CLOSURE */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Closure Notes"
                value={formData.closure_notes}
                onChange={(e) =>
                  handleChange(
                    "closure_notes",
                    e.target.value
                  )
                }
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                select
                label="Closure Status"
                value={formData.closure_status}
                onChange={(e) =>
                  handleChange(
                    "closure_status",
                    e.target.value
                  )
                }
              >
                <MenuItem value="OPEN">
                  OPEN
                </MenuItem>
                <MenuItem value="IN_PROGRESS">
                  IN_PROGRESS
                </MenuItem>
                <MenuItem value="CLOSED">
                  CLOSED
                </MenuItem>
                <MenuItem value="COMPLETED">
                  COMPLETED
                </MenuItem>
              </TextField>
            </Grid>
          </Grid>

          {saveMessage && (
            <Typography
              sx={{
                mt: 2,
                fontWeight: 600,
              }}
              color={
                saveMessage.includes("successfully")
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
            onClick={handleSave}
            disabled={
              saving ||
              !formData.incident_id ||
              !formData.ticket_id
            }
          >
            {saving ? "Saving..." : "Save Resolution"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}