import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { Progress } from "@/components/ui/progress";
import {
  speciesSummary,
  surveyStats,
  useAreas,
  useObservations,
  useSurvey,
} from "@/lib/survey-data";
import { labelize } from "@/lib/survey-types";

export const Route = createFileRoute("/survey/$surveyId/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { surveyId } = useParams({ from: "/survey/$surveyId/dashboard" });
  const { data: survey } = useSurvey(surveyId);
  const { data: observations = [] } = useObservations(surveyId);
  const { data: areas = [] } = useAreas(surveyId);
  const stats = surveyStats(observations, areas);
  const species = speciesSummary(observations);

  return (
    <div className="space-y-4 p-4">
      <div>
        <h1 className="text-lg font-semibold">{survey?.survey_name ?? "Dashboard"}</h1>
        <p className="text-sm text-muted-foreground">
          {survey?.survey_type} · Surveyor {survey?.surveyor || "—"} · Started{" "}
          {survey?.survey_date}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Card label="Total plants" value={stats.totalPlants} />
        <Card label="Plant species" value={stats.species} />
        <Card label="Locations" value={stats.locations} />
        <Card label="Survey areas" value={stats.areas} />
        <Card label="Coverage" value={`${stats.coverage}%`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel p-4">
          <h2 className="text-sm font-semibold">Species summary</h2>
          {species.length === 0 ? (
            <Empty text="No plants recorded yet. Open the survey map and tap a location to begin." />
          ) : (
            <ul className="mt-3 space-y-2">
              {species.slice(0, 8).map((s) => (
                <li key={s.key} className="flex items-center justify-between text-sm">
                  <span className="truncate">{s.common_name}</span>
                  <span className="text-muted-foreground">
                    {s.total} plants · {s.locations} locations
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel p-4">
          <h2 className="text-sm font-semibold">Survey progress</h2>
          {areas.length === 0 ? (
            <Empty text="No survey areas yet. Add areas to track coverage." />
          ) : (
            <div className="mt-3 space-y-3">
              <Progress value={stats.coverage} />
              <ul className="space-y-1.5 text-sm">
                {areas.map((area) => {
                  const inArea = observations.filter((o) => o.area_id === area.id);
                  return (
                    <li key={area.id} className="flex items-center justify-between">
                      <span>{area.area_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {inArea.reduce((sum, o) => sum + o.count, 0)} plants ·{" "}
                        {labelize(area.status)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </section>

        <section className="panel p-4">
          <h2 className="text-sm font-semibold">Recent observations</h2>
          {observations.length === 0 ? (
            <Empty text="Nothing recorded yet." />
          ) : (
            <ul className="mt-3 space-y-1.5 text-sm">
              {observations.slice(0, 6).map((o) => (
                <li key={o.id} className="flex items-center justify-between">
                  <span className="truncate">{o.common_name}</span>
                  <span className="text-xs text-muted-foreground">
                    +{o.count} · {o.survey_date} {o.survey_time.slice(0, 5)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel p-4">
          <h2 className="text-sm font-semibold">Campus map</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {survey?.map_url
              ? "Your campus map is ready — open the survey map to place markers."
              : "No campus map uploaded yet."}
          </p>
          <Link
            to="/survey/$surveyId"
            params={{ surveyId }}
            className="mt-3 inline-flex rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
          >
            Open survey map
          </Link>
        </section>
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="panel p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="mt-3 rounded-md border border-dashed p-4 text-xs text-muted-foreground">{text}</p>;
}
