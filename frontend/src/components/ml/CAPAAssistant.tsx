import { useEffect, useState } from "react";
import axios from "axios";

import { AutoAwesome, PlaylistAddCheck } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  TextField,
  Typography,
} from "@mui/material";

import {
  mlApi,
  mlErrorMessage,
  type CAPAAction,
  type CAPAResult,
} from "../../api/ml";
import { AIPanel, DraftSourceBadge, SimilarIncidentList } from "./common";
import { useIncidentText } from "./useIncidentText";

export type CAPAActionType = "CORRECTIVE" | "PREVENTIVE";

export interface CAPAFormValues {
  action_type: CAPAActionType;
  action_description: string;
  target_date: string;
  verification_notes: string;
}

export interface CAPAFeedbackContext {
  title: string;
  description: string;
  root_cause: string;
  root_cause_category: string;
}

interface Props {
  incidentId: string;
  onApply: (values: CAPAFormValues, context: CAPAFeedbackContext) => void;
}

interface RCARecordSummary {
  incident_id: number | null;
  root_cause: string | null;
  root_cause_category: string | null;
}

function addDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function ActionList({
  type,
  actions,
  onUse,
}: {
  type: CAPAActionType;
  actions: CAPAAction[];
  onUse: (type: CAPAActionType, action: CAPAAction) => void;
}) {
  return (
    <Box>
      <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
        {type === "CORRECTIVE" ? "Corrective actions (fix this occurrence)" : "Preventive actions (stop it recurring)"}
      </Typography>
      <Box sx={{ display: "grid", gap: 1 }}>
        {actions.map((action) => (
          <Box
            key={action.action}
            sx={{
              backgroundColor: "#ffffff",
              border: "1px solid #ede9fe",
              borderRadius: 1.5,
              p: 1.25,
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {action.action}
              </Typography>
              <Button size="small" color="secondary" onClick={() => onUse(type, action)}>
                Use
              </Button>
            </Box>
            <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", my: 0.5 }}>
              <Chip size="small" label={action.owner_role} />
              <Chip size="small" variant="outlined" label={`Due in ${action.due_in_days} days`} />
            </Box>
            <Typography variant="caption" color="text.secondary">
              Verify: {action.verification}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export default function CAPAAssistant({ incidentId, onApply }: Props) {
  const incident = useIncidentText(incidentId);
  const [rootCause, setRootCause] = useState("");
  const [rootCauseCategory, setRootCauseCategory] = useState("");
  const [rcaLoadedFor, setRcaLoadedFor] = useState<string | null>(null);
  const [result, setResult] = useState<CAPAResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [usedAction, setUsedAction] = useState<string | null>(null);

  // Pre-fill the root cause from this incident's RCA record, if one exists.
  useEffect(() => {
    const id = Number(incidentId);
    if (!incidentId || !Number.isInteger(id) || id <= 0) return;

    let cancelled = false;
    axios
      .get<RCARecordSummary[]>("/api/rca-records/?skip=0&limit=100")
      .then(({ data }) => {
        const rca = data.find((r) => r.incident_id === id && r.root_cause);
        if (cancelled || !rca) return;
        setRootCause(rca.root_cause ?? "");
        setRootCauseCategory(rca.root_cause_category ?? "");
        setRcaLoadedFor(incidentId);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [incidentId]);

  const generate = async () => {
    setLoading(true);
    setError("");
    setUsedAction(null);
    try {
      setResult(
        await mlApi.capa({
          title: incident.title,
          description: incident.description,
          root_cause_category: rootCauseCategory || null,
        })
      );
    } catch (err) {
      setError(mlErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const applyAction = (type: CAPAActionType, action: CAPAAction) => {
    if (!result) return;
    onApply(
      {
        action_type: type,
        action_description: `${action.action}\nOwner: ${action.owner_role}`,
        target_date: addDays(action.due_in_days),
        verification_notes: `${action.verification}\nEffectiveness check: ${result.draft.effectiveness_check}`,
      },
      {
        title: incident.title,
        description: incident.description,
        root_cause: rootCause,
        root_cause_category: rootCauseCategory || result.inputs.root_cause_category,
      }
    );
    setUsedAction(action.action);
  };

  return (
    <AIPanel
      title="AI CAPA Assistant"
      subtitle="Finds CAPAs that closed incidents with similar root causes and drafts corrective + preventive actions"
      action={result && <DraftSourceBadge />}
    >
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1.5 }}>
        <TextField
          size="small"
          label="Incident title"
          value={incident.title}
          onChange={(e) => incident.setTitle(e.target.value)}
          helperText={
            incident.lookup === "found"
              ? `Loaded from incident #${incidentId}`
              : "Enter an Incident ID above, or type the problem"
          }
        />
        <TextField
          size="small"
          label="What happened?"
          value={incident.description}
          onChange={(e) => incident.setDescription(e.target.value)}
        />
        <TextField
          size="small"
          label="Confirmed root cause (optional)"
          value={rootCause}
          onChange={(e) => setRootCause(e.target.value)}
          helperText={rcaLoadedFor === incidentId ? "Loaded from this incident's RCA" : undefined}
        />
        <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
          <TextField
            size="small"
            label="6M category (optional)"
            value={rootCauseCategory}
            onChange={(e) => setRootCauseCategory(e.target.value)}
            sx={{ flexGrow: 1 }}
          />
          <Button
            variant="contained"
            color="secondary"
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <AutoAwesome />}
            disabled={loading || incident.title.trim().length < 5}
            onClick={generate}
            sx={{ whiteSpace: "nowrap" }}
          >
            {loading ? "Drafting…" : result ? "Regenerate" : "Draft CAPA"}
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 1.5 }}>
          {error}
        </Alert>
      )}

      {result && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Based on root-cause category <strong>{result.inputs.root_cause_category}</strong>, priority{" "}
            <strong>{result.inputs.priority}</strong>
          </Typography>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2, mt: 1 }}>
            <ActionList type="CORRECTIVE" actions={result.draft.corrective_actions} onUse={applyAction} />
            <ActionList type="PREVENTIVE" actions={result.draft.preventive_actions} onUse={applyAction} />
          </Box>

          <Alert severity="info" sx={{ mt: 1.5 }}>
            Effectiveness check: {result.draft.effectiveness_check}
          </Alert>

          {usedAction && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 1 }}
            >
              <PlaylistAddCheck fontSize="small" /> "{usedAction}" copied into the form below. Edit it,
              then save to approve.
            </Typography>
          )}

          <Divider sx={{ my: 1.5 }} />
          <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
            Past incidents these actions come from
          </Typography>
          <SimilarIncidentList incidents={result.similar_incidents.slice(0, 3)} />
        </Box>
      )}
    </AIPanel>
  );
}
