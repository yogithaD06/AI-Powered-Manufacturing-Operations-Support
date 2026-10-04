import axios from "axios";

// Typed client for the Python ML service (ml-service/), reached through the
// Vite proxy at /ml. Response shapes mirror ml-service/main.py.

const ml = axios.create({ baseURL: "/ml" });

export type RootCauseCategory =
  | "Man"
  | "Machine"
  | "Method"
  | "Material"
  | "Measurement"
  | "Environment";

export interface IncidentText {
  title: string;
  description?: string | null;
}

export interface Prediction {
  label: string;
  confidence: number;
  alternatives: { label: string; probability: number }[];
  keywords: string[];
}

export interface Classification {
  category: Prediction;
  priority: Prediction;
  root_cause_category: Prediction;
}

export interface SimilarIncident {
  ticket_id: string;
  title: string;
  description: string | null;
  machine_id: string | null;
  line: string | null;
  category: string | null;
  priority: string | null;
  root_cause_category: RootCauseCategory | null;
  root_cause: string | null;
  corrective_action: string | null;
  preventive_action: string | null;
  assigned_to: string | null;
  resolution_hours: number | null;
  created_at: string | null;
  source: "historical" | "approved_feedback";
  similarity: number;
  possible_duplicate: boolean;
}

export interface AssigneeCandidate {
  name: string;
  role: string;
  skills: string[];
  shift: string;
  score: number;
  components: { skill_match: number; experience: number; availability: number };
  open_tickets: number;
  similar_resolved: number;
  reasons: string[];
}

export interface AssigneeRecommendation {
  category: string;
  weights: { skill_match: number; experience: number; availability: number };
  recommendations: AssigneeCandidate[];
}

export interface RCADraft {
  problem_statement: string;
  five_whys: { question: string; answer: string }[];
  root_cause: string;
  root_cause_category: RootCauseCategory;
  contributing_factors: string[];
  containment_action: string;
  evidence_ticket_ids: string[];
  confidence_note: string;
}

export interface RCAResult {
  prediction: Classification;
  similar_incidents: SimilarIncident[];
  draft: RCADraft;
}

export interface CAPAAction {
  action: string;
  owner_role: string;
  due_in_days: number;
  verification: string;
}

export interface CAPADraft {
  corrective_actions: CAPAAction[];
  preventive_actions: CAPAAction[];
  effectiveness_check: string;
  evidence_ticket_ids: string[];
}

export interface CAPARequest extends IncidentText {
  category?: string | null;
  priority?: string | null;
  root_cause_category?: string | null;
  machine?: string | null;
}

export interface CAPAResult {
  inputs: { category: string; priority: string; root_cause_category: string };
  similar_incidents: SimilarIncident[];
  draft: CAPADraft;
}

export interface RecurringCluster {
  cluster_id: number;
  name: string;
  example_title: string;
  count: number;
  previous_count: number;
  trend_pct: number | null;
  category: string;
  dominant_root_cause: string;
  root_cause_category: string;
  avg_resolution_hours: number;
  total_downtime_hours: number;
  repeat_machines: { machine_id: string; count: number }[];
  last_seen: string;
}

export interface RecurringIssues {
  window_days: number;
  reference_date: string;
  window_start: string;
  total_incidents: number;
  clusters: RecurringCluster[];
}

export interface ClassifierMetrics {
  target: string;
  train_rows: number;
  test_rows: number;
  accuracy: number;
  macro_f1: number;
  baseline_accuracy: number;
  out_of_template_accuracy?: number;
  out_of_template_rows?: number;
  labels: string[];
  confusion_matrix: number[][];
}

export interface RetrainState {
  running: boolean;
  last_error: string | null;
  last_finished: string | null;
  model_version?: string | null;
}

export interface ModelInfo {
  trained_at: string;
  model_version: string;
  rows: number;
  feedback_rows: number;
  embedding: string;
  clusters: { k: number; silhouette: number };
  classifiers: Record<keyof Classification, ClassifierMetrics>;
  note: string;
  feedback: { total: number; pending_retrain: number };
  retrain: RetrainState;
}

export interface FeedbackItem extends IncidentText {
  category?: string | null;
  priority?: string | null;
  root_cause_category?: string | null;
  root_cause?: string | null;
  corrective_action?: string | null;
  preventive_action?: string | null;
  source?: string;
}

export const mlApi = {
  classify: (body: IncidentText) =>
    ml.post<Classification>("/classify", body).then((r) => r.data),

  similar: (body: IncidentText & { top_k?: number }) =>
    ml
      .post<{ results: SimilarIncident[] }>("/similar", body)
      .then((r) => r.data.results),

  recommendAssignee: (body: IncidentText & { category?: string | null }) =>
    ml
      .post<AssigneeRecommendation>("/recommend-assignee", body)
      .then((r) => r.data),

  rca: (body: IncidentText) =>
    ml.post<RCAResult>("/rca", body).then((r) => r.data),

  capa: (body: CAPARequest) =>
    ml.post<CAPAResult>("/capa", body).then((r) => r.data),

  recurring: (windowDays = 90) =>
    ml
      .get<RecurringIssues>("/recurring", { params: { window_days: windowDays } })
      .then((r) => r.data),

  acceptAssignment: (engineer: string, ticketRef?: string) =>
    ml
      .post<{ id: number }>("/assignments", { engineer, ticket_ref: ticketRef })
      .then((r) => r.data),

  feedback: (item: FeedbackItem) =>
    ml
      .post<{ id: number; stats: ModelInfo["feedback"] }>("/feedback", item)
      .then((r) => r.data),

  modelInfo: () => ml.get<ModelInfo>("/model-info").then((r) => r.data),

  retrain: () => ml.post<RetrainState>("/retrain").then((r) => r.data),

  retrainStatus: () =>
    ml.get<RetrainState>("/retrain/status").then((r) => r.data),
};

/** Human-readable message for a failed ML call (service down, not trained, ...). */
export function mlErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = (error.response?.data as { detail?: unknown } | undefined)?.detail;
    if (typeof detail === "string") return detail;
    // The Vite proxy answers 5xx with no detail when the service isn't running.
    if (!error.response || error.response.status >= 500) {
      return "ML service is not reachable. Start it with: cd ml-service && .venv\\Scripts\\uvicorn main:app --port 8001";
    }
  }
  return "ML request failed.";
}
