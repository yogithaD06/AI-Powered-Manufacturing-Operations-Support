import { useEffect, useMemo, useState } from "react";
import axios from "axios";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import {
  Add,
  CheckCircleOutlined,
  EditOutlined,
  NotificationsActiveOutlined,
  NotificationsNoneOutlined,
  RefreshOutlined,
  SearchOutlined,
  WarningAmberOutlined,
  MarkEmailReadOutlined,
} from "@mui/icons-material";

const API = "/api";

interface Notification {
  notification_id: number;
  user_id: number | null;
  incident_id: number | null;
  notification_type: string;
  message: string;
  priority: string;
  is_read: boolean;
  created_at: string | null;
}

interface NotificationForm {
  user_id: string;
  incident_id: string;
  notification_type: string;
  message: string;
  priority: string;
  is_read: boolean;
}

const emptyForm: NotificationForm = {
  user_id: "",
  incident_id: "",
  notification_type: "INCIDENT_UPDATE",
  message: "",
  priority: "MEDIUM",
  is_read: false,
};

const priorityOptions = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

const notificationTypes = [
  "INCIDENT_UPDATE",
  "INCIDENT_ALERT",
  "SLA_BREACH",
  "DOWNTIME_ALERT",
  "CAPA_OVERDUE",
  "ESCALATION",
  "RESOLUTION_COMPLETED",
  "SYSTEM_ALERT",
];

const getPriorityColor = (
  priority: string
): "default" | "success" | "warning" | "error" => {
  switch (priority?.toUpperCase()) {
    case "CRITICAL":
      return "error";
    case "HIGH":
      return "warning";
    case "MEDIUM":
      return "warning";
    case "LOW":
      return "success";
    default:
      return "default";
  }
};

const formatDate = (value: string | null) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString();
};

export default function NotificationsAlerts() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [readFilter, setReadFilter] = useState("ALL");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<NotificationForm>(emptyForm);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  const showMessage = (
    message: string,
    severity: "success" | "error" = "success"
  ) => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);

      const response = await axios.get<Notification[]>(
        `${API}/notifications/?skip=0&limit=100`
      );

      setNotifications(response.data);
    } catch (error) {
      console.error(error);
      showMessage("Failed to load notifications.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const filteredNotifications = useMemo(() => {
    const query = search.trim().toLowerCase();

    return notifications.filter((notification) => {
      const matchesSearch =
        !query ||
        notification.message?.toLowerCase().includes(query) ||
        notification.notification_type?.toLowerCase().includes(query) ||
        String(notification.notification_id).includes(query) ||
        String(notification.incident_id ?? "").includes(query) ||
        String(notification.user_id ?? "").includes(query);

      const matchesPriority =
        priorityFilter === "ALL" ||
        notification.priority?.toUpperCase() === priorityFilter;

      const matchesRead =
        readFilter === "ALL" ||
        (readFilter === "READ" && notification.is_read) ||
        (readFilter === "UNREAD" && !notification.is_read);

      return matchesSearch && matchesPriority && matchesRead;
    });
  }, [notifications, search, priorityFilter, readFilter]);

  const totalNotifications = notifications.length;

  const unreadNotifications = notifications.filter(
    (notification) => !notification.is_read
  ).length;

  const highPriorityNotifications = notifications.filter(
    (notification) =>
      notification.priority?.toUpperCase() === "HIGH" ||
      notification.priority?.toUpperCase() === "CRITICAL"
  ).length;

  const readNotifications = notifications.filter(
    (notification) => notification.is_read
  ).length;

  const openCreateDialog = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEditDialog = (notification: Notification) => {
    setEditingId(notification.notification_id);

    setForm({
      user_id:
        notification.user_id !== null ? String(notification.user_id) : "",
      incident_id:
        notification.incident_id !== null
          ? String(notification.incident_id)
          : "",
      notification_type: notification.notification_type || "INCIDENT_UPDATE",
      message: notification.message || "",
      priority: notification.priority || "MEDIUM",
      is_read: notification.is_read,
    });

    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleChange = (
    field: keyof NotificationForm,
    value: string | boolean
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const saveNotification = async () => {
    try {
      if (!form.message.trim()) {
        showMessage("Notification message is required.", "error");
        return;
      }

      if (!form.user_id.trim()) {
        showMessage("User ID is required.", "error");
        return;
      }

      if (!form.incident_id.trim()) {
        showMessage("Incident ID is required.", "error");
        return;
      }

      const payload = {
        user_id: Number(form.user_id),
        incident_id: Number(form.incident_id),
        notification_type: form.notification_type,
        message: form.message.trim(),
        priority: form.priority,
        is_read: form.is_read,
      };

      if (editingId !== null) {
        await axios.put(
          `${API}/notifications/${editingId}`,
          {
            notification_type: form.notification_type,
            message: form.message.trim(),
            priority: form.priority,
            is_read: form.is_read,
          }
        );

        showMessage("Notification updated successfully.");
      } else {
        await axios.post(`${API}/notifications/`, payload);

        showMessage("Notification created successfully.");
      }

      closeDialog();
      await fetchNotifications();
    } catch (error) {
      console.error(error);
      showMessage("Failed to save notification.", "error");
    }
  };

  const toggleReadStatus = async (notification: Notification) => {
    try {
      await axios.put(
        `${API}/notifications/${notification.notification_id}`,
        {
          notification_type: notification.notification_type,
          message: notification.message,
          priority: notification.priority,
          is_read: !notification.is_read,
        }
      );

      showMessage(
        notification.is_read
          ? "Notification marked as unread."
          : "Notification marked as read."
      );

      await fetchNotifications();
    } catch (error) {
      console.error(error);
      showMessage("Failed to update notification status.", "error");
    }
  };

  return (
    <Box>
      {/* HEADER */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", md: "center" },
          gap: 2,
          flexDirection: { xs: "column", md: "row" },
          mb: 3,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: "#172033",
              mb: 0.5,
            }}
          >
            Notifications & Alerts
          </Typography>

          <Typography variant="body2" sx={{ color: "#667085" }}>
            Monitor incident notifications, operational alerts and notification
            status.
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Refresh notifications">
            <IconButton
              onClick={fetchNotifications}
              disabled={loading}
              sx={{
                border: "1px solid #d9dee8",
                borderRadius: 2,
              }}
            >
              <RefreshOutlined />
            </IconButton>
          </Tooltip>

          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={openCreateDialog}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 700,
              px: 2,
            }}
          >
            New Notification
          </Button>
        </Box>
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
                <Box>
                  <Typography variant="body2" sx={{ color: "#667085" }}>
                    Total Notifications
                  </Typography>

                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 700, mt: 0.5 }}
                  >
                    {totalNotifications}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    width: 46,
                    height: 46,
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "#eef4ff",
                    color: "#3b5ccc",
                  }}
                >
                  <NotificationsActiveOutlined />
                </Box>
              </Box>
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
                <Box>
                  <Typography variant="body2" sx={{ color: "#667085" }}>
                    Unread
                  </Typography>

                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 700, mt: 0.5 }}
                  >
                    {unreadNotifications}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    width: 46,
                    height: 46,
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "#fff4e5",
                    color: "#b76e00",
                  }}
                >
                  <NotificationsNoneOutlined />
                </Box>
              </Box>
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
                <Box>
                  <Typography variant="body2" sx={{ color: "#667085" }}>
                    High / Critical
                  </Typography>

                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 700, mt: 0.5 }}
                  >
                    {highPriorityNotifications}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    width: 46,
                    height: 46,
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "#fff0f0",
                    color: "#d14343",
                  }}
                >
                  <WarningAmberOutlined />
                </Box>
              </Box>
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
                <Box>
                  <Typography variant="body2" sx={{ color: "#667085" }}>
                    Read
                  </Typography>

                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 700, mt: 0.5 }}
                  >
                    {readNotifications}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    width: 46,
                    height: 46,
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "#edf9f1",
                    color: "#27844a",
                  }}
                >
                  <CheckCircleOutlined />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* FILTERS */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} sx={{ alignItems: "center" }}>
            <Grid size={{ xs: 12, md: 5 }}>
              <TextField
                fullWidth
                size="small"
                label="Search notifications"
                placeholder="Search message, type, incident or user..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <SearchOutlined
                        sx={{ color: "#98a2b3", mr: 1 }}
                      />
                    ),
                  },
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                select
                size="small"
                label="Priority"
                value={priorityFilter}
                onChange={(event) =>
                  setPriorityFilter(event.target.value)
                }
              >
                <MenuItem value="ALL">All priorities</MenuItem>

                {priorityOptions.map((priority) => (
                  <MenuItem key={priority} value={priority}>
                    {priority}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                select
                size="small"
                label="Read status"
                value={readFilter}
                onChange={(event) => setReadFilter(event.target.value)}
              >
                <MenuItem value="ALL">All notifications</MenuItem>
                <MenuItem value="UNREAD">Unread</MenuItem>
                <MenuItem value="READ">Read</MenuItem>
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, md: 1 }}>
              <Typography
                variant="body2"
                sx={{
                  color: "#667085",
                  textAlign: { xs: "left", md: "center" },
                }}
              >
                {filteredNotifications.length} shown
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* TABLE */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 2.5, pb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Notification Center
            </Typography>

            <Typography variant="body2" sx={{ color: "#667085", mt: 0.4 }}>
              System-generated and operational notifications from the backend.
            </Typography>
          </Box>

          <Divider />

          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>
                    Notification
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Incident</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Priority</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Created</TableCell>
                  <TableCell
                    align="right"
                    sx={{ fontWeight: 700 }}
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {filteredNotifications.map((notification) => (
                  <TableRow
                    key={notification.notification_id}
                    hover
                    sx={{
                      backgroundColor: notification.is_read
                        ? "transparent"
                        : "#f8fbff",
                    }}
                  >
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 700 }}
                      >
                        #{notification.notification_id}
                      </Typography>
                    </TableCell>

                    <TableCell sx={{ minWidth: 300 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: notification.is_read ? 500 : 700,
                          color: "#172033",
                        }}
                      >
                        {notification.notification_type}
                      </Typography>

                      <Typography
                        variant="body2"
                        sx={{
                          color: "#667085",
                          mt: 0.4,
                        }}
                      >
                        {notification.message}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      {notification.incident_id !== null
                        ? `INC-${notification.incident_id}`
                        : "—"}
                    </TableCell>

                    <TableCell>
                      {notification.user_id ?? "—"}
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={notification.priority || "—"}
                        color={getPriorityColor(notification.priority)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>

                    <TableCell>
                      <Chip
                        icon={
                          notification.is_read ? (
                            <MarkEmailReadOutlined />
                          ) : (
                            <NotificationsNoneOutlined />
                          )
                        }
                        label={notification.is_read ? "Read" : "Unread"}
                        size="small"
                        color={notification.is_read ? "success" : "warning"}
                        variant={notification.is_read ? "outlined" : "filled"}
                      />
                    </TableCell>

                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      <Typography variant="body2" sx={{ color: "#667085" }}>
                        {formatDate(notification.created_at)}
                      </Typography>
                    </TableCell>

                    <TableCell align="right">
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "flex-end",
                          gap: 0.5,
                        }}
                      >
                        <Tooltip
                          title={
                            notification.is_read
                              ? "Mark as unread"
                              : "Mark as read"
                          }
                        >
                          <IconButton
                            size="small"
                            onClick={() =>
                              toggleReadStatus(notification)
                            }
                          >
                            {notification.is_read ? (
                              <NotificationsNoneOutlined fontSize="small" />
                            ) : (
                              <MarkEmailReadOutlined fontSize="small" />
                            )}
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Edit notification">
                          <IconButton
                            size="small"
                            onClick={() =>
                              openEditDialog(notification)
                            }
                          >
                            <EditOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}

                {filteredNotifications.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <Box
                        sx={{
                          py: 7,
                          textAlign: "center",
                        }}
                      >
                        <NotificationsNoneOutlined
                          sx={{
                            fontSize: 46,
                            color: "#98a2b3",
                            mb: 1,
                          }}
                        />

                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 700 }}
                        >
                          No notifications found
                        </Typography>

                        <Typography
                          variant="body2"
                          sx={{
                            color: "#667085",
                            mt: 0.5,
                          }}
                        >
                          Try changing your filters or create a new
                          notification.
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* CREATE / EDIT DIALOG */}
      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingId !== null
            ? "Edit Notification"
            : "Create Notification"}
        </DialogTitle>

        <DialogContent dividers>
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="User ID"
                type="number"
                value={form.user_id}
                onChange={(event) =>
                  handleChange("user_id", event.target.value)
                }
                helperText="Backend user_id"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Incident ID"
                type="number"
                value={form.incident_id}
                onChange={(event) =>
                  handleChange("incident_id", event.target.value)
                }
                helperText="Backend incident_id"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                select
                label="Notification Type"
                value={form.notification_type}
                onChange={(event) =>
                  handleChange("notification_type", event.target.value)
                }
              >
                {notificationTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                select
                label="Priority"
                value={form.priority}
                onChange={(event) =>
                  handleChange("priority", event.target.value)
                }
              >
                {priorityOptions.map((priority) => (
                  <MenuItem key={priority} value={priority}>
                    {priority}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                minRows={4}
                label="Notification Message"
                placeholder="Enter notification message..."
                value={form.message}
                onChange={(event) =>
                  handleChange("message", event.target.value)
                }
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                select
                label="Read Status"
                value={form.is_read ? "READ" : "UNREAD"}
                onChange={(event) =>
                  handleChange(
                    "is_read",
                    event.target.value === "READ"
                  )
                }
              >
                <MenuItem value="UNREAD">Unread</MenuItem>
                <MenuItem value="READ">Read</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={closeDialog}
            sx={{
              textTransform: "none",
              color: "#667085",
            }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={saveNotification}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              px: 2.5,
            }}
          >
            {editingId !== null ? "Save Changes" : "Create Notification"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* SNACKBAR */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={() =>
          setSnackbar((previous) => ({
            ...previous,
            open: false,
          }))
        }
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() =>
            setSnackbar((previous) => ({
              ...previous,
              open: false,
            }))
          }
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}