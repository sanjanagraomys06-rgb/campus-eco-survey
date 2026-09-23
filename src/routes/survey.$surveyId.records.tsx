import { useMemo, useState } from "react";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ObservationDialog } from "@/components/survey/ObservationDialog";
import {
  speciesSummary,
  useAreas,
  useDeleteObservation,
  useObservations,
  usePlants,
  useSurvey,
} from "@/lib/survey-data";
import { HEALTH_OPTIONS, labelize, type Observation } from "@/lib/survey-types";

export const Route = createFileRoute("/survey/$surveyId/records")({
  head: () => ({
    meta: [
      { title: "Plant records — Campus Eco Survey" },
      { name: "description", content: "Every plant observation recorded in this survey." },
      { property: "og:title", content: "Plant records — Campus Eco Survey" },
      { property: "og:description", content: "Browse, edit and delete plant observations." },
    ],
  }),
  component: RecordsPage,
});

const ALL = "all";

function RecordsPage() {
  const { surveyId } = useParams({ from: "/survey/$surveyId/records" });
  const { data: survey } = useSurvey(surveyId);
  const { data: observations = [] } = useObservations(surveyId);
  const { data: areas = [] } = useAreas(surveyId);
  const { data: plants = [] } = usePlants();
  const remove = useDeleteObservation(surveyId);

  const [search, setSearch] = useState("");
  const [area, setArea] = useState(ALL);
  const [health, setHealth] = useState(ALL);
  const [idStatus, setIdStatus] = useState(ALL);
  const [editing, setEditing] = useState<Observation | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const areaName = (id: string | null) => areas.find((a) => a.id === id)?.area_name ?? "—";

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return observations.filter((o) => {
      if (area !== ALL && o.area_id !== area) return false;
      if (health !== ALL && o.health !== health) return false;
      if (idStatus !== ALL && o.identification_status !== idStatus) return false;
      if (!term) return true;
      return [o.common_name, o.scientific_name, o.local_name, o.family, o.remarks]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [observations, search, area, health, idStatus]);

  const species = speciesSummary(filtered);

  return (
    <div className="space-y-4 p-4">
      <div>
        <h1 className="text-lg font-semibold">Plant records</h1>
        <p className="text-sm text-muted-foreground">
          {filtered.length} of {observations.length} observations
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          placeholder="Search plant, scientific name, remarks…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select value={area} onValueChange={setArea}>
          <SelectTrigger><SelectValue placeholder="Area" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All areas</SelectItem>
            {areas.map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.area_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={health} onValueChange={setHealth}>
          <SelectTrigger><SelectValue placeholder="Health" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All health</SelectItem>
            {HEALTH_OPTIONS.map((h) => (
              <SelectItem key={h} value={h}>{labelize(h)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={idStatus} onValueChange={setIdStatus}>
          <SelectTrigger><SelectValue placeholder="Identification" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All identification</SelectItem>
            <SelectItem value="identified">Identified</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="unknown">Unknown</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <section className="panel overflow-x-auto">
        <h2 className="px-4 pt-4 text-sm font-semibold">Species totals</h2>
        {species.length === 0 ? (
          <p className="m-4 rounded-md border border-dashed p-4 text-xs text-muted-foreground">
            No plants match. Record plants from the survey map to see them here.
          </p>
        ) : (
          <table className="mt-2 w-full text-sm">
            <thead className="border-b text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2">Plant</th>
                <th className="px-4 py-2">Scientific name</th>
                <th className="px-4 py-2 text-right">Total</th>
                <th className="px-4 py-2 text-right">Locations</th>
                <th className="px-4 py-2">Last surveyed</th>
              </tr>
            </thead>
            <tbody>
              {species.map((s) => (
                <tr key={s.key} className="border-b last:border-0">
                  <td className="px-4 py-2 font-medium">{s.common_name}</td>
                  <td className="px-4 py-2 italic text-muted-foreground">{s.scientific_name || "—"}</td>
                  <td className="px-4 py-2 text-right">{s.total}</td>
                  <td className="px-4 py-2 text-right">{s.locations}</td>
                  <td className="px-4 py-2">{s.lastSurveyed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="panel overflow-x-auto">
        <h2 className="px-4 pt-4 text-sm font-semibold">All observations</h2>
        {filtered.length === 0 ? (
          <p className="m-4 rounded-md border border-dashed p-4 text-xs text-muted-foreground">
            No observations yet.
          </p>
        ) : (
          <table className="mt-2 w-full text-sm">
            <thead className="border-b text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2">Plant</th>
                <th className="px-4 py-2">Area</th>
                <th className="px-4 py-2 text-right">Count</th>
                <th className="px-4 py-2">Health</th>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Surveyor</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} className="border-b last:border-0">
                  <td className="px-4 py-2">
                    <p className="font-medium">{o.common_name}</p>
                    <p className="text-xs italic text-muted-foreground">
                      {o.scientific_name || labelize(o.identification_status)}
                    </p>
                  </td>
                  <td className="px-4 py-2">{areaName(o.area_id)}</td>
                  <td className="px-4 py-2 text-right">{o.count}</td>
                  <td className="px-4 py-2">{labelize(o.health)}</td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {o.survey_date} {o.survey_time.slice(0, 5)}
                  </td>
                  <td className="px-4 py-2">{o.surveyor || "—"}</td>
                  <td className="px-4 py-2 text-right whitespace-nowrap">
                    <Button size="icon" variant="ghost" aria-label="Edit" onClick={() => setEditing(o)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => setDeleteId(o.id)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <ObservationDialog
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
        surveyId={surveyId}
        areas={areas}
        plants={plants}
        observation={editing}
        point={null}
        defaultSurveyor={survey?.surveyor ?? ""}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this plant observation?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the record and its map marker.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!deleteId) return;
                await remove.mutateAsync(deleteId);
                setDeleteId(null);
                toast.success("Plant deleted successfully.");
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
