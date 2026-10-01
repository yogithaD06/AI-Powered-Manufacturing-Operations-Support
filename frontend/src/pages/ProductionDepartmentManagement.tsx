import { useEffect, useMemo, useState } from "react";
import axios from "axios";

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
  MenuItem,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";

import {
  Add,
  Business,
  Edit,
  Factory,
  PrecisionManufacturing,
  Refresh,
} from "@mui/icons-material";

interface Department {
  department_id: number;
  department_name: string;
  description: string | null;
  location: string | null;
  status: string;
  created_at?: string;
}

interface ProductionLine {
  line_id: number;
  line_name: string;
  department_id: number | null;
  location: string | null;
  status: string;
  created_at?: string;
}

interface Machine {
  machine_id: number;
  machine_name: string;
  machine_code: string;
  machine_type: string | null;
  line_id: number | null;
  department_id: number | null;
  location: string | null;
  installation_date: string | null;
  status: string;
  created_at?: string;
}

type DialogType = "department" | "line" | "machine" | null;

const API = "/api";

export default function ProductionDepartmentManagement() {
  const [tab, setTab] = useState(0);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [lines, setLines] = useState<ProductionLine[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);

  const [loading, setLoading] = useState(false);

  const [dialogType, setDialogType] = useState<DialogType>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [departmentForm, setDepartmentForm] = useState({
    department_name: "",
    description: "",
    location: "",
    status: "ACTIVE",
  });

  const [lineForm, setLineForm] = useState({
    line_name: "",
    department_id: "",
    location: "",
    status: "ACTIVE",
  });

  const [machineForm, setMachineForm] = useState({
    machine_name: "",
    machine_code: "",
    machine_type: "",
    line_id: "",
    department_id: "",
    location: "",
    installation_date: "",
    status: "ACTIVE",
  });

  const fetchAll = async () => {
    try {
      setLoading(true);

      const [departmentResponse, lineResponse, machineResponse] =
        await Promise.all([
          axios.get(`${API}/departments/?skip=0&limit=100`),
          axios.get(`${API}/production-lines/?skip=0&limit=100`),
          axios.get(`${API}/machines/?skip=0&limit=100`),
        ]);

      setDepartments(departmentResponse.data);
      setLines(lineResponse.data);
      setMachines(machineResponse.data);
    } catch (error) {
      console.error("Failed to fetch production data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const departmentMap = useMemo(() => {
    return new Map(
      departments.map((department) => [
        department.department_id,
        department.department_name,
      ])
    );
  }, [departments]);

  const lineMap = useMemo(() => {
    return new Map(
      lines.map((line) => [line.line_id, line.line_name])
    );
  }, [lines]);

  const resetForms = () => {
    setDepartmentForm({
      department_name: "",
      description: "",
      location: "",
      status: "ACTIVE",
    });

    setLineForm({
      line_name: "",
      department_id: "",
      location: "",
      status: "ACTIVE",
    });

    setMachineForm({
      machine_name: "",
      machine_code: "",
      machine_type: "",
      line_id: "",
      department_id: "",
      location: "",
      installation_date: "",
      status: "ACTIVE",
    });

    setEditingId(null);
  };

  const closeDialog = () => {
    setDialogType(null);
    resetForms();
  };

  const openCreateDepartment = () => {
    resetForms();
    setDialogType("department");
  };

  const openCreateLine = () => {
    resetForms();
    setDialogType("line");
  };

  const openCreateMachine = () => {
    resetForms();
    setDialogType("machine");
  };

  const editDepartment = (department: Department) => {
    setEditingId(department.department_id);

    setDepartmentForm({
      department_name: department.department_name,
      description: department.description || "",
      location: department.location || "",
      status: department.status,
    });

    setDialogType("department");
  };

  const editLine = (line: ProductionLine) => {
    setEditingId(line.line_id);

    setLineForm({
      line_name: line.line_name,
      department_id: line.department_id
        ? String(line.department_id)
        : "",
      location: line.location || "",
      status: line.status,
    });

    setDialogType("line");
  };

  const editMachine = (machine: Machine) => {
    setEditingId(machine.machine_id);

    setMachineForm({
      machine_name: machine.machine_name,
      machine_code: machine.machine_code,
      machine_type: machine.machine_type || "",
      line_id: machine.line_id ? String(machine.line_id) : "",
      department_id: machine.department_id
        ? String(machine.department_id)
        : "",
      location: machine.location || "",
      installation_date: machine.installation_date || "",
      status: machine.status,
    });

    setDialogType("machine");
  };

  const saveDepartment = async () => {
    try {
      const payload = {
        department_name: departmentForm.department_name,
        description: departmentForm.description || null,
        location: departmentForm.location || null,
        status: departmentForm.status,
      };

      if (editingId) {
        await axios.put(`${API}/departments/${editingId}`, payload);
      } else {
        await axios.post(`${API}/departments/`, payload);
      }

      closeDialog();
      await fetchAll();
    } catch (error) {
      console.error("Department save failed:", error);
    }
  };

  const saveLine = async () => {
    try {
      const payload = {
        line_name: lineForm.line_name,
        department_id: lineForm.department_id
          ? Number(lineForm.department_id)
          : null,
        location: lineForm.location || null,
        status: lineForm.status,
      };

      if (editingId) {
        await axios.put(`${API}/production-lines/${editingId}`, payload);
      } else {
        await axios.post(`${API}/production-lines/`, payload);
      }

      closeDialog();
      await fetchAll();
    } catch (error) {
      console.error("Production line save failed:", error);
    }
  };

  const saveMachine = async () => {
    try {
      const payload = {
        machine_name: machineForm.machine_name,
        machine_code: machineForm.machine_code,
        machine_type: machineForm.machine_type || null,
        line_id: machineForm.line_id
          ? Number(machineForm.line_id)
          : null,
        department_id: machineForm.department_id
          ? Number(machineForm.department_id)
          : null,
        location: machineForm.location || null,
        installation_date: machineForm.installation_date || null,
        status: machineForm.status,
      };

      if (editingId) {
        await axios.put(`${API}/machines/${editingId}`, payload);
      } else {
        await axios.post(`${API}/machines/`, payload);
      }

      closeDialog();
      await fetchAll();
    } catch (error) {
      console.error("Machine save failed:", error);
    }
  };

  const handleSave = async () => {
    if (dialogType === "department") {
      await saveDepartment();
    }

    if (dialogType === "line") {
      await saveLine();
    }

    if (dialogType === "machine") {
      await saveMachine();
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", md: "center" },
          gap: 2,
          mb: 3,
          flexDirection: { xs: "column", md: "row" },
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{ fontWeight: 700, mb: 0.5 }}
          >
            Production / Department Management
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Manage departments, production lines, and manufacturing machines.
          </Typography>
        </Box>

        <IconButton
          onClick={fetchAll}
          disabled={loading}
          sx={{
            border: "1px solid #e0e5ec",
            borderRadius: 2,
          }}
        >
          <Refresh />
        </IconButton>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Business sx={{ fontSize: 36 }} />

                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Departments
                  </Typography>

                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {departments.length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Factory sx={{ fontSize: 36 }} />

                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Production Lines
                  </Typography>

                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {lines.length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <PrecisionManufacturing sx={{ fontSize: 36 }} />

                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Machines
                  </Typography>

                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {machines.length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs
          value={tab}
          onChange={(_, newValue) => setTab(newValue)}
          sx={{
            px: 2,
            borderBottom: "1px solid #e7ebf2",
          }}
        >
          <Tab label="Departments" />
          <Tab label="Production Lines" />
          <Tab label="Machines" />
        </Tabs>

        {/* Departments */}
        {tab === 0 && (
          <CardContent>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Departments
              </Typography>

              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={openCreateDepartment}
              >
                New Department
              </Button>
            </Box>

            <Box sx={{ overflowX: "auto" }}>
              <Box sx={{ minWidth: 850 }}>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns:
                      "70px 1.5fr 2fr 1.5fr 120px 90px",
                    gap: 2,
                    p: 2,
                    bgcolor: "#f8fafc",
                    fontWeight: 700,
                  }}
                >
                  <Typography>ID</Typography>
                  <Typography>Name</Typography>
                  <Typography>Description</Typography>
                  <Typography>Location</Typography>
                  <Typography>Status</Typography>
                  <Typography>Actions</Typography>
                </Box>

                {departments.map((department) => (
                  <Box
                    key={department.department_id}
                    sx={{
                      display: "grid",
                      gridTemplateColumns:
                        "70px 1.5fr 2fr 1.5fr 120px 90px",
                      gap: 2,
                      alignItems: "center",
                      p: 2,
                      borderBottom: "1px solid #edf0f4",
                    }}
                  >
                    <Typography>
                      {department.department_id}
                    </Typography>

                    <Typography sx={{ fontWeight: 600 }}>
                      {department.department_name}
                    </Typography>

                    <Typography variant="body2">
                      {department.description || "—"}
                    </Typography>

                    <Typography variant="body2">
                      {department.location || "—"}
                    </Typography>

                    <Chip
                      label={department.status}
                      size="small"
                      color={
                        department.status === "ACTIVE"
                          ? "success"
                          : "default"
                      }
                    />

                    <IconButton
                      onClick={() => editDepartment(department)}
                    >
                      <Edit />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            </Box>
          </CardContent>
        )}

        {/* Production Lines */}
        {tab === 1 && (
          <CardContent>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Production Lines
              </Typography>

              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={openCreateLine}
              >
                New Production Line
              </Button>
            </Box>

            <Box sx={{ overflowX: "auto" }}>
              <Box sx={{ minWidth: 800 }}>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns:
                      "70px 1.5fr 1.5fr 1.5fr 120px 90px",
                    gap: 2,
                    p: 2,
                    bgcolor: "#f8fafc",
                    fontWeight: 700,
                  }}
                >
                  <Typography>ID</Typography>
                  <Typography>Line Name</Typography>
                  <Typography>Department</Typography>
                  <Typography>Location</Typography>
                  <Typography>Status</Typography>
                  <Typography>Actions</Typography>
                </Box>

                {lines.map((line) => (
                  <Box
                    key={line.line_id}
                    sx={{
                      display: "grid",
                      gridTemplateColumns:
                        "70px 1.5fr 1.5fr 1.5fr 120px 90px",
                      gap: 2,
                      alignItems: "center",
                      p: 2,
                      borderBottom: "1px solid #edf0f4",
                    }}
                  >
                    <Typography>{line.line_id}</Typography>

                    <Typography sx={{ fontWeight: 600 }}>
                      {line.line_name}
                    </Typography>

                    <Typography>
                      {line.department_id
                        ? departmentMap.get(line.department_id) ||
                          `Department ${line.department_id}`
                        : "—"}
                    </Typography>

                    <Typography variant="body2">
                      {line.location || "—"}
                    </Typography>

                    <Chip
                      label={line.status}
                      size="small"
                      color={
                        line.status === "ACTIVE"
                          ? "success"
                          : "default"
                      }
                    />

                    <IconButton onClick={() => editLine(line)}>
                      <Edit />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            </Box>
          </CardContent>
        )}

        {/* Machines */}
        {tab === 2 && (
          <CardContent>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Machines
              </Typography>

              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={openCreateMachine}
              >
                New Machine
              </Button>
            </Box>

            <Box sx={{ overflowX: "auto" }}>
              <Box sx={{ minWidth: 1200 }}>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns:
                      "70px 1.4fr 1fr 1.4fr 1.4fr 1.4fr 1.5fr 120px 90px",
                    gap: 2,
                    p: 2,
                    bgcolor: "#f8fafc",
                    fontWeight: 700,
                  }}
                >
                  <Typography>ID</Typography>
                  <Typography>Name</Typography>
                  <Typography>Code</Typography>
                  <Typography>Type</Typography>
                  <Typography>Line</Typography>
                  <Typography>Department</Typography>
                  <Typography>Location</Typography>
                  <Typography>Status</Typography>
                  <Typography>Actions</Typography>
                </Box>

                {machines.map((machine) => (
                  <Box
                    key={machine.machine_id}
                    sx={{
                      display: "grid",
                      gridTemplateColumns:
                        "70px 1.4fr 1fr 1.4fr 1.4fr 1.4fr 1.5fr 120px 90px",
                      gap: 2,
                      alignItems: "center",
                      p: 2,
                      borderBottom: "1px solid #edf0f4",
                    }}
                  >
                    <Typography>{machine.machine_id}</Typography>

                    <Typography sx={{ fontWeight: 600 }}>
                      {machine.machine_name}
                    </Typography>

                    <Typography>
                      {machine.machine_code}
                    </Typography>

                    <Typography>
                      {machine.machine_type || "—"}
                    </Typography>

                    <Typography>
                      {machine.line_id
                        ? lineMap.get(machine.line_id) ||
                          `Line ${machine.line_id}`
                        : "—"}
                    </Typography>

                    <Typography>
                      {machine.department_id
                        ? departmentMap.get(machine.department_id) ||
                          `Department ${machine.department_id}`
                        : "—"}
                    </Typography>

                    <Typography variant="body2">
                      {machine.location || "—"}
                    </Typography>

                    <Chip
                      label={machine.status}
                      size="small"
                      color={
                        machine.status === "ACTIVE"
                          ? "success"
                          : "default"
                      }
                    />

                    <IconButton
                      onClick={() => editMachine(machine)}
                    >
                      <Edit />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            </Box>
          </CardContent>
        )}
      </Card>

      {/* Department Dialog */}
      <Dialog
        open={dialogType === "department"}
        onClose={closeDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {editingId ? "Edit Department" : "New Department"}
        </DialogTitle>

        <DialogContent>
          <TextField
            fullWidth
            label="Department Name"
            value={departmentForm.department_name}
            onChange={(e) =>
              setDepartmentForm({
                ...departmentForm,
                department_name: e.target.value,
              })
            }
            margin="normal"
          />

          <TextField
            fullWidth
            label="Description"
            multiline
            rows={3}
            value={departmentForm.description}
            onChange={(e) =>
              setDepartmentForm({
                ...departmentForm,
                description: e.target.value,
              })
            }
            margin="normal"
          />

          <TextField
            fullWidth
            label="Location"
            value={departmentForm.location}
            onChange={(e) =>
              setDepartmentForm({
                ...departmentForm,
                location: e.target.value,
              })
            }
            margin="normal"
          />

          <TextField
            select
            fullWidth
            label="Status"
            value={departmentForm.status}
            onChange={(e) =>
              setDepartmentForm({
                ...departmentForm,
                status: e.target.value,
              })
            }
            margin="normal"
          >
            <MenuItem value="ACTIVE">ACTIVE</MenuItem>
            <MenuItem value="INACTIVE">INACTIVE</MenuItem>
          </TextField>
        </DialogContent>

        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>

          <Button
            variant="contained"
            onClick={handleSave}
          >
            {editingId ? "Update" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Production Line Dialog */}
      <Dialog
        open={dialogType === "line"}
        onClose={closeDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {editingId
            ? "Edit Production Line"
            : "New Production Line"}
        </DialogTitle>

        <DialogContent>
          <TextField
            fullWidth
            label="Line Name"
            value={lineForm.line_name}
            onChange={(e) =>
              setLineForm({
                ...lineForm,
                line_name: e.target.value,
              })
            }
            margin="normal"
          />

          <TextField
            select
            fullWidth
            label="Department"
            value={lineForm.department_id}
            onChange={(e) =>
              setLineForm({
                ...lineForm,
                department_id: e.target.value,
              })
            }
            margin="normal"
          >
            {departments.map((department) => (
              <MenuItem
                key={department.department_id}
                value={department.department_id}
              >
                {department.department_name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            label="Location"
            value={lineForm.location}
            onChange={(e) =>
              setLineForm({
                ...lineForm,
                location: e.target.value,
              })
            }
            margin="normal"
          />

          <TextField
            select
            fullWidth
            label="Status"
            value={lineForm.status}
            onChange={(e) =>
              setLineForm({
                ...lineForm,
                status: e.target.value,
              })
            }
            margin="normal"
          >
            <MenuItem value="ACTIVE">ACTIVE</MenuItem>
            <MenuItem value="INACTIVE">INACTIVE</MenuItem>
          </TextField>
        </DialogContent>

        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>

          <Button
            variant="contained"
            onClick={handleSave}
          >
            {editingId ? "Update" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Machine Dialog */}
      <Dialog
        open={dialogType === "machine"}
        onClose={closeDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {editingId ? "Edit Machine" : "New Machine"}
        </DialogTitle>

        <DialogContent>
          <TextField
            fullWidth
            label="Machine Name"
            value={machineForm.machine_name}
            onChange={(e) =>
              setMachineForm({
                ...machineForm,
                machine_name: e.target.value,
              })
            }
            margin="normal"
          />

          <TextField
            fullWidth
            label="Machine Code"
            value={machineForm.machine_code}
            onChange={(e) =>
              setMachineForm({
                ...machineForm,
                machine_code: e.target.value,
              })
            }
            margin="normal"
          />

          <TextField
            fullWidth
            label="Machine Type"
            value={machineForm.machine_type}
            onChange={(e) =>
              setMachineForm({
                ...machineForm,
                machine_type: e.target.value,
              })
            }
            margin="normal"
          />

          <TextField
            select
            fullWidth
            label="Production Line"
            value={machineForm.line_id}
            onChange={(e) =>
              setMachineForm({
                ...machineForm,
                line_id: e.target.value,
              })
            }
            margin="normal"
          >
            {lines.map((line) => (
              <MenuItem
                key={line.line_id}
                value={line.line_id}
              >
                {line.line_name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            fullWidth
            label="Department"
            value={machineForm.department_id}
            onChange={(e) =>
              setMachineForm({
                ...machineForm,
                department_id: e.target.value,
              })
            }
            margin="normal"
          >
            {departments.map((department) => (
              <MenuItem
                key={department.department_id}
                value={department.department_id}
              >
                {department.department_name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            label="Location"
            value={machineForm.location}
            onChange={(e) =>
              setMachineForm({
                ...machineForm,
                location: e.target.value,
              })
            }
            margin="normal"
          />

          <TextField
            fullWidth
            type="date"
            label="Installation Date"
            value={machineForm.installation_date}
            onChange={(e) =>
              setMachineForm({
                ...machineForm,
                installation_date: e.target.value,
              })
            }
            margin="normal"
            slotProps={{
              inputLabel: {
                shrink: true,
              },
            }}
          />

          <TextField
            select
            fullWidth
            label="Status"
            value={machineForm.status}
            onChange={(e) =>
              setMachineForm({
                ...machineForm,
                status: e.target.value,
              })
            }
            margin="normal"
          >
            <MenuItem value="ACTIVE">ACTIVE</MenuItem>
            <MenuItem value="INACTIVE">INACTIVE</MenuItem>
          </TextField>
        </DialogContent>

        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>

          <Button
            variant="contained"
            onClick={handleSave}
          >
            {editingId ? "Update" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}