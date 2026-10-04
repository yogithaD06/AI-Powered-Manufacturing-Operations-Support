import type { ReactNode } from "react";

import { AutoAwesome, ContentCopy, WarningAmber } from "@mui/icons-material";
import {
  Alert,
  Box,
  Chip,
  LinearProgress,
  Tooltip,
  Typography,
} from "@mui/material";

import type { SimilarIncident } from "../../api/ml";

const ACCENT = "#6d28d9";

function confidenceLevel(value: number) {
  if (value >= 0.75) return { label: "High", color: "#16a34a" };
  if (value >= 0.5) return { label: "Medium", color: "#d97706" };
  return { label: "Low", color: "#dc2626" };
}

/** Bordered panel that marks its content as an AI suggestion (needs human review). */
export function AIPanel({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Box
      sx={{
        textAlign: "left",
        border: "1px solid #ddd6fe",
        backgroundColor: "#faf8ff",
        borderRadius: 2,
        p: 2,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 1,
          flexWrap: "wrap",
          mb: 1.5,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <AutoAwesome sx={{ color: ACCENT, fontSize: 20 }} />
          <Box>
            <Typography sx={{ fontWeight: 700, color: "#3b0764" }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
        {action}
      </Box>
      {children}
    </Box>
  );
}

/** Probability as a bar + "High / Medium / Low confidence" label. */
export function ConfidenceBar({ value }: { value: number }) {
  const level = confidenceLevel(value);

  return (
    <Tooltip title="Model probability for this prediction">
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 160 }}>
        <LinearProgress
          variant="determinate"
          value={Math.round(value * 100)}
          sx={{
            flexGrow: 1,
            height: 8,
            borderRadius: 4,
            backgroundColor: "#ede9fe",
            "& .MuiLinearProgress-bar": { backgroundColor: level.color },
          }}
        />
        <Typography
          variant="caption"
          sx={{ fontWeight: 700, color: level.color, whiteSpace: "nowrap" }}
        >
          {Math.round(value * 100)}% · {level.label}
        </Typography>
      </Box>
    </Tooltip>
  );
}

/** Marks a draft as assembled from similar resolved incidents (needs human review). */
export function DraftSourceBadge() {
  return (
    <Tooltip title="Root causes and actions are taken from the most similar resolved incidents">
      <Chip
        size="small"
        label="Built from similar past incidents"
        variant="outlined"
        sx={{ fontWeight: 600, color: ACCENT, borderColor: "#c4b5fd" }}
      />
    </Tooltip>
  );
}

/** Keywords that pushed the classifier toward its answer. */
export function Keywords({ words }: { words: string[] }) {
  if (words.length === 0) return null;

  return (
    <Typography variant="caption" color="text.secondary">
      Why: {words.map((w) => `"${w}"`).join(", ")}
    </Typography>
  );
}

export function SimilarIncidentList({
  incidents,
  showResolution = true,
}: {
  incidents: SimilarIncident[];
  showResolution?: boolean;
}) {
  const duplicates = incidents.filter((i) => i.possible_duplicate);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {duplicates.length > 0 && (
        <Alert severity="warning" icon={<WarningAmber />} sx={{ py: 0 }}>
          Possible duplicate of {duplicates.map((d) => d.ticket_id).join(", ")}
        </Alert>
      )}

      {incidents.map((incident) => (
        <Box
          key={incident.ticket_id}
          sx={{
            backgroundColor: "#ffffff",
            border: "1px solid #ede9fe",
            borderRadius: 1.5,
            p: 1.25,
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              gap: 1,
              flexWrap: "wrap",
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {incident.ticket_id} · {incident.title}
            </Typography>
            <Box sx={{ display: "flex", gap: 0.5 }}>
              {incident.source === "approved_feedback" && (
                <Chip size="small" color="success" label="Approved RCA" />
              )}
              <Chip
                size="small"
                icon={<ContentCopy sx={{ fontSize: 14 }} />}
                label={`${Math.round(incident.similarity * 100)}% similar`}
                variant="outlined"
              />
            </Box>
          </Box>

          {showResolution && incident.root_cause && (
            <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 0.5 }}>
              <strong>Root cause ({incident.root_cause_category}):</strong>{" "}
              {incident.root_cause}
              {incident.resolution_hours !== null &&
                ` · fixed in ${incident.resolution_hours} h by ${incident.assigned_to}`}
            </Typography>
          )}
        </Box>
      ))}
    </Box>
  );
}
