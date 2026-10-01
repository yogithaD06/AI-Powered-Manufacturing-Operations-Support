import { useEffect, useState } from "react";
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
  TextField,
  Typography,
} from "@mui/material";

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

export default function DowntimeManagement() {
  const [records, setRecords] = useState<DowntimeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");

  const [openForm, setOpenForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const [editingDowntimeId, setEditingDowntimeId] = useState<number | null>(
    null
  );

  const [formData, setFormData] = useState({
    incident_id: "",
    machine_id: "",
    line_id: "",
    downtime_reason: "",
    downtime_category: "",
    start_time: "",
    end_time: "",
    duration_minutes: "",
    production_units_affected: "",
    production_loss: "",
    impact_description: "",
  });

  // --------------------------------------------------
  // FETCH DOWNTIME RECORDS
  // --------------------------------------------------

  const fetchDowntimeRecords = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        `${API}/downtime-records/?skip=0&limit=100`
      );

      setRecords(response.data);
    } catch (error) {
      console.error("Failed to fetch downtime records:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDowntimeRecords();
  }, []);

  // --------------------------------------------------
  // RESET FORM
  // --------------------------------------------------

  const resetForm = () => {
    setFormData({
      incident_id: "",
      machine_id: "",
      line_id: "",
      downtime_reason: "",
      downtime_category: "",
      start_time: "",
      end_time: "",
      duration_minutes: "",
      production_units_affected: "",
      production_loss: "",
      impact_description: "",
    });

    setEditingDowntimeId(null);
    setSaveMessage("");
  };

  // --------------------------------------------------
  // SAVE / UPDATE DOWNTIME
  // --------------------------------------------------

  const handleSaveDowntime = async () => {
    try {
      setSaving(true);
      setSaveMessage("");

      const payload = {
        incident_id: Number(formData.incident_id),
        machine_id: Number(formData.machine_id),
        line_id: Number(formData.line_id),

        downtime_reason: formData.downtime_reason,
        downtime_category: formData.downtime_category,

        start_time: formData.start_time,
        end_time: formData.end_time || null,

        duration_minutes: formData.duration_minutes
          ? Number(formData.duration_minutes)
          : null,

        production_units_affected: formData.production_units_affected
          ? Number(formData.production_units_affected)
          : null,

        production_loss: formData.production_loss
          ? Number(formData.production_loss)
          : null,

        impact_description: formData.impact_description || null,
      };

      if (editingDowntimeId !== null) {
        await axios.put(
          `${API}/downtime-records/${editingDowntimeId}`,
          payload
        );

        setSaveMessage("Downtime record updated successfully.");
      } else {
        await axios.post(`${API}/downtime-records/`, payload);

        setSaveMessage("Downtime record saved successfully.");
      }

      await fetchDowntimeRecords();

      setEditingDowntimeId(null);

      setTimeout(() => {
        setOpenForm(false);
        resetForm();
      }, 1000);
    } catch (error) {
      console.error("Failed to save downtime record:", error);
      setSaveMessage("Failed to save downtime record.");
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------
  // EDIT
  // --------------------------------------------------

  const handleEdit = (record: DowntimeRecord) => {
    setEditingDowntimeId(record.downtime_id);

    setFormData({
      incident_id:
        record.incident_id !== null && record.incident_id !== undefined
          ? String(record.incident_id)
          : "",

      machine_id:
        record.machine_id !== null && record.machine_id !== undefined
          ? String(record.machine_id)
          : "",

      line_id:
        record.line_id !== null && record.line_id !== undefined
          ? String(record.line_id)
          : "",

      downtime_reason: record.downtime_reason || "",

      downtime_category: record.downtime_category || "",

      start_time: record.start_time
        ? record.start_time.slice(0, 16)
        : "",

      end_time: record.end_time
        ? record.end_time.slice(0, 16)
        : "",

      duration_minutes:
        record.duration_minutes !== null &&
        record.duration_minutes !== undefined
          ? String(record.duration_minutes)
          : "",

      production_units_affected:
        record.production_units_affected !== null &&
        record.production_units_affected !== undefined
          ? String(record.production_units_affected)
          : "",

      production_loss:
        record.production_loss !== null &&
        record.production_loss !== undefined
          ? String(record.production_loss)
          : "",

      impact_description: record.impact_description || "",
    });

    setSaveMessage("");
    setOpenForm(true);
  };

  // --------------------------------------------------
  // SEARCH
  // --------------------------------------------------

  const filteredRecords = records.filter((record) => {
    const search = searchText.toLowerCase();

    return (
      String(record.downtime_id).includes(search) ||
      String(record.incident_id ?? "").includes(search) ||
      String(record.machine_id ?? "").includes(search) ||
      (record.downtime_reason || "")
        .toLowerCase()
        .includes(search) ||
      (record.downtime_category || "")
        .toLowerCase()
        .includes(search)
    );
  });

  // --------------------------------------------------
  // KPI CALCULATIONS
  // --------------------------------------------------

  const totalDowntime = records.reduce(
    (sum, record) => sum + (record.duration_minutes || 0),
    0
  );

  const totalUnitsAffected = records.reduce(
    (sum, record) => sum + (record.production_units_affected || 0),
    0
  );

  const totalProductionLoss = records.reduce(
    (sum, record) => sum + (record.production_loss || 0),
    0
  );

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

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
  component="div"
  variant="h4"
  sx={{ fontWeight: 700 }}
>
  Downtime Management
</Typography>

          <Typography
            component="div"
            color="text.secondary"
            sx={{ mt: 0.5 }}
          >
            Track machine downtime, production impact and losses
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          <IconButton
            onClick={fetchDowntimeRecords}
            sx={{
              border: "1px solid #e0e5ec",
              borderRadius: 2,
            }}
          >
            <Refresh />
          </IconButton>

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
              fontWeight: 600,
            }}
          >
            New Downtime Record
          </Button>
        </Box>
      </Box>

      {/* KPI CARDS */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">
                Total Downtime
              </Typography>

              <Typography
  component="div"
  variant="h4"
  sx={{ mt: 1, fontWeight: 700 }}
>
  {totalDowntime} min
</Typography>

              <Typography
                component="div"
                variant="body2"
                color="text.secondary"
                sx={{ mt: 1 }}
              >
                Across all records
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">
                Units Affected
              </Typography>

<Typography
  component="div"
  variant="h4"
  sx={{ mt: 1, fontWeight: 700 }}
>
  {totalUnitsAffected}
</Typography>

              <Typography
                component="div"
                variant="body2"
                color="text.secondary"
                sx={{ mt: 1 }}
              >
                Production units
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">
                Production Loss
              </Typography>

<Typography
  component="div"
  variant="h4"
  sx={{ mt: 1, fontWeight: 700 }}
>
  ₹{totalProductionLoss.toLocaleString()}
</Typography>

              <Typography
                component="div"
                variant="body2"
                color="text.secondary"
                sx={{ mt: 1 }}
              >
                Recorded production loss
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
  placeholder="Search by downtime ID, incident, machine, reason or category..."
  value={searchText}
  onChange={(event) => setSearchText(event.target.value)}
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
          <Typography
  component="div"
  variant="h6"
  sx={{ mb: 2, fontWeight: 700 }}
>
            Downtime Records
          </Typography>

          <Box sx={{ overflowX: "auto" }}>
            <Box
              component="table"
              sx={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 1100,
              }}
            >
              <Box component="thead">
                <Box component="tr">
                  {[
                    "ID",
                    "Incident",
                    "Machine",
                    "Line",
                    "Reason",
                    "Category",
                    "Duration",
                    "Units",
                    "Loss",
                    "Actions",
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
                {loading ? (
                  <Box component="tr">
                    <Box
                      component="td"
                      colSpan={10}
                      sx={{
                        p: 4,
                        textAlign: "center",
                      }}
                    >
                      Loading downtime records...
                    </Box>
                  </Box>
                ) : filteredRecords.length === 0 ? (
                  <Box component="tr">
                    <Box
                      component="td"
                      colSpan={10}
                      sx={{
                        p: 4,
                        textAlign: "center",
                      }}
                    >
                      No downtime records found.
                    </Box>
                  </Box>
                ) : (
                  filteredRecords.map((record) => (
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
                        {record.downtime_id}
                      </Box>

                      <Box
                        component="td"
                        sx={{
                          p: 1.5,
                          borderBottom: "1px solid #f0f2f5",
                        }}
                      >
                        #{record.incident_id ?? "-"}
                      </Box>

                      <Box
                        component="td"
                        sx={{
                          p: 1.5,
                          borderBottom: "1px solid #f0f2f5",
                        }}
                      >
                        #{record.machine_id ?? "-"}
                      </Box>

                      <Box
                        component="td"
                        sx={{
                          p: 1.5,
                          borderBottom: "1px solid #f0f2f5",
                        }}
                      >
                        #{record.line_id ?? "-"}
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
                        <Chip
                          label={record.downtime_category}
                          size="small"
                        />
                      </Box>

                      <Box
                        component="td"
                        sx={{
                          p: 1.5,
                          borderBottom: "1px solid #f0f2f5",
                        }}
                      >
                        {record.duration_minutes ?? "-"} min
                      </Box>

                      <Box
                        component="td"
                        sx={{
                          p: 1.5,
                          borderBottom: "1px solid #f0f2f5",
                        }}
                      >
                        {record.production_units_affected ?? "-"}
                      </Box>

                      <Box
                        component="td"
                        sx={{
                          p: 1.5,
                          borderBottom: "1px solid #f0f2f5",
                        }}
                      >
                        ₹
                        {(
                          record.production_loss || 0
                        ).toLocaleString()}
                      </Box>

                      <Box
                        component="td"
                        sx={{
                          p: 1.5,
                          borderBottom: "1px solid #f0f2f5",
                        }}
                      >
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(record)}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  ))
                )}
              </Box>
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
        maxWidth="md"
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingDowntimeId !== null
            ? "Edit Downtime Record"
            : "Create New Downtime Record"}
        </DialogTitle>

        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {/* INCIDENT ID */}
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Incident ID"
                type="number"
                required
                fullWidth
                value={formData.incident_id}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    incident_id: event.target.value,
                  })
                }
              />
            </Grid>

            {/* MACHINE ID */}
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Machine ID"
                type="number"
                required
                fullWidth
                value={formData.machine_id}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    machine_id: event.target.value,
                  })
                }
              />
            </Grid>

            {/* LINE ID */}
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Line ID"
                type="number"
                required
                fullWidth
                value={formData.line_id}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    line_id: event.target.value,
                  })
                }
              />
            </Grid>

            {/* DOWNTIME REASON */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Downtime Reason"
                required
                fullWidth
                value={formData.downtime_reason}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    downtime_reason: event.target.value,
                  })
                }
              />
            </Grid>

            {/* DOWNTIME CATEGORY */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Downtime Category"
                required
                fullWidth
                value={formData.downtime_category}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    downtime_category: event.target.value,
                  })
                }
              />
            </Grid>

            {/* START TIME */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Start Time"
                type="datetime-local"
                required
                fullWidth
                value={formData.start_time}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    start_time: event.target.value,
                  })
                }
                slotProps={{
  inputLabel: {
    shrink: true,
  },
}}
              />
            </Grid>

            {/* END TIME */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="End Time"
                type="datetime-local"
                fullWidth
                value={formData.end_time}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    end_time: event.target.value,
                  })
                }
               slotProps={{
  inputLabel: {
    shrink: true,
  },
}}
              />
            </Grid>

            {/* DURATION */}
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Duration (Minutes)"
                type="number"
                fullWidth
                value={formData.duration_minutes}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    duration_minutes: event.target.value,
                  })
                }
              />
            </Grid>

            {/* UNITS AFFECTED */}
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Production Units Affected"
                type="number"
                fullWidth
                value={formData.production_units_affected}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    production_units_affected: event.target.value,
                  })
                }
              />
            </Grid>

            {/* PRODUCTION LOSS */}
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Production Loss"
                type="number"
                fullWidth
                value={formData.production_loss}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    production_loss: event.target.value,
                  })
                }
              />
            </Grid>

            {/* IMPACT DESCRIPTION */}
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Impact Description"
                multiline
                rows={3}
                fullWidth
                value={formData.impact_description}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    impact_description: event.target.value,
                  })
                }
              />
            </Grid>

            {/* SAVE MESSAGE */}
            {saveMessage && (
              <Grid size={{ xs: 12 }}>
                <Typography
  component="div"
  color="success.main"
  sx={{ fontWeight: 600 }}
>
  {saveMessage}
</Typography>
              </Grid>
            )}
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
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
            onClick={handleSaveDowntime}
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : editingDowntimeId !== null
              ? "Update Downtime"
              : "Save Downtime"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}