import { useEffect, useRef, useState } from "react";
import axios from "axios";

import type { Classification } from "../api/ml";
import IncidentSuggestions from "../components/ml/IncidentSuggestions";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Alert,
} from "@mui/material";

import {
  Add,
  Refresh,
  Search,
} from "@mui/icons-material";

interface Incident {
  incident_id: number;
  incident_title: string;
  incident_description: string;
  issue_category_id: number | null;
  machine_id: number | null;
  reported_by: number | null;
  priority: string;
  status: string;
  occurrence_time: string;
  reported_time: string | null;
  production_impact: string | null;
  safety_impact: string | null;
  created_at: string;
  updated_at: string;
}

interface IssueCategory {
  category_id: number;
  category_name: string;
}

type AiField = "priority" | "issue_category_id";

const API = "/api";

function IncidentTickets() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");

  const [openForm, setOpenForm] = useState(false);
const [saving, setSaving] = useState(false);
const [saveMessage, setSaveMessage] = useState("");
const [editingIncidentId, setEditingIncidentId] = useState<number | null>(null);
const [categories, setCategories] = useState<IssueCategory[]>([]);
const [aiFilled, setAiFilled] = useState<Partial<Record<AiField, boolean>>>({});
const [categoryHint, setCategoryHint] = useState("");
// Fields the user changed by hand: AI auto-fill never overwrites these.
const touchedRef = useRef<Set<AiField>>(new Set());
const [formData, setFormData] = useState({
  incident_title: "",
  incident_description: "",
  issue_category_id: "",
  machine_id: "",
  reported_by: "",
  priority: "HIGH",
  status: "OPEN",
  occurrence_time: "",
  reported_time: "",
  production_impact: "",
  safety_impact: "",
});

  const fetchIncidents = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        `${API}/incidents/?skip=0&limit=100`
      );

      setIncidents(response.data);
    } catch (error) {
      console.error("Error loading incidents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveIncident = async () => {
  try {
    setSaving(true);
    setSaveMessage("");

    const payload = {
      incident_title: formData.incident_title,
      incident_description: formData.incident_description,
      issue_category_id: formData.issue_category_id
        ? Number(formData.issue_category_id)
        : null,
      machine_id: formData.machine_id
        ? Number(formData.machine_id)
        : null,
      reported_by: formData.reported_by
        ? Number(formData.reported_by)
        : null,
      priority: formData.priority,
      status: formData.status,
      occurrence_time: formData.occurrence_time,
      reported_time: formData.reported_time || null,
      production_impact: formData.production_impact || null,
      safety_impact: formData.safety_impact || null,
    };

    if (editingIncidentId !== null) {
  await axios.put(
    `${API}/incidents/${editingIncidentId}`,
    payload
  );
} else {
  await axios.post(`${API}/incidents/`, payload);
}

    setSaveMessage(
  editingIncidentId !== null
    ? "Incident updated successfully."
    : "Incident saved successfully."
);

    setFormData({
      incident_title: "",
      incident_description: "",
      issue_category_id: "",
      machine_id: "",
      reported_by: "",
      priority: "HIGH",
      status: "OPEN",
      occurrence_time: "",
      reported_time: "",
      production_impact: "",
      safety_impact: "",
    });

    await fetchIncidents();
    setEditingIncidentId(null);

    setTimeout(() => {
      setOpenForm(false);
      setSaveMessage("");
    }, 1000);

  } catch (error) {
    console.error("Error saving incident:", error);
    setSaveMessage("Failed to save incident.");
  } finally {
    setSaving(false);
  }
};

  useEffect(() => {
    fetchIncidents();
    axios
      .get<IssueCategory[]>(`${API}/issue-categories/?skip=0&limit=100`)
      .then((response) => setCategories(response.data))
      .catch((error) => console.error("Error loading issue categories:", error));
  }, []);

  const openNewIncident = () => {
    touchedRef.current = new Set();
    setAiFilled({});
    setCategoryHint("");
    setOpenForm(true);
  };

  const applyPriority = (label: string, fromAutoFill = false) => {
    setFormData((prev) => ({ ...prev, priority: label.toUpperCase() }));
    setAiFilled((prev) => ({ ...prev, priority: true }));
    if (!fromAutoFill) touchedRef.current.add("priority");
  };

  const applyCategory = (label: string, fromAutoFill = false) => {
    const match = categories.find(
      (c) => c.category_name.toLowerCase() === label.toLowerCase()
    );
    if (!match) {
      setCategoryHint(`AI suggests "${label}", but no issue category with that name exists yet.`);
      return;
    }
    setFormData((prev) => ({ ...prev, issue_category_id: String(match.category_id) }));
    setAiFilled((prev) => ({ ...prev, issue_category_id: true }));
    setCategoryHint("");
    if (!fromAutoFill) touchedRef.current.add("issue_category_id");
  };

  // New incidents: fill AI predictions into fields the user hasn't edited yet.
  const handlePrediction = (classification: Classification) => {
    if (editingIncidentId !== null) return;
    if (!touchedRef.current.has("priority")) {
      applyPriority(classification.priority.label, true);
    }
    if (!touchedRef.current.has("issue_category_id")) {
      applyCategory(classification.category.label, true);
    }
  };

  const markTouched = (field: AiField) => {
    touchedRef.current.add(field);
    setAiFilled((prev) => ({ ...prev, [field]: false }));
  };

  const filteredIncidents = incidents.filter((incident) =>
    incident.incident_title
      .toLowerCase()
      .includes(searchText.toLowerCase())
  );

  return (
    <Box>

      {/* PAGE HEADER */}

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{ fontWeight: 800 }}
          >
            Incident & Ticket Management
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: "#667085",
              mt: 0.5,
            }}
          >
            Monitor and manage manufacturing incidents
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchIncidents}
          >
            Refresh
          </Button>

        <Button
  variant="contained"
  startIcon={<Add />}
  onClick={openNewIncident}
>
  New Incident
</Button>
        </Box>
      </Box>

      {/* SUMMARY */}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(3, 1fr)",
          },
          gap: 2,
          mb: 3,
        }}
      >
        <Card>
          <CardContent>
            <Typography
              variant="body2"
              color="text.secondary"
            >
              Total Incidents
            </Typography>

            <Typography
              variant="h4"
              sx={{ fontWeight: 800, mt: 1 }}
            >
              {incidents.length}
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography
              variant="body2"
              color="text.secondary"
            >
              Open Incidents
            </Typography>

            <Typography
              variant="h4"
              sx={{ fontWeight: 800, mt: 1 }}
            >
              {
                incidents.filter(
                  (incident) => incident.status === "OPEN"
                ).length
              }
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography
              variant="body2"
              color="text.secondary"
            >
              High Priority
            </Typography>

            <Typography
              variant="h4"
              sx={{ fontWeight: 800, mt: 1 }}
            >
              {
                incidents.filter(
                  (incident) => incident.priority === "HIGH"
                ).length
              }
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* INCIDENT TABLE */}

      <Card>
        <CardContent>

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Box>
              <Typography
                variant="h6"
                sx={{ fontWeight: 700 }}
              >
                Incident Records
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                Incidents retrieved from the MES backend
              </Typography>
            </Box>

            <TextField
              size="small"
              placeholder="Search by title..."
              value={searchText}
              onChange={(event) =>
                setSearchText(event.target.value)
              }
              slotProps={{
                input: {
                  startAdornment: <Search sx={{ mr: 1 }} />,
                },
              }}
            />
          </Box>

          <Divider sx={{ mb: 2 }} />

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
          ) : (
            <TableContainer
              component={Paper}
              elevation={0}
              sx={{
                border: "1px solid #e7ebf2",
                borderRadius: 2,
              }}
            >
              <Table>

                <TableHead>
                  <TableRow>
                    <TableCell>
                      <strong>ID</strong>
                    </TableCell>

                    <TableCell>
                      <strong>Incident</strong>
                    </TableCell>

                    <TableCell>
                      <strong>Machine</strong>
                    </TableCell>

                    <TableCell>
                      <strong>Priority</strong>
                    </TableCell>

                    <TableCell>
                      <strong>Status</strong>
                    </TableCell>

                    <TableCell>
                      <strong>Occurrence</strong>
                    </TableCell>
                    <TableCell>
  <strong>Actions</strong>
</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>

                  {filteredIncidents.map((incident) => (
                    <TableRow
                      key={incident.incident_id}
                      hover
                    >
                      <TableCell>
                        #{incident.incident_id}
                      </TableCell>

                      <TableCell>
                        <Typography
                          sx={{ fontWeight: 600 }}
                        >
                          {incident.incident_title}
                        </Typography>

                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          {incident.incident_description}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        {incident.machine_id
                          ? `Machine ${incident.machine_id}`
                          : "—"}
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={incident.priority}
                          size="small"
                          color={
                            incident.priority === "HIGH"
                              ? "error"
                              : "default"
                          }
                        />
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={incident.status}
                          size="small"
                          color={
                            incident.status === "OPEN"
                              ? "warning"
                              : "success"
                          }
                        />
                      </TableCell>

                      <TableCell>
                        {new Date(
                          incident.occurrence_time
                        ).toLocaleString()}
                      </TableCell>
                      <TableCell>
  <Button
    variant="outlined"
    size="small"
    onClick={() => {
      setEditingIncidentId(incident.incident_id);
      setAiFilled({});
      setCategoryHint("");

      setFormData({
        incident_title: incident.incident_title,
        incident_description: incident.incident_description || "",
        issue_category_id: incident.issue_category_id
          ? String(incident.issue_category_id)
          : "",
        machine_id: incident.machine_id
          ? String(incident.machine_id)
          : "",
        reported_by: incident.reported_by
          ? String(incident.reported_by)
          : "",
        priority: incident.priority,
        status: incident.status,
        occurrence_time: incident.occurrence_time
          ? incident.occurrence_time.slice(0, 16)
          : "",
        reported_time: incident.reported_time
          ? incident.reported_time.slice(0, 16)
          : "",
        production_impact: incident.production_impact || "",
        safety_impact: incident.safety_impact || "",
      });

      setOpenForm(true);
    }}
  >
    Edit
  </Button>
</TableCell>
                    </TableRow>
                  ))}

                  {filteredIncidents.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        align="center"
                        sx={{ py: 6 }}
                      >
                        No incidents found
                      </TableCell>
                    </TableRow>
                  )}

                </TableBody>

              </Table>
            </TableContainer>
          )}

        </CardContent>
      </Card>
      
    <Dialog
      open={openForm}
      onClose={() => setOpenForm(false)}
      fullWidth
      maxWidth="lg"
    >
   <DialogTitle sx={{ fontWeight: 700 }}>
  {editingIncidentId !== null
    ? "Edit Incident"
    : "Create New Incident"}
</DialogTitle>

      <DialogContent dividers>

        {saveMessage && (
          <Alert
            severity={
              saveMessage.includes("successfully")
                ? "success"
                : "error"
            }
            sx={{ mb: 2 }}
          >
            {saveMessage}
          </Alert>
        )}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "1fr 1fr",
            },
            gap: 2,
            mt: 1,
          }}
        >
          <TextField
            label="Incident Title"
            required
            fullWidth
            value={formData.incident_title}
            onChange={(event) =>
              setFormData({
                ...formData,
                incident_title: event.target.value,
              })
            }
          />

          <TextField
            label="Priority"
            select
            fullWidth
            value={formData.priority}
            helperText={aiFilled.priority ? "Filled by AI - change if needed" : undefined}
            onChange={(event) => {
              markTouched("priority");
              setFormData({
                ...formData,
                priority: event.target.value,
              });
            }}
          >
            <MenuItem value="LOW">LOW</MenuItem>
            <MenuItem value="MEDIUM">MEDIUM</MenuItem>
            <MenuItem value="HIGH">HIGH</MenuItem>
            <MenuItem value="CRITICAL">CRITICAL</MenuItem>
          </TextField>

          <TextField
            label="Machine ID"
            type="number"
            fullWidth
            value={formData.machine_id}
            onChange={(event) =>
              setFormData({
                ...formData,
                machine_id: event.target.value,
              })
            }
          />

          <TextField
            label="Issue Category ID"
            type="number"
            fullWidth
            value={formData.issue_category_id}
            helperText={
              categoryHint ||
              (aiFilled.issue_category_id
                ? `Filled by AI: ${
                    categories.find(
                      (c) => String(c.category_id) === formData.issue_category_id
                    )?.category_name ?? ""
                  }`
                : undefined)
            }
            onChange={(event) => {
              markTouched("issue_category_id");
              setFormData({
                ...formData,
                issue_category_id: event.target.value,
              });
            }}
          />

          <TextField
            label="Reported By (User ID)"
            type="number"
            fullWidth
            value={formData.reported_by}
            onChange={(event) =>
              setFormData({
                ...formData,
                reported_by: event.target.value,
              })
            }
          />

          <TextField
            label="Status"
            select
            fullWidth
            value={formData.status}
            onChange={(event) =>
              setFormData({
                ...formData,
                status: event.target.value,
              })
            }
          >
            <MenuItem value="OPEN">OPEN</MenuItem>
            <MenuItem value="CLOSED">CLOSED</MenuItem>
            <MenuItem value="IN_PROGRESS">
              IN PROGRESS
            </MenuItem>
          </TextField>

<TextField
  label="Occurrence Time"
  type="datetime-local"
  required
  fullWidth
  value={formData.occurrence_time}
  onChange={(event) =>
    setFormData({
      ...formData,
      occurrence_time: event.target.value,
    })
  }
/>

<TextField
  label="Reported Time"
  type="datetime-local"
  fullWidth
  value={formData.reported_time}
  onChange={(event) =>
    setFormData({
      ...formData,
      reported_time: event.target.value,
    })
  }
/>

          <TextField
            label="Incident Description"
            multiline
            minRows={3}
            fullWidth
            sx={{ gridColumn: { md: "1 / -1" } }}
            value={formData.incident_description}
            onChange={(event) =>
              setFormData({
                ...formData,
                incident_description: event.target.value,
              })
            }
          />

          <TextField
            label="Production Impact"
            multiline
            minRows={2}
            fullWidth
            value={formData.production_impact}
            onChange={(event) =>
              setFormData({
                ...formData,
                production_impact: event.target.value,
              })
            }
          />

          <TextField
            label="Safety Impact"
            multiline
            minRows={2}
            fullWidth
            value={formData.safety_impact}
            onChange={(event) =>
              setFormData({
                ...formData,
                safety_impact: event.target.value,
              })
            }
          />
        </Box>

        <Box sx={{ mt: 2 }}>
          <IncidentSuggestions
            title={formData.incident_title}
            description={formData.incident_description}
            onPrediction={handlePrediction}
            onApplyCategory={(label) => applyCategory(label)}
            onApplyPriority={(label) => applyPriority(label)}
          />
        </Box>

      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          onClick={() => setOpenForm(false)}
          disabled={saving}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={handleSaveIncident}
          disabled={
            saving ||
            !formData.incident_title ||
            !formData.occurrence_time
          }
        >
         {saving
  ? "Saving..."
  : editingIncidentId !== null
  ? "Update Incident"
  : "Save Incident"}
        </Button>
      </DialogActions>
    </Dialog>

    </Box>
  );
}

export default IncidentTickets;