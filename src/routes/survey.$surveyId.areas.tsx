import { useState } from "react";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { surveyStats, useAreas, useInvalidateSurvey, useObservations } from "@/lib/survey-data";
import { labelize } from "@/lib/survey-types";

export const Route = createFileRoute("/survey/$surveyId/areas")({
  head: () => ({
    meta: [
      { title: "Survey areas — Campus Eco Survey" },
      { name: "description", content: "Divide the campus into areas and track survey coverage." },
      { property: "og:title", content: "Survey areas — Campus Eco Survey" },
      { property: "og:description", content: "Add, rename and complete survey areas." },
    ],
  }),
  component: AreasPage,
});

const STATUSES = ["not_started", "in_progress", "complete"] as const;

function AreasPage() {
  const { surveyId } = useParams({ from: "/survey/$surveyId/areas" });
  const { data: areas = [] } = useAreas(surveyId);
  const { data: observations = [] } = useObservations(surveyId);
  const invalidate = useInvalidateSurvey(surveyId);
  const [name, setName] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const stats = surveyStats(observations, areas);

  const run = async (op: PromiseLike<{ error: unknown }>, success: string) => {
    const { error } = await op;
    if (error) {
      toast.error("Something went wrong. Please try again.");
      return false;
    }
    invalidate();
    toast.success(success);
    return true;
  };

  const add = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Please enter an area name.");
      return;
    }
    const ok = await run(
      supabase.from("survey_areas").insert({ survey_id: surveyId, area_name: trimmed } as never),
      "Area added.",
    );
    if (ok) setName("");
  };

  return (
    <div className="space-y-4 p-4">
      <div>
        <h1 className="text-lg font-semibold">Survey areas</h1>
        <p className="text-sm text-muted-foreground">Coverage {stats.coverage}%</p>
        <Progress value={stats.coverage} className="mt-2 max-w-md" />
      </div>

      <form
        className="flex max-w-md gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <Input
          placeholder="e.g. Main Gate, Library, Hostel Area"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button type="submit"><Plus className="mr-1.5 size-4" /> Add</Button>
      </form>

      {areas.length === 0 ? (
        <p className="rounded-md border border-dashed p-4 text-xs text-muted-foreground">
          No survey areas yet. Add areas to organise observations and track coverage.
        </p>
      ) : (
        <ul className="space-y-2">
          {areas.map((area) => {
            const inArea = observations.filter((o) => o.area_id === area.id);
            const plants = inArea.reduce((s, o) => s + o.count, 0);
            const species = new Set(
              inArea.map((o) => (o.scientific_name || o.common_name).toLowerCase()),
            ).size;
            return (
              <li key={area.id} className="panel flex flex-wrap items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  {editId === area.id ? (
                    <div className="flex gap-2">
                      <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                      <Button
                        size="icon"
                        aria-label="Save name"
                        onClick={async () => {
                          if (!editName.trim()) return;
                          const ok = await run(
                            supabase
                              .from("survey_areas")
                              .update({ area_name: editName.trim() } as never)
                              .eq("id", area.id),
                            "Area renamed.",
                          );
                          if (ok) setEditId(null);
                        }}
                      >
                        <Check className="size-4" />
                      </Button>
                      <Button size="icon" variant="ghost" aria-label="Cancel" onClick={() => setEditId(null)}>
                        <X className="size-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm font-medium">{area.area_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {plants} plants · {species} species
                      </p>
                    </>
                  )}
                </div>
                <Select
                  value={area.status}
                  onValueChange={(v) =>
                    run(
                      supabase.from("survey_areas").update({ status: v } as never).eq("id", area.id),
                      `Marked ${labelize(v).toLowerCase()}.`,
                    )
                  }
                >
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{labelize(s)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Rename"
                  onClick={() => {
                    setEditId(area.id);
                    setEditName(area.area_name);
                  }}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Delete"
                  onClick={() => {
                    if (!confirm(`Delete "${area.area_name}"? Plant records in it are kept.`)) return;
                    run(supabase.from("survey_areas").delete().eq("id", area.id), "Area deleted.");
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
