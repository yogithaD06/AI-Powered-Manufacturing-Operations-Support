import { useCallback, useEffect, useState } from "react";

import { Autorenew, Psychology } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Typography,
} from "@mui/material";

import { mlApi, mlErrorMessage, type ModelInfo } from "../../api/ml";

const MODEL_LABELS: Record<string, string> = {
  category: "Category",
  priority: "Priority",
  root_cause_category: "Root cause (6M)",
};

const pct = (value: number) => `${Math.round(value * 100)}%`;

/** Model versions, honest evaluation scores and the feedback -> retrain loop. */
export default function ModelStatusCard() {
  const [info, setInfo] = useState<ModelInfo | null>(null);
  const [error, setError] = useState("");
  const [retraining, setRetraining] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await mlApi.modelInfo();
      setInfo(data);
      setRetraining(data.retrain.running);
      setError("");
    } catch (err) {
      setError(mlErrorMessage(err));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    mlApi
      .modelInfo()
      .then((data) => {
        if (cancelled) return;
        setInfo(data);
        setRetraining(data.retrain.running);
      })
      .catch((err) => {
        if (!cancelled) setError(mlErrorMessage(err));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // While a retrain runs on the server, poll until it finishes, then reload.
  useEffect(() => {
    if (!retraining) return;
    const timer = setInterval(async () => {
      try {
        const status = await mlApi.retrainStatus();
        if (!status.running) {
          clearInterval(timer);
          await load();
          if (status.last_error) setError(`Retrain failed: ${status.last_error}`);
        }
      } catch (err) {
        clearInterval(timer);
        setRetraining(false);
        setError(mlErrorMessage(err));
      }
    }, 2000);
    return () => clearInterval(timer);
  }, [retraining, load]);

  const retrain = async () => {
    try {
      setError("");
      await mlApi.retrain();
      setRetraining(true);
    } catch (err) {
      setError(mlErrorMessage(err));
    }
  };

  return (
    <Card>
      <CardContent sx={{ textAlign: "left" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2, flexWrap: "wrap" }}>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Psychology sx={{ color: "#6d28d9" }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                ML Models
              </Typography>
              <Typography variant="body2" sx={{ color: "#667085" }}>
                {info
                  ? `${info.model_version} · trained on ${info.rows} incidents (${info.feedback_rows} from approved RCA/CAPA)`
                  : "Loading model status…"}
              </Typography>
            </Box>
          </Box>

          {info && (
            <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
              <Chip
                size="small"
                color={info.feedback.pending_retrain > 0 ? "secondary" : "default"}
                label={`${info.feedback.pending_retrain} new approvals waiting`}
              />
              <Button
                variant="contained"
                color="secondary"
                size="small"
                startIcon={<Autorenew />}
                disabled={retraining}
                onClick={retrain}
              >
                {retraining ? "Retraining…" : "Retrain models"}
              </Button>
            </Box>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {info && (
          <>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
                gap: 2,
                mt: 2,
              }}
            >
              {Object.entries(info.classifiers).map(([key, m]) => (
                <Box key={key} sx={{ border: "1px solid #e7ebf2", borderRadius: 2, p: 1.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    {MODEL_LABELS[key] ?? key} classifier
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>
                    {pct(m.accuracy)}
                    <Typography component="span" variant="body2" color="text.secondary">
                      {" "}accuracy
                    </Typography>
                  </Typography>
                  <Typography variant="caption" color="text.secondary" component="div">
                    Macro F1 {pct(m.macro_f1)} · always-guess-most-common baseline {pct(m.baseline_accuracy)}
                  </Typography>
                  {m.out_of_template_accuracy !== undefined && (
                    <Typography variant="caption" color="text.secondary" component="div">
                      Hand-written test incidents: {pct(m.out_of_template_accuracy)} ({m.out_of_template_rows} cases)
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>

            <Alert severity="info" sx={{ mt: 2 }}>
              {info.note}
            </Alert>
          </>
        )}
      </CardContent>
    </Card>
  );
}
