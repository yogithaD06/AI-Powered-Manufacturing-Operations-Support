import { useEffect, useState } from "react";
import axios from "axios";

interface IncidentRecord {
  incident_title: string;
  incident_description: string | null;
}

/**
 * Editable incident title/description for the AI assistants.
 * Pre-filled from the backend whenever the form's incident ID changes; the
 * user can still type or edit the text (useful when the backend is offline).
 */
export function useIncidentText(incidentId: string) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [lookup, setLookup] = useState<"idle" | "loading" | "found" | "missing">("idle");

  useEffect(() => {
    const id = Number(incidentId);
    if (!incidentId || !Number.isInteger(id) || id <= 0) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      setLookup("loading");
      try {
        const { data } = await axios.get<IncidentRecord>(`/api/incidents/${id}`);
        if (cancelled) return;
        setTitle(data.incident_title);
        setDescription(data.incident_description ?? "");
        setLookup("found");
      } catch {
        if (!cancelled) setLookup("missing");
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [incidentId]);

  return { title, setTitle, description, setDescription, lookup };
}
