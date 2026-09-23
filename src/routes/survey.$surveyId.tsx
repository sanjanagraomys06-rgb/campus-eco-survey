import { createFileRoute, Link, Outlet, useParams } from "@tanstack/react-router";
import {
  BarChart3,
  Database,
  FileSpreadsheet,
  Layers,
  Leaf,
  LayoutDashboard,
  Map as MapIcon,
  Sprout,
  Table2,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useAreas,
  useObservations,
  useSurvey,
  useSyncPending,
} from "@/lib/survey-data";
import { exportCsv, exportExcel } from "@/lib/survey-export";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/survey/$surveyId")({
  head: () => ({
    meta: [
      { title: "Survey workspace — Campus Eco Survey" },
      {
        name: "description",
        content: "Map workspace, plant records, survey areas and analytics for your campus survey.",
      },
      { property: "og:title", content: "Survey workspace — Campus Eco Survey" },
      {
        property: "og:description",
        content: "Collect plant observations on your campus map and export them to Excel.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SurveyLayout,
});

const NAV = [
  { to: "/survey/$surveyId/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/survey/$surveyId", label: "Survey Map", icon: MapIcon, exact: true },
  { to: "/survey/$surveyId/records", label: "Plant Records", icon: Table2 },
  { to: "/survey/$surveyId/plants", label: "Plant Knowledge", icon: Sprout },
  { to: "/survey/$surveyId/areas", label: "Survey Areas", icon: Layers },
  { to: "/survey/$surveyId/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/survey/$surveyId/data", label: "Import / Export", icon: Database },
] as const;

function SurveyLayout() {
  const { surveyId } = useParams({ from: "/survey/$surveyId" });
  const { data: survey } = useSurvey(surveyId);
  const { data: observations = [] } = useObservations(surveyId);
  const { data: areas = [] } = useAreas(surveyId);
  const { online, pending } = useSyncPending(surveyId);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-20 border-b bg-card">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <Leaf className="size-5 text-primary" />
            <span className="text-sm font-semibold">Campus Eco Survey</span>
          </Link>
          <div className="hidden min-w-0 border-l pl-3 sm:block">
            <p className="truncate text-sm font-medium">{survey?.survey_name ?? "Loading…"}</p>
            <p className="truncate text-xs text-muted-foreground">
              {[survey?.institution_name, survey?.campus_name, survey?.city]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {!online && (
              <span className="flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs text-secondary-foreground">
                <WifiOff className="size-3" /> Offline{pending > 0 ? ` · ${pending} pending` : ""}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => survey && exportCsv(survey, observations, areas)}
            >
              CSV
            </Button>
            <Button size="sm" onClick={() => survey && exportExcel(survey, observations, areas)}>
              <FileSpreadsheet className="mr-2 size-4" /> Export Excel
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col md:flex-row">
        <nav className="order-2 border-t bg-sidebar md:order-1 md:w-56 md:shrink-0 md:border-r md:border-t-0">
          <ul className="flex overflow-x-auto p-2 md:flex-col md:gap-1 md:overflow-visible md:p-3">
            {NAV.map((item) => (
              <li key={item.label} className="shrink-0">
                <Link
                  to={item.to}
                  params={{ surveyId }}
                  activeOptions={{ exact: "exact" in item ? item.exact : false }}
                  className="flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm text-sidebar-foreground transition hover:bg-sidebar-accent"
                  activeProps={{ className: cn("bg-sidebar-accent font-medium") }}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <main className="order-1 min-w-0 flex-1 md:order-2">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
