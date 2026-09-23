import { useState } from "react";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { FileSpreadsheet, Upload } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAreas, useObservations, usePlants, useSurvey } from "@/lib/survey-data";
import { exportCsv, exportExcel, parsePlantImport } from "@/lib/survey-export";

export const Route = createFileRoute("/survey/$surveyId/data")({
  head: () => ({
    meta: [
      { title: "Import & export — Campus Eco Survey" },
      { name: "description", content: "Download survey records as Excel or CSV and import plant lists." },
      { property: "og:title", content: "Import & export — Campus Eco Survey" },
      { property: "og:description", content: "Excel workbook export and plant list import." },
    ],
  }),
  component: DataPage,
});

type Preview = { valid: Record<string, string>[]; errors: string[]; skipped: number };

function DataPage() {
  const { surveyId } = useParams({ from: "/survey/$surveyId/data" });
  const { data: survey } = useSurvey(surveyId);
  const { data: observations = [] } = useObservations(surveyId);
  const { data: areas = [] } = useAreas(surveyId);
  const { data: plants = [] } = usePlants();
  const qc = useQueryClient();
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);

  const onFile = async (file: File) => {
    try {
      const { valid, errors } = await parsePlantImport(file);
      const existing = new Set(
        plants.map((p) => (p.scientific_name || p.common_name).toLowerCase()),
      );
      const fresh = valid.filter(
        (r) => !existing.has((r["scientific_name"] || r["common_name"] || "").toLowerCase()),
      );
      setPreview({ valid: fresh, errors, skipped: valid.length - fresh.length });
    } catch {
      toast.error("Could not read that file. Please upload a CSV or Excel file.");
    }
  };

  const confirmImport = async () => {
    if (!preview || preview.valid.length === 0) return;
    setBusy(true);
    const rows = preview.valid.map((r) => {
      const clean: Record<string, string | null> = {};
      for (const [k, v] of Object.entries(r)) clean[k] = v === "" ? null : v;
      clean["common_name"] = r["common_name"] ?? "";
      clean["scientific_name"] = r["scientific_name"] || r["common_name"] || "";
      return clean;
    });
    const { error } = await supabase.from("plant_master").insert(rows as never);
    setBusy(false);
    if (error) {
      toast.error("Import failed. Some plants may already exist — please check the file.");
      return;
    }
    toast.success(`${rows.length} plants imported.`);
    setPreview(null);
    qc.invalidateQueries({ queryKey: ["plant-master"] });
  };

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-lg font-semibold">Import & export</h1>

      <section className="panel p-4">
        <h2 className="text-sm font-semibold">Export survey data</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Excel includes three sheets: Survey Records, Plant Summary and Area Summary.
          {observations.length === 0 && " No observations recorded yet."}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            disabled={!survey}
            onClick={() => survey && exportExcel(survey, observations, areas)}
          >
            <FileSpreadsheet className="mr-2 size-4" /> Export Excel
          </Button>
          <Button
            variant="outline"
            disabled={!survey}
            onClick={() => survey && exportCsv(survey, observations, areas)}
          >
            Export CSV
          </Button>
        </div>
      </section>

      <section className="panel p-4">
        <h2 className="text-sm font-semibold">Import plant list</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Adds species to the plant knowledge list (not survey records). Columns such as Common
          Name, Scientific Name, Local Name, Family, Plant Type and Native Status are recognised.
        </p>
        <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent/50">
          <Upload className="size-4" /> Choose CSV or Excel file
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFile(file);
              e.target.value = "";
            }}
          />
        </label>

        {preview && (
          <div className="mt-4 space-y-2 text-sm">
            <p>
              <strong>{preview.valid.length}</strong> new plants ready to import
              {preview.skipped > 0 && ` · ${preview.skipped} already in the list`}
              {preview.errors.length > 0 && ` · ${preview.errors.length} rows with problems`}
            </p>
            {preview.errors.length > 0 && (
              <ul className="max-h-32 overflow-y-auto rounded-md border bg-muted/40 p-2 text-xs text-muted-foreground">
                {preview.errors.map((err) => (
                  <li key={err}>{err}</li>
                ))}
              </ul>
            )}
            <div className="flex gap-2">
              <Button disabled={busy || preview.valid.length === 0} onClick={confirmImport}>
                {busy ? "Importing…" : "Import plants"}
              </Button>
              <Button variant="ghost" onClick={() => setPreview(null)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
