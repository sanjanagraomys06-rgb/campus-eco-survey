import { useMemo, useRef, useState } from "react";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { Copy, Pencil, Plus, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { MapCanvas } from "@/components/survey/MapCanvas";
import { ObservationDialog } from "@/components/survey/ObservationDialog";
import { PhotoThumb } from "@/components/survey/PhotoThumb";
import { supabase } from "@/integrations/supabase/client";
import {
  speciesSummary,
  surveyStats,
  uploadFile,
  useAreas,
  useDeleteObservation,
  useInvalidateSurvey,
  useObservations,
  usePhotos,
  usePlants,
  useSurvey,
} from "@/lib/survey-data";
import { labelize, type Observation } from "@/lib/survey-types";

export const Route = createFileRoute("/survey/$surveyId/")({
  component: MapWorkspace,
});

function MapWorkspace() {
  const { surveyId } = useParams({ from: "/survey/$surveyId/" });
  const { data: survey } = useSurvey(surveyId);
  const { data: observations = [] } = useObservations(surveyId);
  const { data: areas = [] } = useAreas(surveyId);
  const { data: plants = [] } = usePlants();
  const invalidate = useInvalidateSurvey(surveyId);
  const remove = useDeleteObservation(surveyId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Observation | null>(null);
  const [point, setPoint] = useState<{ x: number; y: number } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [highlightKey, setHighlightKey] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const stats = surveyStats(observations, areas);
  const species = speciesSummary(observations);
  const selected = observations.find((o) => o.id === selectedId) ?? null;
  const { data: photos = [] } = usePhotos(selectedId);

  const highlightedIds = useMemo(() => {
    const term = search.trim().toLowerCase();
    return observations
      .filter((o) => {
        const key = (o.scientific_name || o.common_name).toLowerCase();
        if (highlightKey) return key === highlightKey;
        if (!term) return false;
        return [o.common_name, o.scientific_name, o.local_name, o.remarks]
          .join(" ")
          .toLowerCase()
          .includes(term);
      })
      .map((o) => o.id);
  }, [observations, search, highlightKey]);

  const areaName = (id: string | null) => areas.find((a) => a.id === id)?.area_name ?? "No area";

  const uploadMap = async (file: File) => {
    try {
      const ref = await uploadFile("survey-maps", file, surveyId);
      await supabase.from("surveys").update({ map_url: ref } as never).eq("id", surveyId);
      invalidate();
      toast.success("Map uploaded successfully.");
    } catch {
      toast.error("Unable to upload image. Please try a PNG, JPG or WebP file.");
    }
  };

  const duplicate = (observation: Observation) => {
    setEditing({ ...observation, id: "", count: observation.count } as Observation);
    setEditing(null);
    setPoint({ x: observation.map_x ?? 0.5, y: observation.map_y ?? 0.5 });
    setDialogOpen(true);
    toast.info("Add a similar plant — pick the new location on the map after saving if needed.");
  };

  const undoLast = async () => {
    const last = observations[0];
    if (!last) return;
    await remove.mutateAsync(last.id);
    toast.success("Last observation removed.");
  };

  return (
    <div className="grid h-[calc(100vh-57px)] grid-rows-[minmax(280px,45vh)_1fr] lg:h-[calc(100vh-57px)] lg:grid-cols-[1fr_360px] lg:grid-rows-1">
      <div className="min-h-0 p-3">
        <input
          ref={fileInput}
          type="file"
          accept="image/png,image/jpeg,image/webp,application/pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (survey?.map_url && !confirm("Replace campus map? Existing plant records are kept."))
              return;
            uploadMap(file);
          }}
        />
        <MapCanvas
          mapRef={survey?.map_url ?? null}
          observations={observations}
          selectedId={selectedId}
          highlightedIds={highlightedIds}
          onSelect={setSelectedId}
          onAddAt={(p) => {
            setPoint(p);
            setEditing(null);
            setDialogOpen(true);
          }}
          onUploadMap={() => fileInput.current?.click()}
        />
      </div>

      <aside className="min-h-0 space-y-3 overflow-y-auto border-t p-3 lg:border-l lg:border-t-0">
        <div className="panel p-4">
          <h2 className="text-sm font-semibold">Survey summary</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <Stat label="Total plants" value={stats.totalPlants} />
            <Stat label="Species" value={stats.species} />
            <Stat label="Locations" value={stats.locations} />
            <Stat label="Areas" value={stats.areas} />
          </div>
        </div>

        <Button
          className="w-full"
          onClick={() => {
            setEditing(null);
            setPoint(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-2 size-4" /> Add Plant
        </Button>

        <Input
          placeholder="Search plant, scientific name, area…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setHighlightKey(null);
          }}
        />

        {selected && (
          <div className="panel p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold">{selected.common_name}</h3>
                <p className="text-xs italic text-muted-foreground">
                  {selected.scientific_name || labelize(selected.identification_status)}
                </p>
              </div>
              <span className="rounded-md bg-secondary px-2 py-1 text-xs font-semibold">
                {selected.count}
              </span>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
              <Detail label="Area" value={areaName(selected.area_id)} />
              <Detail label="Health" value={labelize(selected.health)} />
              <Detail label="Height" value={selected.height ? `${selected.height} m` : "—"} />
              <Detail label="Girth" value={selected.girth ? `${selected.girth} cm` : "—"} />
              <Detail label="Native" value={labelize(selected.native_status)} />
              <Detail label="Surveyed" value={selected.survey_date} />
            </dl>
            {selected.remarks && (
              <p className="mt-2 text-xs text-muted-foreground">{selected.remarks}</p>
            )}
            {photos.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {photos.map((photo) => (
                  <PhotoThumb key={photo.id} storageRef={photo.photo_url} type={photo.photo_type} />
                ))}
              </div>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditing(selected);
                  setDialogOpen(true);
                }}
              >
                <Pencil className="mr-1.5 size-3.5" /> Edit
              </Button>
              <Button size="sm" variant="outline" onClick={() => duplicate(selected)}>
                <Copy className="mr-1.5 size-3.5" /> Duplicate
              </Button>
              <Button size="sm" variant="outline" onClick={() => setDeleteId(selected.id)}>
                <Trash2 className="mr-1.5 size-3.5" /> Delete
              </Button>
            </div>
          </div>
        )}

        <div className="panel p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recently added</h2>
            {observations.length > 0 && (
              <Button variant="ghost" size="sm" onClick={undoLast}>
                <Undo2 className="mr-1.5 size-3.5" /> Undo last
              </Button>
            )}
          </div>
          {observations.length === 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">
              🌱 No plants recorded yet. Tap the map to add your first plant location.
            </p>
          ) : (
            <ul className="mt-2 space-y-1.5 text-sm">
              {observations.slice(0, 5).map((o) => (
                <li key={o.id}>
                  <button
                    className="flex w-full items-center justify-between rounded-md px-2 py-1 text-left hover:bg-accent/50"
                    onClick={() => setSelectedId(o.id)}
                  >
                    <span className="truncate">{o.common_name}</span>
                    <span className="text-xs text-muted-foreground">
                      +{o.count} · {areaName(o.area_id)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="panel p-4">
          <h2 className="text-sm font-semibold">Plant list</h2>
          {species.length === 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">No species recorded yet.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm">
              {species.map((s) => (
                <li key={s.key}>
                  <button
                    className="flex w-full items-center justify-between rounded-md px-2 py-1 text-left hover:bg-accent/50"
                    onClick={() => {
                      setHighlightKey(highlightKey === s.key ? null : s.key);
                      setSearch("");
                    }}
                  >
                    <span className="truncate">{s.common_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {s.total} · {s.locations} loc
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      <ObservationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        surveyId={surveyId}
        areas={areas}
        plants={plants}
        observation={editing}
        point={point}
        defaultSurveyor={survey?.surveyor ?? ""}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this plant observation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the map marker and its survey record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!deleteId) return;
                await remove.mutateAsync(deleteId);
                setSelectedId(null);
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

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border bg-surface p-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </>
  );
}
