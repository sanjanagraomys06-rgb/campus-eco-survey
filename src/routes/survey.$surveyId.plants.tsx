import { useMemo, useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { usePlants } from "@/lib/survey-data";
import { labelize } from "@/lib/survey-types";

export const Route = createFileRoute("/survey/$surveyId/plants")({
  head: () => ({
    meta: [
      { title: "Plant knowledge — Campus Eco Survey" },
      { name: "description", content: "Reference database of plant species used for identification." },
      { property: "og:title", content: "Plant knowledge — Campus Eco Survey" },
      { property: "og:description", content: "Common, local and scientific names with botanical details." },
    ],
  }),
  component: PlantsPage,
});

function PlantsPage() {
  const { surveyId } = useParams({ from: "/survey/$surveyId/plants" });
  const { data: plants = [], isLoading } = usePlants();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return plants;
    return plants.filter((p) =>
      [p.common_name, p.local_names, p.scientific_name, p.family, p.plant_type]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [plants, search]);

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold">Plant knowledge</h1>
          <p className="text-sm text-muted-foreground">
            {plants.length} species in the reference list. Used to auto-fill plant details.
          </p>
        </div>
        <Link
          to="/survey/$surveyId/data"
          params={{ surveyId }}
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Import plant list
        </Link>
      </div>

      <Input
        placeholder="Search common, local or scientific name…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="rounded-md border border-dashed p-4 text-xs text-muted-foreground">
          No plants found. Import a plant list to get started.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <article key={p.id} className="panel p-4">
              <h2 className="text-sm font-semibold">{p.common_name}</h2>
              <p className="text-xs italic text-muted-foreground">{p.scientific_name}</p>
              {p.local_names && (
                <p className="mt-1 text-xs text-muted-foreground">Local: {p.local_names}</p>
              )}
              <dl className="mt-3 grid grid-cols-2 gap-y-1 text-xs">
                <dt className="text-muted-foreground">Family</dt>
                <dd className="text-right">{p.family || "—"}</dd>
                <dt className="text-muted-foreground">Type</dt>
                <dd className="text-right">{p.plant_type || "—"}</dd>
                <dt className="text-muted-foreground">Native status</dt>
                <dd className="text-right">{labelize(p.native_status)}</dd>
                <dt className="text-muted-foreground">Flowering</dt>
                <dd className="text-right">{p.flowering_season || "—"}</dd>
              </dl>
              {p.description && (
                <p className="mt-3 line-clamp-3 text-xs text-muted-foreground">{p.description}</p>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
