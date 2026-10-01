import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Divider,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Typography,
} from "@mui/material";

import {
  ArrowForward,
  LockOutlined,
  MailOutlined,
  Visibility,
  VisibilityOff,
  FactoryOutlined,
  SpeedOutlined,
  InsightsOutlined,
} from "@mui/icons-material";

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault();

    setError("");

    if (!identifier.trim() || !password.trim()) {
      setError("Please enter your employee ID/email and password.");
      return;
    }

    setLoading(true);

    // UI-only login for now.
    // Backend authentication will be implemented later.
    setTimeout(() => {
      setLoading(false);
      onLogin();
    }, 900);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #07111f 0%, #0b1b31 45%, #102b4c 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: { xs: 2, md: 4 },
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient background */}
      <Box
        sx={{
          position: "absolute",
          width: 420,
          height: 420,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(46,125,255,0.18) 0%, rgba(46,125,255,0) 70%)",
          top: -180,
          right: -100,
          pointerEvents: "none",
        }}
      />

      <Box
        sx={{
          position: "absolute",
          width: 360,
          height: 360,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(0,188,212,0.12) 0%, rgba(0,188,212,0) 70%)",
          bottom: -180,
          left: -100,
          pointerEvents: "none",
        }}
      />

      <Paper
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 1120,
          minHeight: { md: 650 },
          borderRadius: { xs: 4, md: 5 },
          overflow: "hidden",
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1.05fr 0.95fr" },
          background: "#ffffff",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 30px 90px rgba(0,0,0,0.30)",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* LEFT — BRAND */}
        <Box
          sx={{
            display: { xs: "none", md: "flex" },
            flexDirection: "column",
            justifyContent: "space-between",
            p: { md: 6, lg: 7 },
            color: "#ffffff",
            background:
              "linear-gradient(145deg, #0b1b31 0%, #102b4c 55%, #123b62 100%)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Decorative grid */}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              opacity: 0.08,
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)",
              backgroundSize: "42px 42px",
            }}
          />

          <Box sx={{ position: "relative", zIndex: 1 }}>
            {/* Brand */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                mb: 7,
              }}
            >
              <Box
                sx={{
                  width: 46,
                  height: 46,
                  borderRadius: 2.5,
                  display: "grid",
                  placeItems: "center",
                  background:
                    "linear-gradient(135deg, #2f80ed 0%, #00b8d9 100%)",
                  boxShadow: "0 10px 30px rgba(47,128,237,0.3)",
                }}
              >
                <FactoryOutlined sx={{ fontSize: 27 }} />
              </Box>

              <Box>
                <Typography
                  sx={{
                    fontSize: 18,
                    fontWeight: 800,
                    letterSpacing: 0.3,
                  }}
                >
                  MES OPERATIONS
                </Typography>

                <Typography
                  sx={{
                    fontSize: 11,
                    color: "rgba(255,255,255,0.62)",
                    letterSpacing: 1.8,
                    fontWeight: 600,
                  }}
                >
                  SUPPORT PLATFORM
                </Typography>
              </Box>
            </Box>

            <Typography
              sx={{
                fontSize: { md: 34, lg: 42 },
                lineHeight: 1.12,
                fontWeight: 800,
                letterSpacing: -1,
                maxWidth: 500,
                mb: 2.5,
              }}
            >
              Manufacturing operations,
              <br />
              <Box component="span" sx={{ color: "#5bbcff" }}>
                intelligently connected.
              </Box>
            </Typography>

            <Typography
              sx={{
                color: "rgba(255,255,255,0.68)",
                fontSize: 15,
                lineHeight: 1.8,
                maxWidth: 500,
              }}
            >
              A unified operations support platform for incidents, tickets,
              downtime, root cause analysis, corrective actions and
              manufacturing intelligence.
            </Typography>
          </Box>

          {/* Feature highlights */}
          <Box
            sx={{
              position: "relative",
              zIndex: 1,
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 1.5,
              mt: 6,
            }}
          >
            {[
              {
                icon: <SpeedOutlined />,
                title: "Operations",
                text: "Real-time visibility",
              },
              {
                icon: <InsightsOutlined />,
                title: "Intelligence",
                text: "Data-driven insights",
              },
              {
                icon: <FactoryOutlined />,
                title: "Manufacturing",
                text: "Connected workflows",
              },
            ].map((item) => (
              <Box
                key={item.title}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  background: "rgba(255,255,255,0.055)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <Box
                  sx={{
                    color: "#65c7ff",
                    display: "flex",
                    mb: 1,
                  }}
                >
                  {item.icon}
                </Box>

                <Typography
                  sx={{
                    fontSize: 13,
                    fontWeight: 700,
                    mb: 0.3,
                  }}
                >
                  {item.title}
                </Typography>

                <Typography
                  sx={{
                    fontSize: 11,
                    color: "rgba(255,255,255,0.52)",
                  }}
                >
                  {item.text}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* RIGHT — LOGIN */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            p: { xs: 3, sm: 5, md: 6, lg: 7 },
            background: "#ffffff",
          }}
        >
          {/* Mobile brand */}
          <Box
            sx={{
              display: { xs: "flex", md: "none" },
              alignItems: "center",
              gap: 1.5,
              mb: 5,
            }}
          >
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2.5,
                display: "grid",
                placeItems: "center",
                background: "linear-gradient(135deg, #2f80ed, #00b8d9)",
                color: "#ffffff",
              }}
            >
              <FactoryOutlined />
            </Box>

            <Box>
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: 16,
                  color: "#101828",
                }}
              >
                MES OPERATIONS
              </Typography>

              <Typography
                sx={{
                  fontSize: 10,
                  letterSpacing: 1.5,
                  color: "#98A2B3",
                  fontWeight: 700,
                }}
              >
                SUPPORT PLATFORM
              </Typography>
            </Box>
          </Box>

          <Box sx={{ maxWidth: 420, width: "100%", mx: "auto" }}>
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 700,
                color: "#2F80ED",
                letterSpacing: 0.8,
                textTransform: "uppercase",
                mb: 1,
              }}
            >
              Secure access
            </Typography>

            <Typography
              sx={{
                fontSize: { xs: 30, md: 34 },
                fontWeight: 800,
                color: "#101828",
                letterSpacing: -0.8,
                mb: 1,
              }}
            >
              Welcome back
            </Typography>

            <Typography
              sx={{
                fontSize: 14,
                color: "#667085",
                lineHeight: 1.7,
                mb: 4,
              }}
            >
              Sign in to access your manufacturing operations workspace.
            </Typography>

            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 2.5,
                  borderRadius: 2.5,
                }}
              >
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleLogin}>
              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#344054",
                  mb: 1,
                }}
              >
                Employee ID or email
              </Typography>

              <TextField
                fullWidth
                size="medium"
                placeholder="Enter your employee ID or email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                disabled={loading}
                sx={{
                  mb: 2.5,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2.5,
                    backgroundColor: "#F9FAFB",
                    "& fieldset": {
                      borderColor: "#E4E7EC",
                    },
                    "&:hover fieldset": {
                      borderColor: "#B8C1CC",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#2F80ED",
                      borderWidth: 1,
                    },
                  },
                }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <MailOutlined sx={{ color: "#98A2B3" }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#344054",
                  mb: 1,
                }}
              >
                Password
              </Typography>

              <TextField
                fullWidth
                size="medium"
                placeholder="Enter your password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2.5,
                    backgroundColor: "#F9FAFB",
                    "& fieldset": {
                      borderColor: "#E4E7EC",
                    },
                    "&:hover fieldset": {
                      borderColor: "#B8C1CC",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#2F80ED",
                      borderWidth: 1,
                    },
                  },
                }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlined sx={{ color: "#98A2B3" }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          type="button"
                          onClick={() =>
                            setShowPassword((prev) => !prev)
                          }
                          edge="end"
                          disabled={loading}
                          aria-label={
                            showPassword
                              ? "Hide password"
                              : "Show password"
                          }
                        >
                          {showPassword ? (
                            <VisibilityOff />
                          ) : (
                            <Visibility />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mt: 1.5,
                  mb: 3.5,
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={rememberMe}
                      onChange={(e) =>
                        setRememberMe(e.target.checked)
                      }
                      size="small"
                    />
                  }
                  label={
                    <Typography
                      sx={{
                        fontSize: 13,
                        color: "#667085",
                      }}
                    >
                      Remember me
                    </Typography>
                  }
                />

                <Button
                  type="button"
                  variant="text"
                  sx={{
                    textTransform: "none",
                    fontWeight: 700,
                    fontSize: 13,
                    color: "#2F80ED",
                    minWidth: 0,
                    p: 0.5,
                  }}
                >
                  Forgot password?
                </Button>
              </Box>

              <Button
                fullWidth
                type="submit"
                variant="contained"
                disabled={loading}
                endIcon={
                  loading ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <ArrowForward />
                  )
                }
                sx={{
                  height: 52,
                  borderRadius: 2.5,
                  textTransform: "none",
                  fontSize: 15,
                  fontWeight: 700,
                  background:
                    "linear-gradient(135deg, #2F80ED 0%, #1769D1 100%)",
                  boxShadow: "0 10px 24px rgba(47,128,237,0.24)",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #2674DB 0%, #155DB8 100%)",
                    boxShadow:
                      "0 12px 28px rgba(47,128,237,0.30)",
                  },
                }}
              >
                {loading ? "Signing in..." : "Sign in to workspace"}
              </Button>
            </Box>

            <Divider sx={{ my: 3.5 }}>
              <Typography
                sx={{
                  fontSize: 11,
                  color: "#98A2B3",
                  fontWeight: 600,
                  px: 1,
                }}
              >
                MES OPERATIONS SUPPORT
              </Typography>
            </Divider>

            <Typography
              sx={{
                textAlign: "center",
                fontSize: 12,
                color: "#98A2B3",
                lineHeight: 1.6,
              }}
            >
              Secure workspace for manufacturing operations and support
              activities.
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}