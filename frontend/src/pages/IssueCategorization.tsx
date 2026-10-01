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
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Snackbar,
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
  Category,
  Edit,
  Refresh,
  Search,
  WarningAmber,
} from "@mui/icons-material";

interface IssueCategory {
  category_id: number;
  category_name: string;
  subcategory_name: string | null;
  description: string | null;
  severity_level: string | null;
  status: string;
  created_at?: string;
}

const API_URL = "/api/issue-categories/";

const emptyForm = {
  category_name: "",
  subcategory_name: "",
  description: "",
  severity_level: "MEDIUM",
  status: "ACTIVE",
};

export default function IssueCategorization() {
  const [categories, setCategories] = useState<IssueCategory[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");

  const [openDialog, setOpenDialog] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<IssueCategory | null>(null);

  const [formData, setFormData] = useState(emptyForm);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  const fetchCategories = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        `${API_URL}?skip=0&limit=100`
      );

      setCategories(response.data);
    } catch (error) {
      console.error("Failed to fetch issue categories:", error);

      setSnackbar({
        open: true,
        message: "Failed to load issue categories.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const filteredCategories = useMemo(() => {
    const value = search.toLowerCase().trim();

    if (!value) return categories;

    return categories.filter((category) =>
      [
        category.category_id,
        category.category_name,
        category.subcategory_name,
        category.description,
        category.severity_level,
        category.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(value)
    );
  }, [categories, search]);

  const totalCategories = categories.length;

  const activeCategories = categories.filter(
    (category) => category.status === "ACTIVE"
  ).length;

  const highSeverityCategories = categories.filter(
    (category) => category.severity_level === "HIGH"
  ).length;

  const openCreateDialog = () => {
    setEditingCategory(null);
    setFormData(emptyForm);
    setOpenDialog(true);
  };

  const openEditDialog = (category: IssueCategory) => {
    setEditingCategory(category);

    setFormData({
      category_name: category.category_name || "",
      subcategory_name: category.subcategory_name || "",
      description: category.description || "",
      severity_level: category.severity_level || "MEDIUM",
      status: category.status || "ACTIVE",
    });

    setOpenDialog(true);
  };

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    try {
      const payload = {
        category_name: formData.category_name,
        subcategory_name: formData.subcategory_name || null,
        description: formData.description || null,
        severity_level: formData.severity_level,
        status: formData.status,
      };

      if (editingCategory) {
        await axios.put(
          `${API_URL}${editingCategory.category_id}`,
          payload
        );

        setSnackbar({
          open: true,
          message: "Issue category updated successfully.",
          severity: "success",
        });
      } else {
        await axios.post(API_URL, payload);

        setSnackbar({
          open: true,
          message: "Issue category created successfully.",
          severity: "success",
        });
      }

      setOpenDialog(false);
      setFormData(emptyForm);
      setEditingCategory(null);

      await fetchCategories();
    } catch (error: any) {
      console.error("Failed to save issue category:", error);

      const message =
        error?.response?.data?.detail ||
        "Failed to save issue category.";

      setSnackbar({
        open: true,
        message: String(message),
        severity: "error",
      });
    }
  };

  const getSeverityColor = (
    severity: string | null
  ): "error" | "warning" | "success" | "default" => {
    switch (severity) {
      case "HIGH":
        return "error";
      case "MEDIUM":
        return "warning";
      case "LOW":
        return "success";
      default:
        return "default";
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
<Box
  sx={{
    mb: 3,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 2,
  }}
>
  <Box>
    <Typography
      variant="h4"
      sx={{ fontWeight: 700, mb: 0.5 }}
    >
      Issue Categorization
    </Typography>

    <Typography variant="body2" color="text.secondary">
      Manage issue categories, subcategories, severity levels and
      status.
    </Typography>
  </Box>

  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      gap: 1,
    }}
  >
    <IconButton
      onClick={fetchCategories}
      disabled={loading}
      sx={{
        border: "1px solid #d9dee8",
        borderRadius: 2,
      }}
    >
      <Refresh />
    </IconButton>

    <Button
      variant="contained"
      startIcon={<Add />}
      onClick={openCreateDialog}
    >
      New Category
    </Button>
  </Box>
</Box>

{/* KPI Cards */}
<Grid container spacing={2} sx={{ mb: 3 }}>
  <Grid size={{ xs: 12, md: 4 }}>
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
            <Typography
              variant="body2"
              color="text.secondary"
            >
              Total Categories
            </Typography>

            <Typography
              variant="h4"
              sx={{ fontWeight: 700, mt: 1 }}
            >
              {totalCategories}
            </Typography>
          </Box>

          <Category
            sx={{
              fontSize: 38,
              opacity: 0.65,
            }}
          />
        </Box>
      </CardContent>
    </Card>
  </Grid>

  <Grid size={{ xs: 12, md: 4 }}>
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
            <Typography
              variant="body2"
              color="text.secondary"
            >
              Active Categories
            </Typography>

            <Typography
              variant="h4"
              sx={{ fontWeight: 700, mt: 1 }}
            >
              {activeCategories}
            </Typography>
          </Box>

          <Category
            sx={{
              fontSize: 38,
              opacity: 0.65,
            }}
          />
        </Box>
      </CardContent>
    </Card>
  </Grid>

  <Grid size={{ xs: 12, md: 4 }}>
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
            <Typography
              variant="body2"
              color="text.secondary"
            >
              High Severity
            </Typography>

            <Typography
              variant="h4"
              sx={{ fontWeight: 700, mt: 1 }}
            >
              {highSeverityCategories}
            </Typography>
          </Box>

          <WarningAmber
            sx={{
              fontSize: 38,
              opacity: 0.65,
            }}
          />
        </Box>
      </CardContent>
    </Card>
  </Grid>
</Grid>
      {/* Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Search category, subcategory, severity or status..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
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

      {/* Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>
                    ID
                  </TableCell>

                  <TableCell sx={{ fontWeight: 700 }}>
                    Category
                  </TableCell>

                  <TableCell sx={{ fontWeight: 700 }}>
                    Subcategory
                  </TableCell>

                  <TableCell sx={{ fontWeight: 700 }}>
                    Description
                  </TableCell>

                  <TableCell sx={{ fontWeight: 700 }}>
                    Severity
                  </TableCell>

                  <TableCell sx={{ fontWeight: 700 }}>
                    Status
                  </TableCell>

                  <TableCell
                    align="center"
                    sx={{ fontWeight: 700 }}
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {filteredCategories.map((category) => (
                  <TableRow
                    key={category.category_id}
                    hover
                  >
                    <TableCell>
                      #{category.category_id}
                    </TableCell>

                    <TableCell>
                      <Typography sx={{ fontWeight: 600 }}>
                        {category.category_name}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      {category.subcategory_name || "—"}
                    </TableCell>

                    <TableCell>
                      {category.description || "—"}
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={category.severity_level || "—"}
                        size="small"
                        color={getSeverityColor(
                          category.severity_level
                        )}
                      />
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={category.status}
                        size="small"
                        color={
                          category.status === "ACTIVE"
                            ? "success"
                            : "default"
                        }
                      />
                    </TableCell>

                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() =>
                          openEditDialog(category)
                        }
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}

                {filteredCategories.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      align="center"
                    >
                      <Typography
                        color="text.secondary"
                        sx={{ py: 5 }}
                      >
                        No issue categories found.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingCategory
            ? "Edit Issue Category"
            : "Create Issue Category"}
        </DialogTitle>

<DialogContent>
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      gap: 2,
      mt: 1,
    }}
  >

    {/* Category Name */}
    <TextField
  label="Category Name"
  name="category_name"
  value={formData.category_name}
  onChange={(event) =>
    setFormData((previous) => ({
      ...previous,
      category_name: event.target.value,
    }))
  }
  fullWidth
  required
/>

    {/* Subcategory Name */}
    <TextField
      label="Subcategory Name"
      name="subcategory_name"
      value={formData.subcategory_name}
      onChange={handleChange}
      fullWidth
    />

    <TextField
      label="Description"
      name="description"
      value={formData.description}
      onChange={handleChange}
      fullWidth
      multiline
      minRows={3}
    />

            <TextField
              select
              label="Severity Level"
              name="severity_level"
              value={formData.severity_level}
              onChange={handleChange}
              fullWidth
            >
              <MenuItem value="LOW">LOW</MenuItem>
              <MenuItem value="MEDIUM">MEDIUM</MenuItem>
              <MenuItem value="HIGH">HIGH</MenuItem>
              <MenuItem value="CRITICAL">CRITICAL</MenuItem>
            </TextField>

            <TextField
  select
  label="Status"
  name="status"
  value={formData.status}
  onChange={handleChange}
  fullWidth
>
  <MenuItem value="ACTIVE">ACTIVE</MenuItem>
  <MenuItem value="INACTIVE">INACTIVE</MenuItem>
</TextField>
</Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
  <Button onClick={() => setOpenDialog(false)}>
    Cancel
  </Button>

  <Button
    variant="contained"
    onClick={handleSave}
  >
    {editingCategory ? "Update Category" : "Save Category"}
  </Button>
</DialogActions>
      </Dialog>

      {/* Snackbar */}
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