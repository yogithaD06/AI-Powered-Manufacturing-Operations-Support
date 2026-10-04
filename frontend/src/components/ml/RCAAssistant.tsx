import { useState } from "react";

import { AutoAwesome, East, PlaylistAddCheck } from "@mui/icons-material";
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

import { mlApi, mlErrorMessage, type RCAResult } from "../../api/ml";
import {
  AIPanel,
  ConfidenceBar,
  DraftSourceBadge,
  Keywords,
  SimilarIncidentList,
} from "./common";
import { useIncidentText } from "./useIncidentText";

export interface RCAFormValues {
  investigation_method: string;
  evidence_observations: string;
  contributing_factors: string;
  root_cause: string;
  root_cause_category: string;
  corrective_action_required: string;
  rca_findings: string;
}

interface Props {
  incidentId: string;
  /** Fill the RCA form with the draft; the incident text is passed for the feedback loop. */
  onApply: (values: RCAFormValues, incident: { title: string; description: string }) => void;
}

function toFormValues(result: RCAResult): RCAFormValues {
  const { draft, similar_incidents } = result;
  const whys = draft.five_whys
    .map((step, i) => `Why ${i + 1}: ${step.question}\n  -> ${step.answer}`)
    .join("\n");

  return {
    investigation_method: "5-Why (AI-assisted)",
    evidence_observations: `Similar past incidents: ${similar_incidents
      .map((s) => `${s.ticket_id} (${Math.round(s.similarity * 100)}%)`)
      .join(", ")}`,
    contributing_factors: draft.contributing_factors.join("; "),
    root_cause: draft.root_cause,
    root_cause_category: draft.root_cause_category,
    corrective_action_required: draft.containment_action,
    rca_findings: `${draft.problem_statement}\n\n${whys}\n\n${draft.confidence_note}`,
  };
}

export default function RCAAssistant({ incidentId, onApply }: Props) {
  const incident = useIncidentText(incidentId);
  const [result, setResult] = useState<RCAResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [applied, setApplied] = useState(false);

  const analyze = async () => {
    setLoading(true);
    setError("");
    setApplied(false);
    try {
      setResult(
        await mlApi.rca({ title: incident.title, description: incident.description })
      );
    } catch (err) {
      setError(mlErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const apply = () => {
    if (!result) return;
    onApply(toFormValues(result), {
      title: incident.title,
      description: incident.description,
    });
    setApplied(true);
  };

  const prediction = result?.prediction.root_cause_category;

  return (
    <AIPanel
      title="AI Root Cause Assistant"
      subtitle="Predicts the 6M root-cause category, finds similar resolved incidents and drafts a 5-Why"
      action={result && <DraftSourceBadge />}
    >
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 2fr auto" }, gap: 1.5 }}>
        <TextField
          size="small"
          label="Incident title"
          value={incident.title}
          onChange={(e) => incident.setTitle(e.target.value)}
          helperText={
            incident.lookup === "found"
              ? `Loaded from incident #${incidentId}`
              : incident.lookup === "missing"
              ? "Incident not found - type the problem here"
              : "Enter an Incident ID above, or type the problem"
          }
        />
        <TextField
          size="small"
          label="What happened?"
          value={incident.description}
          onChange={(e) => incident.setDescription(e.target.value)}
          multiline
          maxRows={3}
        />
        <Button
          variant="contained"
          color="secondary"
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <AutoAwesome />}
          disabled={loading || incident.title.trim().length < 5}
          onClick={analyze}
          sx={{ alignSelf: "flex-start", whiteSpace: "nowrap" }}
        >
          {loading ? "Analyzing…" : result ? "Re-analyze" : "Analyze"}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 1.5 }}>
          {error}
        </Alert>
      )}

      {result && prediction && (
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
            <Box>
              <Typography variant="body2">
                Predicted root-cause category: <strong>{prediction.label}</strong>
              </Typography>
              <ConfidenceBar value={prediction.confidence} />
              <Keywords words={prediction.keywords} />
              <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mt: 1 }}>
                {prediction.alternatives.slice(1, 4).map((alt) => (
                  <Chip
                    key={alt.label}
                    size="small"
                    variant="outlined"
                    label={`${alt.label} ${Math.round(alt.probability * 100)}%`}
                  />
                ))}
              </Box>
            </Box>

            <Box>
              <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
                Similar resolved incidents
              </Typography>
              <SimilarIncidentList incidents={result.similar_incidents.slice(0, 3)} />
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            Draft 5-Why analysis
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {result.draft.problem_statement}
          </Typography>

          <Box sx={{ display: "grid", gap: 0.75 }}>
            {result.draft.five_whys.map((step, i) => (
              <Box
                key={i}
                sx={{
                  display: "grid",
                  gridTemplateColumns: "56px 1fr",
                  gap: 1,
                  backgroundColor: "#ffffff",
                  border: "1px solid #ede9fe",
                  borderRadius: 1.5,
                  p: 1,
                }}
              >
                <Chip size="small" label={`Why ${i + 1}`} color="secondary" variant="outlined" />
                <Box>
                  <Typography variant="body2">{step.question}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ display: "flex", gap: 0.5 }}>
                    <East sx={{ fontSize: 16, mt: "2px" }} /> {step.answer}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>

          <Box sx={{ mt: 1.5, display: "grid", gap: 0.5 }}>
            <Typography variant="body2">
              <strong>Root cause ({result.draft.root_cause_category}):</strong> {result.draft.root_cause}
            </Typography>
            <Typography variant="body2">
              <strong>Contributing factors:</strong> {result.draft.contributing_factors.join("; ")}
            </Typography>
            <Typography variant="body2">
              <strong>Immediate containment:</strong> {result.draft.containment_action}
            </Typography>
          </Box>

          <Alert severity="info" sx={{ mt: 1.5 }}>
            {result.draft.confidence_note}
          </Alert>

          <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 1, mt: 1.5 }}>
            {applied && (
              <Typography variant="caption" color="text.secondary">
                Draft copied into the form below. Edit it, then save to approve.
              </Typography>
            )}
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<PlaylistAddCheck />}
              onClick={apply}
            >
              Use this draft
            </Button>
          </Box>
        </Box>
      )}
    </AIPanel>
  );
}
