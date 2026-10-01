import { useEffect, useState } from "react";
import axios from "axios";

import {
  Dashboard as DashboardIcon,
  ConfirmationNumber,
  AccessTime,
  AccountTree,
  Category,
  Search,
  Notifications,
  People,
  AutoAwesome,
  Assessment,
  Build,
  Engineering,
  Menu,
} from "@mui/icons-material";

import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
} from "@mui/material";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import Login from "./pages/Login";
import IncidentTickets from "./pages/IncidentTickets";
import TicketManagement from "./pages/TicketManagement";
import DowntimeManagement from "./pages/DowntimeManagement";
import RCAManagement from "./pages/RCAManagement";
import DowntimeTracking from "./pages/DowntimeTracking";
import ProductionDepartmentManagement from "./pages/ProductionDepartmentManagement";
import IssueCategorization from "./pages/IssueCategorization";
import CAPAManagement from "./pages/CAPAManagement";
import ResolutionTracking from "./pages/ResolutionTracking";
import AIPredictions from "./pages/AIPredictions";
import DashboardKPI from "./pages/DashboardKPI";
import NotificationsAlerts from "./pages/NotificationsAlerts";
import UserRoleManagement from "./pages/UserRoleManagement";
import "./App.css";

const drawerWidth = 270;

const API = "/api";

function App() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [downtime, setDowntime] = useState<any[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activePage, setActivePage] = useState("dashboard");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [incidentResponse, downtimeResponse] = await Promise.all([
          axios.get(`${API}/incidents/?skip=0&limit=100`),
          axios.get(`${API}/downtime-records/?skip=0&limit=100`),
        ]);

        setIncidents(incidentResponse.data);
        setDowntime(downtimeResponse.data);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      }
    };

    fetchDashboardData();
  }, []);

  const totalIncidents = incidents.length;

  const openIncidents = incidents.filter(
    (incident) => incident.status === "OPEN"
  ).length;

  const highPriorityIncidents = incidents.filter(
    (incident) => incident.priority === "HIGH"
  ).length;

  const totalDowntime = downtime.reduce(
    (sum, item) => sum + (item.duration_minutes || 0),
    0
  );

  const totalProductionLoss = downtime.reduce(
    (sum, item) => sum + (item.production_loss || 0),
    0
  );

  const totalUnitsAffected = downtime.reduce(
    (sum, item) => sum + (item.production_units_affected || 0),
    0
  );

const STATUS_COLORS = ["#22c55e", "#cbd5e1"];
const PRIORITY_COLORS = ["#ef4444", "#cbd5e1"];
const statusData = [
    {
      name: "Open",
      value: incidents.filter((i) => i.status === "OPEN").length,
    },
    {
      name: "Other",
      value: incidents.filter((i) => i.status !== "OPEN").length,
    },
  ].filter((item) => item.value > 0);

  const priorityData = [
    {
      name: "High",
      value: incidents.filter((i) => i.priority === "HIGH").length,
    },
    {
      name: "Other",
      value: incidents.filter((i) => i.priority !== "HIGH").length,
    },
  ].filter((item) => item.value > 0);

  const downtimeData = downtime.map((item) => ({
    name: `DT-${item.downtime_id}`,
    duration: item.duration_minutes,
  }));

  const menuSections = [
    {
      title: "OPERATIONS",
      items: [
      {
  label: "Incident & Ticket Management",
  icon: <ConfirmationNumber />,
  page: "incidents",
},
{
  label: "Ticket Management",
  icon: <ConfirmationNumber />,
  page: "tickets",
},
{
  label: "Downtime Management",
  icon: <AccessTime />,
  page: "downtime",
},
{
  label: "Downtime Tracking",
  icon: <Assessment />,
  page: "downtime-tracking",
},
{
  label: "RCA Management",
  icon: <AccountTree />,
  page: "rca",
},

        {
  label: "Production / Department Management",
  icon: <AccountTree />,
  page: "production-department",
},
{
  label: "Issue Categorization",
  icon: <Category />,
  page: "issue-categorization",
},
        {
          label: "Issue Categorization",
          icon: <Category />,
        },
      ],
    },
    {
      title: "PROBLEM RESOLUTION",
      items: [
{
  label: "RCA",
  icon: <Search />,
  page: "rca",
},
{
  label: "CAPA",
  icon: <Build />,
  page: "capa",
},
{
  label: "Resolution Tracking",
  icon: <Engineering />,
  page: "resolution",
},
      ],
    },
    {
      title: "INTELLIGENCE & ANALYTICS",
      items: [
{
  label: "AI Predictions",
  icon: <AutoAwesome />,
  page: "ai-predictions",
},
{
  label: "Dashboard & KPI Monitoring",
  icon: <DashboardIcon />,
  page: "dashboard-kpi",
},

      ],
    },
    {
      title: "SYSTEM MANAGEMENT",
      items: [
{
  label: "Notifications & Alerts",
  icon: <Notifications />,
  page: "notifications-alerts",
},
        {
  label: "User & Role Management",
  icon: <People />,
  page: "user-role-management",
},
      ],
    },
  ];

  const drawer = (
    <Box>
      <Box sx={{ px: 2.5, py: 2.5 }}>
        <Typography
          variant="h6"
          sx={{ fontWeight: 800, letterSpacing: 1 }}
        >
          MES SUPPORT
        </Typography>

        <Typography
          variant="body2"
          sx={{ color: "#9ca3af", mt: 0.5 }}
        >
          Operations Intelligence
        </Typography>
      </Box>

      <List>
        <ListItemButton
  selected={activePage === "dashboard"}
  onClick={() => setActivePage("dashboard")}
>
          <ListItemIcon>
            <DashboardIcon />
          </ListItemIcon>

          <ListItemText primary="Dashboard" />
        </ListItemButton>

        {menuSections.map((section) => (
          <Box key={section.title} sx={{ mt: 2 }}>
            <Typography
              variant="caption"
              sx={{
                px: 2.5,
                color: "#9ca3af",
                fontWeight: 700,
                letterSpacing: 1,
              }}
            >
              {section.title}
            </Typography>

            {section.items.map((item) => (
  <ListItemButton
    key={item.label}
    onClick={() => {
      if (item.page) {
        setActivePage(item.page);
      }
    }}
  >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
          </Box>
        ))}
      </List>
    </Box>
  );
  if (!isLoggedIn) {
  return <Login onLogin={() => setIsLoggedIn(true)} />;
}
  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />

      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          backgroundColor: "#ffffff",
          color: "#111827",
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen(!mobileOpen)}
            sx={{ mr: 2, display: { sm: "none" } }}
          >
            <Menu />
          </IconButton>

          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Dashboard
          </Typography>

          <Box sx={{ flexGrow: 1 }} />

          <Chip
            label="MES Admin"
            variant="outlined"
            sx={{ mr: 1 }}
          />

          <Typography variant="body2">
            System Administrator
          </Typography>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              backgroundColor: "#111827",
              color: "#ffffff",
            },
          }}
        >
          {drawer}
        </Drawer>

        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              backgroundColor: "#111827",
              color: "#ffffff",
              boxSizing: "border-box",
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          backgroundColor: "#f5f7fb",
          minHeight: "100vh",
        }}
      >
        <Toolbar />
        {activePage === "incidents" ? (
  <IncidentTickets />
) : activePage === "tickets" ? (
  <TicketManagement />
) : activePage === "downtime" ? (
  <DowntimeManagement />
) : activePage === "downtime-tracking" ? (
  <DowntimeTracking />
) : activePage === "rca" ? (
  <RCAManagement />
) : activePage === "production-department" ? (
  <ProductionDepartmentManagement />
) : activePage === "issue-categorization" ? (
  <IssueCategorization />
) : activePage === "capa" ? (
  <CAPAManagement />
  ) : activePage === "resolution" ? (
  <ResolutionTracking />
  ) : activePage === "ai-predictions" ? (
  <AIPredictions />
  ) : activePage === "dashboard-kpi" ? (
  <DashboardKPI />
  ) : activePage === "notifications-alerts" ? (
  <NotificationsAlerts />
  ) : activePage === "user-role-management" ? (
  <UserRoleManagement />
) : (
  <>
        <Typography
          variant="h4"
          sx={{ fontWeight: 800, mb: 1 }}
        >
          Operations Overview
        </Typography>

        <Typography
          variant="body1"
          sx={{ color: "#6b7280", mb: 3 }}
        >
          Real-time manufacturing operations summary
        </Typography>

        {/* KPI CARDS */}

        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography color="text.secondary">
                  Total Incidents
                </Typography>

                <Typography variant="h4" sx={{ fontWeight: 800, mt: 1 }}>
                  {totalIncidents}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography color="text.secondary">
                  Open Incidents
                </Typography>

                <Typography variant="h4" sx={{ fontWeight: 800, mt: 1 }}>
                  {openIncidents}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography color="text.secondary">
                  High Priority
                </Typography>

                <Typography variant="h4" sx={{ fontWeight: 800, mt: 1 }}>
                  {highPriorityIncidents}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography color="text.secondary">
                  Total Downtime
                </Typography>

                <Typography variant="h4" sx={{ fontWeight: 800, mt: 1 }}>
                  {totalDowntime} min
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* SECONDARY KPIs */}

        <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Typography color="text.secondary">
                  Production Units Affected
                </Typography>

                <Typography variant="h5" sx={{ fontWeight: 800, mt: 1 }}>
                  {totalUnitsAffected}
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

                <Typography variant="h5" sx={{ fontWeight: 800, mt: 1 }}>
                  ₹{totalProductionLoss.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Typography color="text.secondary">
                  Backend Status
                </Typography>

                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 800,
                    mt: 1,
                    color: "success.main",
                  }}
                >
                  Connected
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* CHARTS */}


<Grid container spacing={2.5} sx={{ mt: 0.5 }}>

  {/* INCIDENT STATUS */}

  <Grid size={{ xs: 12, md: 6 }}>
    <Card sx={{ height: 420 }}>
      <CardContent sx={{ height: "100%" }}>

        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            mb: 1,
          }}
        >
          Incident Status
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: "#667085",
            mb: 1,
          }}
        >
          Current distribution of reported incidents
        </Typography>

        <ResponsiveContainer width="100%" height="85%">
          <PieChart>

            <Pie
              data={statusData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="45%"
              innerRadius={75}
              outerRadius={115}
              paddingAngle={4}
              label
              labelLine={false}
            >
              {statusData.map((_, index) => (
                <Cell
                  key={`status-${index}`}
                  fill={STATUS_COLORS[index % STATUS_COLORS.length]}
                />
              ))}
            </Pie>

            <Tooltip />

            <Legend
              verticalAlign="bottom"
              height={36}
            />

          </PieChart>
        </ResponsiveContainer>

      </CardContent>
    </Card>
  </Grid>


  {/* INCIDENT PRIORITY */}

  <Grid size={{ xs: 12, md: 6 }}>
    <Card sx={{ height: 420 }}>
      <CardContent sx={{ height: "100%" }}>

        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            mb: 1,
          }}
        >
          Incident Priority
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: "#667085",
            mb: 1,
          }}
        >
          Distribution of incidents by priority level
        </Typography>

        <ResponsiveContainer width="100%" height="85%">
          <PieChart>

            <Pie
              data={priorityData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="45%"
              innerRadius={75}
              outerRadius={115}
              paddingAngle={4}
              label
              labelLine={false}
            >
              {priorityData.map((_, index) => (
                <Cell
                  key={`priority-${index}`}
                  fill={PRIORITY_COLORS[index % PRIORITY_COLORS.length]}
                />
              ))}
            </Pie>

            <Tooltip />

            <Legend
              verticalAlign="bottom"
              height={36}
            />

          </PieChart>
        </ResponsiveContainer>

      </CardContent>
    </Card>
  </Grid>


  {/* DOWNTIME */}

  <Grid size={{ xs: 12 }}>
    <Card sx={{ height: 430 }}>
      <CardContent sx={{ height: "100%" }}>

        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            mb: 1,
          }}
        >
          Downtime Duration
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: "#667085",
            mb: 2,
          }}
        >
          Duration of recorded downtime events
        </Typography>

        <ResponsiveContainer width="100%" height="82%">
          <BarChart
            data={downtimeData}
            margin={{
              top: 10,
              right: 20,
              left: 0,
              bottom: 10,
            }}
          >

            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
            />

            <XAxis
              dataKey="name"
              tick={{ fontSize: 12 }}
            />

            <YAxis
              tick={{ fontSize: 12 }}
              label={{
                value: "Minutes",
                angle: -90,
                position: "insideLeft",
              }}
            />

            <Tooltip />

            <Bar
              dataKey="duration"
              name="Downtime"
              radius={[8, 8, 0, 0]}
              fill="#2563eb"
            />

          </BarChart>
        </ResponsiveContainer>

      </CardContent>
    </Card>
  </Grid>

 </Grid>
  </>
)}
      </Box>
    </Box>
  );
}

export default App;