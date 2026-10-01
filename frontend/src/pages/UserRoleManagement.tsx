import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Alert,
  Avatar,
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
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
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
  AdminPanelSettings,
  Business,
  CheckCircleOutlined,
  Edit,
  Groups,
  KeyOutlined,
  PersonAddAlt1,
  People,
  Search,
  ShieldOutlined,
  SupervisorAccount,
  WorkOutlined,
} from "@mui/icons-material";

const API = "/api";

interface Role {
  role_id: number;
  role_name: string;
  role_description: string | null;
  permissions: string | null;
  created_at?: string;
}

interface User {
  user_id: number;
  employee_id: string;
  full_name: string;
  email: string;
  role_id: number | null;
  department_id: number | null;
  status: string;
  created_at?: string;
}

interface Department {
  department_id: number;
  department_name: string;
  description?: string | null;
  location?: string | null;
  status?: string;
}

interface RoleForm {
  role_name: string;
  role_description: string;
  permissions: string;
}

interface UserForm {
  employee_id: string;
  full_name: string;
  email: string;
  role_id: string;
  department_id: string;
  status: string;
  password: string;
}

const emptyRoleForm: RoleForm = {
  role_name: "",
  role_description: "",
  permissions: "",
};

const emptyUserForm: UserForm = {
  employee_id: "",
  full_name: "",
  email: "",
  role_id: "",
  department_id: "",
  status: "ACTIVE",
  password: "",
};

const statusOptions = ["ACTIVE", "INACTIVE"];

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0]?.slice(0, 2).toUpperCase() || "U";
  }

  return `${parts[0]?.[0] || ""}${parts[parts.length - 1]?.[0] || ""}`.toUpperCase();
};

const formatDate = (value?: string) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function UserRoleManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [loadingDepartments, setLoadingDepartments] = useState(true);

  const [userSearch, setUserSearch] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState("ALL");
  const [roleSearch, setRoleSearch] = useState("");

  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const [userForm, setUserForm] = useState<UserForm>(emptyUserForm);
  const [roleForm, setRoleForm] = useState<RoleForm>(emptyRoleForm);

  const [savingUser, setSavingUser] = useState(false);
  const [savingRole, setSavingRole] = useState(false);

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

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);

      const response = await axios.get(
        `${API}/users/?skip=0&limit=100`
      );

      setUsers(response.data || []);
    } catch (error) {
      console.error(error);
      showMessage("Unable to load users.", "error");
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadRoles = async () => {
    try {
      setLoadingRoles(true);

      const response = await axios.get(
        `${API}/roles/?skip=0&limit=100`
      );

      setRoles(response.data || []);
    } catch (error) {
      console.error(error);
      showMessage("Unable to load roles.", "error");
    } finally {
      setLoadingRoles(false);
    }
  };

  const loadDepartments = async () => {
    try {
      setLoadingDepartments(true);

      const response = await axios.get(
        `${API}/departments/?skip=0&limit=100`
      );

      setDepartments(response.data || []);
    } catch (error) {
      console.error(error);
      showMessage("Unable to load departments.", "error");
    } finally {
      setLoadingDepartments(false);
    }
  };

  useEffect(() => {
    loadUsers();
    loadRoles();
    loadDepartments();
  }, []);

  const roleMap = useMemo(() => {
    return new Map(
      roles.map((role) => [role.role_id, role.role_name])
    );
  }, [roles]);

  const departmentMap = useMemo(() => {
    return new Map(
      departments.map((department) => [
        department.department_id,
        department.department_name,
      ])
    );
  }, [departments]);

  const filteredUsers = useMemo(() => {
    const search = userSearch.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !search ||
        user.full_name.toLowerCase().includes(search) ||
        user.employee_id.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search) ||
        (roleMap.get(user.role_id || -1) || "")
          .toLowerCase()
          .includes(search) ||
        (departmentMap.get(user.department_id || -1) || "")
          .toLowerCase()
          .includes(search);

      const matchesStatus =
        userStatusFilter === "ALL" ||
        user.status === userStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [
    users,
    userSearch,
    userStatusFilter,
    roleMap,
    departmentMap,
  ]);

  const filteredRoles = useMemo(() => {
    const search = roleSearch.trim().toLowerCase();

    return roles.filter((role) => {
      return (
        !search ||
        role.role_name.toLowerCase().includes(search) ||
        (role.role_description || "").toLowerCase().includes(search) ||
        (role.permissions || "").toLowerCase().includes(search)
      );
    });
  }, [roles, roleSearch]);

  const activeUsers = users.filter(
    (user) => user.status === "ACTIVE"
  ).length;

  const inactiveUsers = users.filter(
    (user) => user.status !== "ACTIVE"
  ).length;

  const departmentsUsed = new Set(
    users
      .map((user) => user.department_id)
      .filter((id): id is number => id !== null)
  ).size;

  const openCreateUser = () => {
    setEditingUser(null);
    setUserForm(emptyUserForm);
    setUserDialogOpen(true);
  };

  const openEditUser = (user: User) => {
    setEditingUser(user);

    setUserForm({
      employee_id: user.employee_id,
      full_name: user.full_name,
      email: user.email,
      role_id: user.role_id?.toString() || "",
      department_id: user.department_id?.toString() || "",
      status: user.status,
      password: "",
    });

    setUserDialogOpen(true);
  };

  const closeUserDialog = () => {
    if (savingUser) return;

    setUserDialogOpen(false);
    setEditingUser(null);
    setUserForm(emptyUserForm);
  };

  const openCreateRole = () => {
    setEditingRole(null);
    setRoleForm(emptyRoleForm);
    setRoleDialogOpen(true);
  };

  const openEditRole = (role: Role) => {
    setEditingRole(role);

    setRoleForm({
      role_name: role.role_name,
      role_description: role.role_description || "",
      permissions: role.permissions || "",
    });

    setRoleDialogOpen(true);
  };

  const closeRoleDialog = () => {
    if (savingRole) return;

    setRoleDialogOpen(false);
    setEditingRole(null);
    setRoleForm(emptyRoleForm);
  };

  const handleUserSubmit = async () => {
    if (
      !userForm.employee_id.trim() ||
      !userForm.full_name.trim() ||
      !userForm.email.trim() ||
      !userForm.role_id ||
      !userForm.department_id
    ) {
      showMessage(
        "Please complete all required user fields.",
        "error"
      );
      return;
    }

    try {
      setSavingUser(true);

      if (editingUser) {
        await axios.put(
          `${API}/users/${editingUser.user_id}`,
          {
            full_name: userForm.full_name,
            email: userForm.email,
            role_id: Number(userForm.role_id),
            department_id: Number(userForm.department_id),
            status: userForm.status,
            password: userForm.password || "",
          }
        );

        showMessage("User profile updated successfully.");
      } else {
        if (!userForm.password.trim()) {
          showMessage(
            "Password is required when creating a user.",
            "error"
          );
          return;
        }

        await axios.post(`${API}/users/`, {
          employee_id: userForm.employee_id,
          full_name: userForm.full_name,
          email: userForm.email,
          role_id: Number(userForm.role_id),
          department_id: Number(userForm.department_id),
          status: userForm.status,
          password: userForm.password,
        });

        showMessage("User created successfully.");
      }

      closeUserDialog();
      await loadUsers();
    } catch (error) {
      console.error(error);
      showMessage(
        "Unable to save the user. Please check the entered details.",
        "error"
      );
    } finally {
      setSavingUser(false);
    }
  };

  const handleRoleSubmit = async () => {
    if (!roleForm.role_name.trim()) {
      showMessage("Role name is required.", "error");
      return;
    }

    try {
      setSavingRole(true);

      if (editingRole) {
        await axios.put(
          `${API}/roles/${editingRole.role_id}`,
          {
            role_name: roleForm.role_name,
            role_description: roleForm.role_description,
            permissions: roleForm.permissions,
          }
        );

        showMessage("Role updated successfully.");
      } else {
        await axios.post(`${API}/roles/`, {
          role_name: roleForm.role_name,
          role_description: roleForm.role_description,
          permissions: roleForm.permissions,
        });

        showMessage("Role created successfully.");
      }

      closeRoleDialog();
      await loadRoles();
    } catch (error) {
      console.error(error);
      showMessage(
        "Unable to save the role. Please check the entered details.",
        "error"
      );
    } finally {
      setSavingRole(false);
    }
  };

  const StatCard = ({
    icon,
    label,
    value,
    helper,
  }: {
    icon: React.ReactNode;
    label: string;
    value: number;
    helper: string;
  }) => (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Stack
  direction="row"
  spacing={2}
  sx={{
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
                mb: 1,
              }}
            >
              {label}
            </Typography>

            <Typography
              variant="h4"
              sx={{
                fontWeight: 750,
                color: "#172033",
                lineHeight: 1.1,
              }}
            >
              {value}
            </Typography>

            <Typography
              variant="caption"
              sx={{
                display: "block",
                mt: 1,
                color: "#98A2B3",
              }}
            >
              {helper}
            </Typography>
          </Box>

          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#EEF4FF",
              color: "#315B9A",
            }}
          >
            {icon}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ maxWidth: 1600, mx: "auto" }}>
      {/* PAGE HEADER */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", md: "center" },
          gap: 2,
          flexDirection: { xs: "column", md: "row" },
        }}
      >
        <Box>
          <Stack
  direction="row"
  spacing={1}
  sx={{
    alignItems: "center",
    mb: 1,
  }}
>
            <ShieldOutlined
              sx={{
                color: "#315B9A",
                fontSize: 27,
              }}
            />

            <Typography
              variant="overline"
              sx={{
                color: "#667085",
                fontWeight: 700,
                letterSpacing: 1.2,
              }}
            >
              SYSTEM MANAGEMENT
            </Typography>
          </Stack>

          <Typography
            variant="h4"
            sx={{
              fontWeight: 760,
              color: "#172033",
              mb: 0.75,
            }}
          >
            User & Role Management
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: "#667085",
              maxWidth: 760,
            }}
          >
            Manage workforce identities, organizational access,
            roles, departments, and operational permissions from one
            centralized administration workspace.
          </Typography>
        </Box>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          sx={{ width: { xs: "100%", md: "auto" } }}
        >
          <Button
            variant="outlined"
            startIcon={<AdminPanelSettings />}
            onClick={openCreateRole}
            sx={{
              minHeight: 44,
              px: 2.2,
              fontWeight: 700,
              borderColor: "#D0D5DD",
              color: "#344054",
            }}
          >
            New Role
          </Button>

          <Button
            variant="contained"
            startIcon={<PersonAddAlt1 />}
            onClick={openCreateUser}
            sx={{
              minHeight: 44,
              px: 2.4,
              fontWeight: 700,
              boxShadow: "none",
              backgroundColor: "#315B9A",
              "&:hover": {
                backgroundColor: "#274A7E",
                boxShadow: "none",
              },
            }}
          >
            Add User
          </Button>
        </Stack>
      </Box>

      {/* KPI STRIP */}
      <Grid container spacing={2.2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            icon={<People />}
            label="Total users"
            value={users.length}
            helper="Registered workforce accounts"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            icon={<CheckCircleOutlined />}
            label="Active users"
            value={activeUsers}
            helper="Currently active accounts"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            icon={<AdminPanelSettings />}
            label="Defined roles"
            value={roles.length}
            helper="Configured access roles"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            icon={<Business />}
            label="Departments"
            value={departmentsUsed || departments.length}
            helper={`${inactiveUsers} inactive user${
              inactiveUsers === 1 ? "" : "s"
            }`}
          />
        </Grid>
      </Grid>

      {/* USER DIRECTORY */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack
  direction={{ xs: "column", lg: "row" }}
  spacing={2}
  sx={{
    justifyContent: "space-between",
    alignItems: {
      xs: "flex-start",
      lg: "center",
    },
    mb: 2.5,
  }}
>
            <Box>
              <Stack
  direction="row"
  spacing={1}
  sx={{
    alignItems: "center",
    mb: 0.5,
  }}
>
                <Groups sx={{ color: "#315B9A" }} />

                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 750,
                    color: "#172033",
                  }}
                >
                  User Directory
                </Typography>
              </Stack>

              <Typography
                variant="body2"
                sx={{ color: "#667085" }}
              >
                Workforce accounts and organizational assignments
              </Typography>
            </Box>

            <Typography
              variant="body2"
              sx={{
                color: "#667085",
                fontWeight: 600,
              }}
            >
              {filteredUsers.length} of {users.length} users
            </Typography>
          </Stack>

          <Grid container spacing={2} sx={{ mb: 2.5 }}>
            <Grid size={{ xs: 12, md: 8 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by name, employee ID, email, role or department"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                slotProps={{
  input: {
    startAdornment: (
      <InputAdornment position="start">
        <Search sx={{ color: "#98A2B3" }} />
      </InputAdornment>
    ),
  },
}}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>

                <Select
                  value={userStatusFilter}
                  label="Status"
                  onChange={(e) =>
                    setUserStatusFilter(e.target.value)
                  }
                >
                  <MenuItem value="ALL">All statuses</MenuItem>

                  {statusOptions.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <TableContainer
            sx={{
              border: "1px solid #EAECF0",
              borderRadius: 2,
              overflowX: "auto",
            }}
          >
            <Table sx={{ minWidth: 900 }}>
              <TableHead>
                <TableRow
                  sx={{
                    backgroundColor: "#F8FAFC",
                  }}
                >
                  <TableCell sx={{ fontWeight: 750, color: "#475467" }}>
                    Employee
                  </TableCell>

                  <TableCell sx={{ fontWeight: 750, color: "#475467" }}>
                    Contact
                  </TableCell>

                  <TableCell sx={{ fontWeight: 750, color: "#475467" }}>
                    Role
                  </TableCell>

                  <TableCell sx={{ fontWeight: 750, color: "#475467" }}>
                    Department
                  </TableCell>

                  <TableCell sx={{ fontWeight: 750, color: "#475467" }}>
                    Status
                  </TableCell>

                  <TableCell sx={{ fontWeight: 750, color: "#475467" }}>
                    Created
                  </TableCell>

                  <TableCell
                    align="right"
                    sx={{ fontWeight: 750, color: "#475467" }}
                  >
                    Action
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {loadingUsers ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <Box
                        sx={{
                          py: 7,
                          display: "flex",
                          justifyContent: "center",
                        }}
                      >
                        <CircularProgress size={28} />
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <Box sx={{ py: 7, textAlign: "center" }}>
                        <People
                          sx={{
                            fontSize: 42,
                            color: "#D0D5DD",
                            mb: 1,
                          }}
                        />

                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: 700 }}
                        >
                          No users found
                        </Typography>

                        <Typography
                          variant="body2"
                          sx={{ color: "#98A2B3", mt: 0.5 }}
                        >
                          Try adjusting your search or status filter.
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow
                      key={user.user_id}
                      hover
                      sx={{
                        "&:last-child td": {
                          borderBottom: 0,
                        },
                      }}
                    >
                      <TableCell>
                        <Stack
  direction="row"
  spacing={1.5}
  sx={{
    alignItems: "center",
  }}
>
                          <Avatar
                            sx={{
                              width: 38,
                              height: 38,
                              backgroundColor: "#E8EEF8",
                              color: "#315B9A",
                              fontWeight: 750,
                              fontSize: 14,
                            }}
                          >
                            {getInitials(user.full_name)}
                          </Avatar>

                          <Box>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 750,
                                color: "#172033",
                              }}
                            >
                              {user.full_name}
                            </Typography>

                            <Typography
                              variant="caption"
                              sx={{ color: "#667085" }}
                            >
                              {user.employee_id}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>

                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{ color: "#344054" }}
                        >
                          {user.email}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Chip
                          icon={<WorkOutlined />}
                          label={
                            roleMap.get(user.role_id || -1) ||
                            "Unassigned"
                          }
                          size="small"
                          variant="outlined"
                          sx={{
                            fontWeight: 650,
                            borderColor: "#D0D5DD",
                          }}
                        />
                      </TableCell>

                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{ color: "#344054" }}
                        >
                          {departmentMap.get(
                            user.department_id || -1
                          ) || "Unassigned"}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={user.status}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            backgroundColor:
                              user.status === "ACTIVE"
                                ? "#ECFDF3"
                                : "#F2F4F7",
                            color:
                              user.status === "ACTIVE"
                                ? "#027A48"
                                : "#667085",
                          }}
                        />
                      </TableCell>

                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{ color: "#667085" }}
                        >
                          {formatDate(user.created_at)}
                        </Typography>
                      </TableCell>

                      <TableCell align="right">
                        <Tooltip title="Edit user">
                          <IconButton
                            size="small"
                            onClick={() => openEditUser(user)}
                            sx={{
                              color: "#315B9A",
                              "&:hover": {
                                backgroundColor: "#EEF4FF",
                              },
                            }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* ROLE REGISTRY */}
      <Card>
        <CardContent>
         <Stack
  direction={{ xs: "column", md: "row" }}
  spacing={2}
  sx={{
    justifyContent: "space-between",
    alignItems: {
      xs: "flex-start",
      md: "center",
    },
    mb: 2.5,
  }}
>
            <Box>
             <Stack
  direction="row"
  spacing={1}
  sx={{
    alignItems: "center",
    mb: 0.5,
  }}
>
                <KeyOutlined sx={{ color: "#315B9A" }} />

                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 750,
                    color: "#172033",
                  }}
                >
                  Role & Permissions Registry
                </Typography>
              </Stack>

              <Typography
                variant="body2"
                sx={{ color: "#667085" }}
              >
                Centralized access roles configured for the
                manufacturing platform
              </Typography>
            </Box>

            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={openCreateRole}
              sx={{
                fontWeight: 700,
                borderColor: "#D0D5DD",
                color: "#344054",
              }}
            >
              Create Role
            </Button>
          </Stack>

          <TextField
            fullWidth
            size="small"
            placeholder="Search roles, descriptions or permissions"
            value={roleSearch}
            onChange={(e) => setRoleSearch(e.target.value)}
            sx={{ mb: 2.5 }}
slotProps={{
  input: {
    startAdornment: (
      <InputAdornment position="start">
        <Search sx={{ color: "#98A2B3" }} />
      </InputAdornment>
    ),
  },
}}
          />

          {loadingRoles ? (
            <Box
              sx={{
                py: 6,
                display: "flex",
                justifyContent: "center",
              }}
            >
              <CircularProgress size={28} />
            </Box>
          ) : filteredRoles.length === 0 ? (
            <Box
              sx={{
                py: 6,
                textAlign: "center",
                border: "1px dashed #D0D5DD",
                borderRadius: 2,
              }}
            >
              <AdminPanelSettings
                sx={{
                  fontSize: 42,
                  color: "#D0D5DD",
                  mb: 1,
                }}
              />

              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 700 }}
              >
                No roles found
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  color: "#98A2B3",
                  mt: 0.5,
                }}
              >
                Create a role to configure platform access.
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {filteredRoles.map((role) => (
                <Grid
                  size={{ xs: 12, sm: 6, lg: 4 }}
                  key={role.role_id}
                >
                  <Box
                    sx={{
                      height: "100%",
                      border: "1px solid #EAECF0",
                      borderRadius: 2,
                      p: 2.2,
                      transition:
                        "border-color 0.2s ease, box-shadow 0.2s ease",
                      "&:hover": {
                        borderColor: "#B8C7DD",
                        boxShadow:
                          "0 5px 18px rgba(20, 32, 50, 0.07)",
                      },
                    }}
                  >
                   <Stack
  direction="row"
  spacing={2}
  sx={{
    justifyContent: "space-between",
    alignItems: "flex-start",
  }}
>
  <Stack
    direction="row"
    spacing={1.3}
    sx={{
      alignItems: "center",
    }}
  >
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 2,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "#F2F4F7",
                            color: "#475467",
                          }}
                        >
                          <SupervisorAccount />
                        </Box>

                        <Box>
                          <Typography
                            variant="subtitle1"
                            sx={{
                              fontWeight: 750,
                              color: "#172033",
                            }}
                          >
                            {role.role_name}
                          </Typography>

                          <Typography
                            variant="caption"
                            sx={{ color: "#98A2B3" }}
                          >
                            Role ID: {role.role_id}
                          </Typography>
                        </Box>
                      </Stack>

                      <Tooltip title="Edit role">
                        <IconButton
                          size="small"
                          onClick={() => openEditRole(role)}
                          sx={{
                            color: "#315B9A",
                          }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>

                    <Divider sx={{ my: 2 }} />

                    <Typography
                      variant="body2"
                      sx={{
                        color: "#667085",
                        minHeight: 42,
                        lineHeight: 1.5,
                      }}
                    >
                      {role.role_description ||
                        "No role description provided."}
                    </Typography>

                    <Box
                      sx={{
                        mt: 2,
                        p: 1.5,
                        borderRadius: 1.5,
                        backgroundColor: "#F8FAFC",
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          display: "block",
                          color: "#667085",
                          fontWeight: 750,
                          mb: 0.5,
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                        }}
                      >
                        Permissions
                      </Typography>

                      <Typography
                        variant="body2"
                        sx={{
                          color: "#344054",
                          wordBreak: "break-word",
                        }}
                      >
                        {role.permissions || "No permissions defined."}
                      </Typography>
                    </Box>

                    <Typography
                      variant="caption"
                      sx={{
                        display: "block",
                        mt: 1.5,
                        color: "#98A2B3",
                      }}
                    >
                      Created {formatDate(role.created_at)}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* USER DIALOG */}
      <Dialog
        open={userDialogOpen}
        onClose={closeUserDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography
            variant="h6"
            sx={{ fontWeight: 750 }}
          >
            {editingUser ? "Edit User Profile" : "Create User"}
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: "#667085",
              mt: 0.5,
            }}
          >
            {editingUser
              ? "Update workforce identity and organizational assignment."
              : "Create a new workforce account for the platform."}
          </Typography>
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2.2} sx={{ pt: 0.5 }}>
            <TextField
              label="Employee ID"
              fullWidth
              value={userForm.employee_id}
              disabled={Boolean(editingUser)}
              onChange={(e) =>
                setUserForm({
                  ...userForm,
                  employee_id: e.target.value,
                })
              }
              helperText={
                editingUser
                  ? "Employee ID cannot be changed."
                  : undefined
              }
            />

            <TextField
              label="Full Name"
              fullWidth
              required
              value={userForm.full_name}
              onChange={(e) =>
                setUserForm({
                  ...userForm,
                  full_name: e.target.value,
                })
              }
            />

            <TextField
              label="Email"
              type="email"
              fullWidth
              required
              value={userForm.email}
              onChange={(e) =>
                setUserForm({
                  ...userForm,
                  email: e.target.value,
                })
              }
            />

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth required>
                  <InputLabel>Role</InputLabel>

                  <Select
                    value={userForm.role_id}
                    label="Role"
                    onChange={(e) =>
                      setUserForm({
                        ...userForm,
                        role_id: e.target.value,
                      })
                    }
                    disabled={loadingRoles}
                  >
                    {roles.map((role) => (
                      <MenuItem
                        key={role.role_id}
                        value={role.role_id.toString()}
                      >
                        {role.role_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth required>
                  <InputLabel>Department</InputLabel>

                  <Select
                    value={userForm.department_id}
                    label="Department"
                    onChange={(e) =>
                      setUserForm({
                        ...userForm,
                        department_id: e.target.value,
                      })
                    }
                    disabled={loadingDepartments}
                  >
                    {departments.map((department) => (
                      <MenuItem
                        key={department.department_id}
                        value={department.department_id.toString()}
                      >
                        {department.department_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>

              <Select
                value={userForm.status}
                label="Status"
                onChange={(e) =>
                  setUserForm({
                    ...userForm,
                    status: e.target.value,
                  })
                }
              >
                {statusOptions.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label={
                editingUser
                  ? "Password"
                  : "Password"
              }
              type="password"
              fullWidth
              required={!editingUser}
              value={userForm.password}
              onChange={(e) =>
                setUserForm({
                  ...userForm,
                  password: e.target.value,
                })
              }
              helperText={
                editingUser
                  ? "Leave blank to keep the existing password."
                  : "Required when creating a new user."
              }
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={closeUserDialog}
            disabled={savingUser}
            sx={{ color: "#667085" }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleUserSubmit}
            disabled={savingUser}
            sx={{
              px: 2.5,
              fontWeight: 700,
              backgroundColor: "#315B9A",
              boxShadow: "none",
              "&:hover": {
                backgroundColor: "#274A7E",
                boxShadow: "none",
              },
            }}
          >
            {savingUser ? (
              <CircularProgress size={21} color="inherit" />
            ) : editingUser ? (
              "Save Changes"
            ) : (
              "Create User"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ROLE DIALOG */}
      <Dialog
        open={roleDialogOpen}
        onClose={closeRoleDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography
            variant="h6"
            sx={{ fontWeight: 750 }}
          >
            {editingRole ? "Edit Role" : "Create Role"}
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: "#667085",
              mt: 0.5,
            }}
          >
            Define the role identity, description and permission scope.
          </Typography>
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2.2} sx={{ pt: 0.5 }}>
            <TextField
              label="Role Name"
              fullWidth
              required
              value={roleForm.role_name}
              onChange={(e) =>
                setRoleForm({
                  ...roleForm,
                  role_name: e.target.value,
                })
              }
            />

            <TextField
              label="Role Description"
              fullWidth
              multiline
              minRows={3}
              value={roleForm.role_description}
              onChange={(e) =>
                setRoleForm({
                  ...roleForm,
                  role_description: e.target.value,
                })
              }
            />

            <TextField
              label="Permissions"
              fullWidth
              multiline
              minRows={4}
              value={roleForm.permissions}
              onChange={(e) =>
                setRoleForm({
                  ...roleForm,
                  permissions: e.target.value,
                })
              }
              helperText="Enter the permission scope supported by your backend."
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={closeRoleDialog}
            disabled={savingRole}
            sx={{ color: "#667085" }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleRoleSubmit}
            disabled={savingRole}
            sx={{
              px: 2.5,
              fontWeight: 700,
              backgroundColor: "#315B9A",
              boxShadow: "none",
              "&:hover": {
                backgroundColor: "#274A7E",
                boxShadow: "none",
              },
            }}
          >
            {savingRole ? (
              <CircularProgress size={21} color="inherit" />
            ) : editingRole ? (
              "Save Changes"
            ) : (
              "Create Role"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* SNACKBAR */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={() =>
          setSnackbar({
            ...snackbar,
            open: false,
          })
        }
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() =>
            setSnackbar({
              ...snackbar,
              open: false,
            })
          }
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}