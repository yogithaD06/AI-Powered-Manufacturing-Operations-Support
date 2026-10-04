import { useEffect, useState } from "react";

import { Refresh, TrendingDown, TrendingFlat, TrendingUp } from "@mui/icons-material";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  IconButton,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import {
  mlApi,
  mlErrorMessage,
  type RecurringCluster,
  type RecurringIssues,
} from "../../api/ml";

const BAR_COLOR = "#2563eb";

function Trend({ cluster }: { cluster: RecurringCluster }) {
  if (cluster.trend_pct === null) {
    return <Chip size="small" variant="outlined" label="New" />;
  }
  const rising = cluster.trend_pct >= 15;
  const falling = cluster.trend_pct <= -15;
  const Icon = rising ? TrendingUp : falling ? TrendingDown : TrendingFlat;
  return (
    <Chip
      size="small"
      variant="outlined"
      color={rising ? "warning" : "default"}
      icon={<Icon />}
      label={`${cluster.trend_pct > 0 ? "+" : ""}${Math.round(cluster.trend_pct)}% vs previous`}
    />
  );
}

/** Recurring issue types found by clustering incident text (K-Means on sentence embeddings). */
export default function RecurringIssuesCard({ limit = 6 }: { limit?: number }) {
  const [windowDays, setWindowDays] = useState(90);
  const [data, setData] = useState<RecurringIssues | null>(null);
  const [error, setError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  const requestKey = `${windowDays}:${reloadToken}`;
  const loading = loadedKey !== requestKey;

  useEffect(() => {
    let cancelled = false;
    mlApi
      .recurring(windowDays)
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setError("");
      })
      .catch((err) => {
        if (!cancelled) setError(mlErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoadedKey(`${windowDays}:${reloadToken}`);
      });
    return () => {
      cancelled = true;
    };
  }, [windowDays, reloadToken]);

  const clusters = data?.clusters.slice(0, limit) ?? [];
  const max = Math.max(1, ...clusters.map((c) => c.count));

  return (
    <Card>
      <CardContent sx={{ textAlign: "left" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2, flexWrap: "wrap", mb: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Recurring Issues
            </Typography>
            <Typography variant="body2" sx={{ color: "#667085" }}>
              Incident types grouped by meaning (ML clustering), ranked by occurrences
              {data && ` · ${data.total_incidents} incidents up to ${new Date(data.reference_date).toLocaleDateString()}`}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <TextField
              select
              size="small"
              label="Window"
              value={windowDays}
              onChange={(e) => setWindowDays(Number(e.target.value))}
            >
              <MenuItem value={30}>Last 30 days</MenuItem>
              <MenuItem value={90}>Last 90 days</MenuItem>
              <MenuItem value={180}>Last 180 days</MenuItem>
            </TextField>
            <Tooltip title="Refresh">
              <IconButton onClick={() => setReloadToken((n) => n + 1)}>
                {loading ? <CircularProgress size={20} /> : <Refresh />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {error && <Alert severity="error">{error}</Alert>}

        {!error && data && clusters.length === 0 && (
          <Typography color="text.secondary">No issue type repeated in this window.</Typography>
        )}

        <Box sx={{ display: "grid", gap: 1.5 }}>
          {clusters.map((cluster) => (
            <Tooltip
              key={cluster.cluster_id}
              placement="top-start"
              title={
                <Box>
                  <div><strong>Typical root cause ({cluster.root_cause_category}):</strong> {cluster.dominant_root_cause}</div>
                  <div>{cluster.count} incidents now, {cluster.previous_count} in the previous {windowDays} days</div>
                  <div>Avg fix time {cluster.avg_resolution_hours} h · {cluster.total_downtime_hours} h total</div>
                </Box>
              }
            >
              <Box sx={{ cursor: "default" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, flexWrap: "wrap", mb: 0.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {cluster.example_title}
                    <Typography component="span" variant="caption" color="text.secondary">
                      {" "}· {cluster.category} · {cluster.name}
                    </Typography>
                  </Typography>
                  <Trend cluster={cluster} />
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box sx={{ flexGrow: 1, height: 10, backgroundColor: "#eef2f7", borderRadius: 1 }}>
                    <Box
                      sx={{
                        width: `${(cluster.count / max) * 100}%`,
                        height: "100%",
                        backgroundColor: BAR_COLOR,
                        borderRadius: 1,
                      }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, width: 32, textAlign: "right" }}>
                    {cluster.count}
                  </Typography>
                </Box>

                {cluster.repeat_machines.length > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    Repeating on:{" "}
                    {cluster.repeat_machines
                      .slice(0, 4)
                      .map((m) => `${m.machine_id} (${m.count}×)`)
                      .join(", ")}
                  </Typography>
                )}
              </Box>
            </Tooltip>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}
