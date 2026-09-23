import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type {
  Observation,
  ObservationPhoto,
  PlantMaster,
  Survey,
  SurveyArea,
} from "./survey-types";

/* ---------------- storage helpers ---------------- */

export async function uploadFile(bucket: string, file: File, prefix: string) {
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${prefix}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
  if (error) throw error;
  return `${bucket}/${path}`;
}

export async function signedUrl(storageRef: string | null | undefined) {
  if (!storageRef) return null;
  const [bucket, ...rest] = storageRef.split("/");
  const { data } = await supabase.storage
    .from(bucket ?? "")
    .createSignedUrl(rest.join("/"), 60 * 60 * 24 * 7);
  return data?.signedUrl ?? null;
}

export function useSignedUrl(storageRef: string | null | undefined) {
  return useQuery({
    queryKey: ["signed-url", storageRef],
    queryFn: () => signedUrl(storageRef),
    enabled: !!storageRef,
    staleTime: 1000 * 60 * 60,
  });
}

/* ---------------- offline queue ---------------- */

const QUEUE_KEY = "campus-eco-survey.pending-observations";

type PendingObservation = Record<string, unknown>;

export function readQueue(): PendingObservation[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(QUEUE_KEY) ?? "[]") as PendingObservation[];
  } catch {
    return [];
  }
}

function writeQueue(items: PendingObservation[]) {
  window.localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
}

export function queueObservation(payload: PendingObservation) {
  writeQueue([...readQueue(), payload]);
}

export function useOnlineStatus() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return online;
}

/** Pushes anything stored locally while offline back to the database. */
export function useSyncPending(surveyId: string) {
  const online = useOnlineStatus();
  const qc = useQueryClient();
  const [pending, setPending] = useState(0);

  useEffect(() => {
    setPending(readQueue().length);
  }, [online]);

  useEffect(() => {
    if (!online) return;
    const items = readQueue();
    if (items.length === 0) return;
    (async () => {
      const { error } = await supabase.from("observations").insert(items as never);
      if (!error) {
        writeQueue([]);
        setPending(0);
        qc.invalidateQueries({ queryKey: ["observations", surveyId] });
      }
    })();
  }, [online, qc, surveyId]);

  return { online, pending };
}

/* ---------------- queries ---------------- */

export function useSurveys() {
  return useQuery({
    queryKey: ["surveys"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("surveys")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Survey[];
    },
  });
}

export function useSurvey(surveyId: string) {
  return useQuery({
    queryKey: ["survey", surveyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("surveys")
        .select("*")
        .eq("id", surveyId)
        .maybeSingle();
      if (error) throw error;
      return data as Survey | null;
    },
  });
}

export function useAreas(surveyId: string) {
  return useQuery({
    queryKey: ["areas", surveyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("survey_areas")
        .select("*")
        .eq("survey_id", surveyId)
        .order("created_at");
      if (error) throw error;
      return data as SurveyArea[];
    },
  });
}

export function useObservations(surveyId: string) {
  return useQuery({
    queryKey: ["observations", surveyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("observations")
        .select("*")
        .eq("survey_id", surveyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Observation[];
    },
  });
}

export function usePlants() {
  return useQuery({
    queryKey: ["plant-master"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plant_master")
        .select("*")
        .order("common_name");
      if (error) throw error;
      return data as PlantMaster[];
    },
  });
}

export function usePhotos(observationId: string | null) {
  return useQuery({
    queryKey: ["photos", observationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("observation_photos")
        .select("*")
        .eq("observation_id", observationId!)
        .order("created_at");
      if (error) throw error;
      return data as ObservationPhoto[];
    },
    enabled: !!observationId,
  });
}

/* ---------------- mutations ---------------- */

export function useInvalidateSurvey(surveyId: string) {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["observations", surveyId] });
    qc.invalidateQueries({ queryKey: ["areas", surveyId] });
    qc.invalidateQueries({ queryKey: ["survey", surveyId] });
  };
}

export function useSaveObservation(surveyId: string) {
  const invalidate = useInvalidateSurvey(surveyId);
  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id?: string | undefined;
      values: Record<string, unknown>;
    }) => {
      if (id) {
        const { data, error } = await supabase
          .from("observations")
          .update(values as never)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return data as Observation;
      }
      const { data, error } = await supabase
        .from("observations")
        .insert({ ...values, survey_id: surveyId } as never)
        .select()
        .single();
      if (error) throw error;
      return data as Observation;
    },
    onSuccess: invalidate,
  });
}

export function useDeleteObservation(surveyId: string) {
  const invalidate = useInvalidateSurvey(surveyId);
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("observations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

/* ---------------- derived statistics ---------------- */

export type SpeciesRow = {
  key: string;
  common_name: string;
  scientific_name: string;
  total: number;
  locations: number;
  lastSurveyed: string;
  health: string;
};

export function speciesSummary(observations: Observation[]): SpeciesRow[] {
  const map = new Map<string, SpeciesRow>();
  for (const obs of observations) {
    const key = (obs.scientific_name || obs.common_name).toLowerCase();
    const existing = map.get(key);
    if (existing) {
      existing.total += obs.count;
      existing.locations += 1;
      if (obs.survey_date > existing.lastSurveyed) existing.lastSurveyed = obs.survey_date;
    } else {
      map.set(key, {
        key,
        common_name: obs.common_name,
        scientific_name: obs.scientific_name ?? "",
        total: obs.count,
        locations: 1,
        lastSurveyed: obs.survey_date,
        health: obs.health ?? "healthy",
      });
    }
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}

export function surveyStats(observations: Observation[], areas: SurveyArea[]) {
  const totalPlants = observations.reduce((sum, o) => sum + o.count, 0);
  const species = speciesSummary(observations).length;
  const completed = areas.filter((a) => a.status === "complete").length;
  const inProgress = areas.filter((a) => a.status === "in_progress").length;
  const coverage =
    areas.length === 0 ? 0 : Math.round(((completed + inProgress * 0.5) / areas.length) * 100);
  return {
    totalPlants,
    species,
    locations: observations.length,
    areas: areas.length,
    coverage,
  };
}
