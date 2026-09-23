import type { ReactElement } from "react";
import { createFileRoute, useParams } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { speciesSummary, useAreas, useObservations } from "@/lib/survey-data";
import { labelize } from "@/lib/survey-types";

export const Route = createFileRoute("/survey/$surveyId/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — Campus Eco Survey" },
      { name: "description", content: "Charts of plant counts by species, area, health and origin." },
      { property: "og:title", content: "Analytics — Campus Eco Survey" },
      { property: "og:description", content: "See how your campus plant survey is shaping up." },
    ],
  }),
  component: AnalyticsPage,
});

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

function groupCounts<T>(items: T[], keyOf: (item: T) => string, countOf: (item: T) => number) {
  const map = new Map<string, number>();
  for (const item of items) map.set(keyOf(item), (map.get(keyOf(item)) ?? 0) + countOf(item));
  return [...map.entries()].map(([name, value]) => ({ name, value }));
}

function AnalyticsPage() {
  const { surveyId } = useParams({ from: "/survey/$surveyId/analytics" });
  const { data: observations = [] } = useObservations(surveyId);
  const { data: areas = [] } = useAreas(surveyId);

  if (observations.length === 0) {
    return (
      <div className="p-4">
        <h1 className="text-lg font-semibold">Analytics</h1>
        <p className="mt-3 rounded-md border border-dashed p-4 text-sm text-muted-foreground">
          Charts appear once you record plants on the survey map.
        </p>
      </div>
    );
  }

  const bySpecies = speciesSummary(observations)
    .slice(0, 12)
    .map((s) => ({ name: s.common_name, value: s.total }));
  const areaName = (id: string | null) => areas.find((a) => a.id === id)?.area_name ?? "No area";
  const byArea = groupCounts(observations, (o) => areaName(o.area_id), (o) => o.count);
  const byHealth = groupCounts(observations, (o) => labelize(o.health ?? "healthy"), (o) => o.count);
  const byOrigin = groupCounts(observations, (o) => labelize(o.native_status ?? "unknown"), (o) => o.count);

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-lg font-semibold">Analytics</h1>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Plants by species">
          <BarChart data={bySpecies} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis type="number" allowDecimals={false} fontSize={12} />
            <YAxis type="category" dataKey="name" width={100} fontSize={12} />
            <Tooltip />
            <Bar dataKey="value" name="Plants" fill="var(--primary)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ChartCard>
        <ChartCard title="Plants by area">
          <BarChart data={byArea}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="name" fontSize={12} />
            <YAxis allowDecimals={false} fontSize={12} />
            <Tooltip />
            <Bar dataKey="value" name="Plants" fill="var(--primary)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartCard>
        <ChartCard title="Health distribution">
          <PieDonut data={byHealth} />
        </ChartCard>
        <ChartCard title="Native vs introduced">
          <PieDonut data={byOrigin} />
        </ChartCard>
      </div>
    </div>
  );
}

function PieDonut({ data }: { data: { name: string; value: number }[] }) {
  return (
    <PieChart>
      <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} label>
        {data.map((entry, i) => (
          <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
        ))}
      </Pie>
      <Tooltip />
    </PieChart>
  );
}

function ChartCard({ title, children }: { title: string; children: ReactElement }) {
  return (
    <section className="panel p-4">
      <h2 className="text-sm font-semibold">{title}</h2>
      <div className="mt-3 h-72">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </section>
  );
}
