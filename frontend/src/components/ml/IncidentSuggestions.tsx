import { useEffect, useState } from "react";

import { CheckCircle, PersonAdd } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  LinearProgress,
  Typography,
} from "@mui/material";

import {
  mlApi,
  mlErrorMessage,
  type AssigneeCandidate,
  type AssigneeRecommendation,
  type Classification,
  type SimilarIncident,
} from "../../api/ml";
import {
  AIPanel,
  ConfidenceBar,
  Keywords,
  SimilarIncidentList,
} from "./common";

interface Suggestions {
  key: string;
  classification: Classification;
  similar: SimilarIncident[];
  assignee: AssigneeRecommendation;
}

interface Props {
  title: string;
  description: string;
  /** Called whenever fresh predictions arrive (the parent may auto-fill fields). */
  onPrediction?: (classification: Classification) => void;
  onApplyCategory: (category: string) => void;
  onApplyPriority: (priority: string) => void;
}

const MIN_TITLE_LENGTH = 5;
const DEBOUNCE_MS = 700;

function ScoreRow({ label, value }: { label: string; value: number }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Typography variant="caption" sx={{ width: 78, color: "text.secondary" }}>
        {label}
      </Typography>
      <LinearProgress
        variant="determinate"
        value={value * 100}
        sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
      />
    </Box>
  );
}

function AssigneeCard({
  candidate,
  best,
  accepted,
  onAccept,
}: {
  candidate: AssigneeCandidate;
  best: boolean;
  accepted: boolean;
  onAccept: () => void;
}) {
  return (
    <Box
      sx={{
        backgroundColor: "#ffffff",
        border: best ? "1px solid #a78bfa" : "1px solid #ede9fe",
        borderRadius: 1.5,
        p: 1.25,
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
        <Box>
          <Typography variant="body2" component="div" sx={{ fontWeight: 700 }}>
            {candidate.name}{" "}
            {best && <Chip size="small" label="Best match" color="secondary" sx={{ ml: 0.5 }} />}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {candidate.role} · score {Math.round(candidate.score * 100)}/100
          </Typography>
        </Box>
        <Button
          size="small"
          variant={best ? "contained" : "outlined"}
          color="secondary"
          startIcon={accepted ? <CheckCircle /> : <PersonAdd />}
          disabled={accepted}
          onClick={onAccept}
        >
          {accepted ? "Assigned" : "Assign"}
        </Button>
      </Box>

      <Box sx={{ mt: 1, display: "grid", gap: 0.5 }}>
        <ScoreRow label="Skill match" value={candidate.components.skill_match} />
        <ScoreRow label="Experience" value={candidate.components.experience} />
        <ScoreRow label="Availability" value={candidate.components.availability} />
      </Box>

      <Box component="ul" sx={{ m: 0, mt: 1, pl: 2.5 }}>
        {candidate.reasons.map((reason) => (
          <Typography component="li" variant="caption" key={reason} color="text.secondary">
            {reason}
          </Typography>
        ))}
      </Box>
    </Box>
  );
}

export default function IncidentSuggestions({
  title,
  description,
  onPrediction,
  onApplyCategory,
  onApplyPriority,
}: Props) {
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [acceptedEngineer, setAcceptedEngineer] = useState<string | null>(null);

  const key = `${title.trim()}\n${description.trim()}`;
  const ready = title.trim().length >= MIN_TITLE_LENGTH;

  useEffect(() => {
    if (!ready) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoadingKey(key);
      setError("");
      try {
        const body = { title, description };
        const [classification, similar] = await Promise.all([
          mlApi.classify(body),
          mlApi.similar({ ...body, top_k: 3 }),
        ]);
        const assignee = await mlApi.recommendAssignee({
          ...body,
          category: classification.category.label,
        });
        if (cancelled) return;
        setSuggestions({ key, classification, similar, assignee });
        setAcceptedEngineer(null);
        onPrediction?.(classification);
      } catch (err) {
        if (!cancelled) setError(mlErrorMessage(err));
      } finally {
        if (!cancelled) setLoadingKey(null);
      }
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // onPrediction is intentionally excluded: a new callback identity must not refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ready]);

  const handleAccept = async (engineer: string) => {
    try {
      await mlApi.acceptAssignment(engineer, title);
      setAcceptedEngineer(engineer);
    } catch (err) {
      setError(mlErrorMessage(err));
    }
  };

  if (!ready) {
    return (
      <AIPanel
        title="AI Suggestions"
        subtitle="Type an incident title to get category, priority and assignee suggestions"
      >
        <Typography variant="body2" color="text.secondary">
          Waiting for a title (at least {MIN_TITLE_LENGTH} characters)…
        </Typography>
      </AIPanel>
    );
  }

  const stale = suggestions !== null && suggestions.key !== key;
  const loading = loadingKey !== null || (stale && !error);

  return (
    <AIPanel
      title="AI Suggestions"
      subtitle="From models trained on past incidents. Review before saving."
      action={loading ? <CircularProgress size={18} color="secondary" /> : undefined}
    >
      {error && (
        <Alert severity="error" sx={{ mb: 1.5 }}>
          {error}
        </Alert>
      )}

      {suggestions && (
        <Box sx={{ opacity: stale ? 0.6 : 1, transition: "opacity 0.2s" }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 2,
            }}
          >
            {(["category", "priority"] as const).map((field) => {
              const prediction = suggestions.classification[field];
              const apply = field === "category" ? onApplyCategory : onApplyPriority;
              return (
                <Box key={field}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Typography variant="body2">
                      {field === "category" ? "Category" : "Priority"}:{" "}
                      <strong>{prediction.label}</strong>
                    </Typography>
                    <Button size="small" color="secondary" onClick={() => apply(prediction.label)}>
                      Apply
                    </Button>
                  </Box>
                  <ConfidenceBar value={prediction.confidence} />
                  <Keywords words={prediction.keywords} />
                </Box>
              );
            })}
          </Box>

          <Divider sx={{ my: 1.5 }} />

          <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
            Recommended assignee
          </Typography>
          <Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 1 }}>
            Score = 40% skill match + 35% experience on similar incidents + 25% availability
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
              gap: 1,
            }}
          >
            {suggestions.assignee.recommendations.map((candidate, index) => (
              <AssigneeCard
                key={candidate.name}
                candidate={candidate}
                best={index === 0}
                accepted={acceptedEngineer === candidate.name}
                onAccept={() => handleAccept(candidate.name)}
              />
            ))}
          </Box>

          <Divider sx={{ my: 1.5 }} />

          <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
            Similar past incidents
          </Typography>
          <SimilarIncidentList incidents={suggestions.similar} />
        </Box>
      )}
    </AIPanel>
  );
}
