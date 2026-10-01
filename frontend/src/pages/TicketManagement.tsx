import { useEffect, useState } from "react";
import axios from "axios";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import {
  Add,
  Edit,
  Refresh,
  Search,
} from "@mui/icons-material";

const API = "/api";

interface Ticket {
  ticket_id: number;
  incident_id?: number | null;
  assigned_to: number | null;
  assigned_department_id: number | null;
  ticket_type: string;
  priority: string;
  status: string;
  due_date: string | null;
  resolution_summary: string | null;
  created_at?: string;
  updated_at?: string;
}

function TicketManagement() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");

  const [openForm, setOpenForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const [editingTicketId, setEditingTicketId] =
    useState<number | null>(null);

  const [formData, setFormData] = useState({
    incident_id: "",
    assigned_to: "",
    assigned_department_id: "",
    ticket_type: "",
    priority: "HIGH",
    status: "OPEN",
    due_date: "",
    resolution_summary: "",
  });

  const fetchTickets = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        `${API}/tickets/?skip=0&limit=100`
      );

      setTickets(response.data);
    } catch (error) {
      console.error("Error loading tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSaveTicket = async () => {
    try {
      setSaving(true);
      setSaveMessage("");

     const payload = {
  incident_id: Number(formData.incident_id),
  assigned_to: formData.assigned_to
    ? Number(formData.assigned_to)
    : null,

        assigned_department_id:
          formData.assigned_department_id
            ? Number(formData.assigned_department_id)
            : null,

        ticket_type: formData.ticket_type,

        priority: formData.priority,

        status: formData.status,

        due_date: formData.due_date || null,

        resolution_summary:
          formData.resolution_summary || null,
      };

      if (editingTicketId !== null) {
        await axios.put(
          `${API}/tickets/${editingTicketId}`,
          payload
        );

        setSaveMessage("Ticket updated successfully.");
      } else {
        await axios.post(
          `${API}/tickets/`,
          payload
        );

        setSaveMessage("Ticket saved successfully.");
      }

      await fetchTickets();

      setEditingTicketId(null);

setFormData({
  incident_id: "",
  assigned_to: "",
  assigned_department_id: "",
  ticket_type: "",
  priority: "HIGH",
  status: "OPEN",
  due_date: "",
  resolution_summary: "",
});

      setTimeout(() => {
        setOpenForm(false);
        setSaveMessage("");
      }, 1000);

    } catch (error) {
      console.error("Error saving ticket:", error);
      setSaveMessage("Failed to save ticket.");
    } finally {
      setSaving(false);
    }
  };

  const handleEditTicket = (ticket: Ticket) => {
    setEditingTicketId(ticket.ticket_id);

setFormData({
  incident_id: ticket.incident_id
    ? String(ticket.incident_id)
    : "",

  assigned_to: ticket.assigned_to
    ? String(ticket.assigned_to)
    : "",

  assigned_department_id:
    ticket.assigned_department_id
      ? String(ticket.assigned_department_id)
      : "",

  ticket_type: ticket.ticket_type || "",

  priority: ticket.priority || "HIGH",

  status: ticket.status || "OPEN",

  due_date: ticket.due_date
    ? ticket.due_date.slice(0, 16)
    : "",

  resolution_summary:
    ticket.resolution_summary || "",
});
    setSaveMessage("");
    setOpenForm(true);
  };

  const filteredTickets = tickets.filter((ticket) =>
    `${ticket.ticket_id} ${ticket.ticket_type}`
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
            Ticket Management
          </Typography>

          <Typography
            variant="body1"
            sx={{ color: "#667085", mt: 0.5 }}
          >
            Create, monitor and manage support tickets
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            gap: 1,
          }}
        >
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchTickets}
          >
            Refresh
          </Button>

          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              setEditingTicketId(null);
              setSaveMessage("");

setFormData({
  incident_id: "",
  assigned_to: "",
  assigned_department_id: "",
  ticket_type: "",
  priority: "HIGH",
  status: "OPEN",
  due_date: "",
  resolution_summary: "",
});

              setOpenForm(true);
            }}
          >
            New Ticket
          </Button>
        </Box>
      </Box>

      {/* KPI CARDS */}

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
              Total Tickets
            </Typography>

            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                mt: 1,
              }}
            >
              {tickets.length}
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography
              variant="body2"
              color="text.secondary"
            >
              Open Tickets
            </Typography>

            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                mt: 1,
              }}
            >
              {
                tickets.filter(
                  (ticket) =>
                    ticket.status === "OPEN"
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
              sx={{
                fontWeight: 800,
                mt: 1,
              }}
            >
              {
                tickets.filter(
                  (ticket) =>
                    ticket.priority === "HIGH"
                ).length
              }
            </Typography>
          </CardContent>
        </Card>

      </Box>

      {/* TICKET TABLE */}

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
                Ticket Records
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                Tickets retrieved from the MES backend
              </Typography>
            </Box>

            <TextField
              size="small"
              placeholder="Search tickets..."
              value={searchText}
              onChange={(event) =>
                setSearchText(event.target.value)
              }
              slotProps={{
                input: {
                  startAdornment: (
                    <Search sx={{ mr: 1 }} />
                  ),
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
                      <strong>Type</strong>
                    </TableCell>

                    <TableCell>
                      <strong>Assigned To</strong>
                    </TableCell>

                    <TableCell>
                      <strong>Department</strong>
                    </TableCell>

                    <TableCell>
                      <strong>Priority</strong>
                    </TableCell>

                    <TableCell>
                      <strong>Status</strong>
                    </TableCell>

                    <TableCell>
                      <strong>Due Date</strong>
                    </TableCell>

                    <TableCell>
                      <strong>Actions</strong>
                    </TableCell>

                  </TableRow>
                </TableHead>

                <TableBody>

                  {filteredTickets.map((ticket) => (
                    <TableRow
                      key={ticket.ticket_id}
                      hover
                    >

                      <TableCell>
                        #{ticket.ticket_id}
                      </TableCell>

                      <TableCell>
                        <Typography
                          sx={{ fontWeight: 600 }}
                        >
                          {ticket.ticket_type || "—"}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        {ticket.assigned_to
                          ? `User ${ticket.assigned_to}`
                          : "—"}
                      </TableCell>

                      <TableCell>
                        {ticket.assigned_department_id
                          ? `Department ${ticket.assigned_department_id}`
                          : "—"}
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={ticket.priority || "—"}
                          size="small"
                          color={
                            ticket.priority === "HIGH"
                              ? "error"
                              : "default"
                          }
                        />
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={ticket.status || "—"}
                          size="small"
                          color={
                            ticket.status === "OPEN"
                              ? "warning"
                              : "success"
                          }
                        />
                      </TableCell>

                      <TableCell>
                        {ticket.due_date
                          ? new Date(
                              ticket.due_date
                            ).toLocaleString()
                          : "—"}
                      </TableCell>

                      <TableCell>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Edit />}
                          onClick={() =>
                            handleEditTicket(ticket)
                          }
                        >
                          Edit
                        </Button>
                      </TableCell>

                    </TableRow>
                  ))}

                  {filteredTickets.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        align="center"
                        sx={{ py: 6 }}
                      >
                        No tickets found
                      </TableCell>
                    </TableRow>
                  )}

                </TableBody>

              </Table>
            </TableContainer>
          )}

        </CardContent>
      </Card>

      {/* CREATE / EDIT DIALOG */}

      <Dialog
        open={openForm}
        onClose={() => {
          if (!saving) {
            setOpenForm(false);
          }
        }}
        fullWidth
        maxWidth="md"
      >

        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingTicketId !== null
            ? "Edit Ticket"
            : "Create New Ticket"}
        </DialogTitle>

        <DialogContent dividers>

          {saveMessage && (
            <Box
              sx={{
                mb: 2,
                p: 1.5,
                borderRadius: 1,
                backgroundColor:
                  saveMessage.includes(
                    "successfully"
                  )
                    ? "#ecfdf3"
                    : "#fef3f2",
                color:
                  saveMessage.includes(
                    "successfully"
                  )
                    ? "#027a48"
                    : "#b42318",
              }}
            >
              {saveMessage}
            </Box>
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
            <TextField
              label="Assigned User ID"
              type="number"
              fullWidth
              value={formData.assigned_to}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  assigned_to:
                    event.target.value,
                })
              }
            />

            <TextField
              label="Assigned Department ID"
              type="number"
              fullWidth
              value={
                formData.assigned_department_id
              }
              onChange={(event) =>
                setFormData({
                  ...formData,
                  assigned_department_id:
                    event.target.value,
                })
              }
            />

            <TextField
              label="Ticket Type"
              fullWidth
              required
              value={formData.ticket_type}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  ticket_type:
                    event.target.value,
                })
              }
            />

            <TextField
              label="Priority"
              select
              fullWidth
              value={formData.priority}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  priority:
                    event.target.value,
                })
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

            <TextField
              label="Status"
              select
              fullWidth
              value={formData.status}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  status:
                    event.target.value,
                })
              }
            >
              <MenuItem value="OPEN">
                OPEN
              </MenuItem>

              <MenuItem value="IN_PROGRESS">
                IN PROGRESS
              </MenuItem>

              <MenuItem value="CLOSED">
                CLOSED
              </MenuItem>

              <MenuItem value="HOLD">
                HOLD
              </MenuItem>
            </TextField>

            <TextField
              label="Due Date"
              type="datetime-local"
              fullWidth
              value={formData.due_date}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  due_date:
                    event.target.value,
                })
              }
            />

            <TextField
              label="Resolution Summary"
              multiline
              minRows={4}
              fullWidth
              sx={{
                gridColumn: {
                  xs: "1",
                  md: "1 / -1",
                },
              }}
              value={
                formData.resolution_summary
              }
              onChange={(event) =>
                setFormData({
                  ...formData,
                  resolution_summary:
                    event.target.value,
                })
              }
            />

          </Box>

        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 2,
          }}
        >

          <Button
            onClick={() =>
              setOpenForm(false)
            }
            disabled={saving}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleSaveTicket}
            disabled={
              saving ||
              !formData.ticket_type
            }
          >
            {saving
              ? "Saving..."
              : editingTicketId !== null
              ? "Update Ticket"
              : "Save Ticket"}
          </Button>

        </DialogActions>

      </Dialog>

    </Box>
  );
}

export default TicketManagement;