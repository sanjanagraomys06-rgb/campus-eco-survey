import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Leaf, Loader2, MapPin, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useSurveys } from "@/lib/survey-data";
import { SURVEY_TYPES } from "@/lib/survey-types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Campus Eco Survey — Map-based plant & biodiversity surveys" },
      {
        name: "description",
        content:
          "Create a campus or land survey, upload your map, drop plant markers and export the full dataset to Excel.",
      },
      { property: "og:title", content: "Campus Eco Survey" },
      {
        property: "og:description",
        content: "Map-based plant and biodiversity data collection for any campus, land or garden.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const navigate = useNavigate();
  const { data: surveys, isLoading, refetch } = useSurveys();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    institution_name: "",
    campus_name: "",
    city: "",
    survey_name: "",
    survey_type: "Plant Survey",
    surveyor: "",
    survey_date: new Date().toISOString().slice(0, 10),
  });

  const patch = (values: Partial<typeof form>) => setForm((prev) => ({ ...prev, ...values }));

  const createSurvey = async () => {
    if (!form.institution_name.trim() || !form.survey_name.trim()) {
      toast.error("Institution name and survey name are required.");
      return;
    }
    setSaving(true);
    const { data, error } = await supabase.from("surveys").insert(form as never).select().single();
    setSaving(false);
    if (error || !data) {
      toast.error("Unable to create the survey. Please try again.");
      return;
    }
    toast.success("Survey created.");
    refetch();
    navigate({ to: "/survey/$surveyId", params: { surveyId: (data as { id: string }).id } });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-4">
          <Leaf className="size-5 text-primary" />
          <span className="text-base font-semibold">Campus Eco Survey</span>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-6 px-4 py-8 lg:grid-cols-[1.1fr_1fr]">
        <section className="panel p-6">
          <h1 className="text-xl font-semibold">Create new survey</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Works for any college, university, school, research campus, farmland, garden or park.
          </p>
          <div className="mt-5 space-y-3">
            <Field label="Institution / organization name">
              <Input
                value={form.institution_name}
                placeholder="e.g. GSSS Institute of Engineering and Technology"
                onChange={(e) => patch({ institution_name: e.target.value })}
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Campus / land name">
                <Input
                  value={form.campus_name}
                  placeholder="Main Campus"
                  onChange={(e) => patch({ campus_name: e.target.value })}
                />
              </Field>
              <Field label="City">
                <Input
                  value={form.city}
                  placeholder="Mysuru"
                  onChange={(e) => patch({ city: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Survey name">
              <Input
                value={form.survey_name}
                placeholder="Campus Biodiversity Survey 2026"
                onChange={(e) => patch({ survey_name: e.target.value })}
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Survey type">
                <Select
                  value={form.survey_type}
                  onValueChange={(value) => patch({ survey_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SURVEY_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Survey date">
                <Input
                  type="date"
                  value={form.survey_date}
                  onChange={(e) => patch({ survey_date: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Surveyor / team name">
              <Input
                value={form.surveyor}
                placeholder="Botany Club Team A"
                onChange={(e) => patch({ surveyor: e.target.value })}
              />
            </Field>
            <Button className="w-full" onClick={createSurvey} disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Plus className="mr-2 size-4" />
              )}
              Create Survey
            </Button>
          </div>
        </section>

        <section className="panel p-6">
          <h2 className="text-base font-semibold">Your surveys</h2>
          {isLoading ? (
            <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
          ) : surveys && surveys.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {surveys.map((survey) => (
                <li key={survey.id}>
                  <Link
                    to="/survey/$surveyId"
                    params={{ surveyId: survey.id }}
                    className="block rounded-md border p-3 transition hover:border-primary/50 hover:bg-accent/40"
                  >
                    <p className="text-sm font-medium">{survey.survey_name}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="size-3" />
                      {[survey.institution_name, survey.campus_name, survey.city]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-6 rounded-md border border-dashed p-6 text-center">
              <p className="text-sm font-medium">🌱 No surveys yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Create your first survey to start collecting field data.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
