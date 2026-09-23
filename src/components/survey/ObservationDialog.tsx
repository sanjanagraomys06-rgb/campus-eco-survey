import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Loader2, MapPin, Minus, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import {
  queueObservation,
  uploadFile,
  useSaveObservation,
  useOnlineStatus,
} from "@/lib/survey-data";
import {
  GROWTH_FORMS,
  HEALTH_OPTIONS,
  NATIVE_OPTIONS,
  PHOTO_TYPES,
  labelize,
  type Observation,
  type PlantMaster,
  type SurveyArea,
} from "@/lib/survey-types";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surveyId: string;
  areas: SurveyArea[];
  plants: PlantMaster[];
  observation: Observation | null;
  point: { x: number; y: number } | null;
  defaultSurveyor: string;
  onSaved?: () => void;
};

type FormState = {
  common_name: string;
  local_name: string;
  scientific_name: string;
  family: string;
  plant_id: string | null;
  area_id: string;
  count: number;
  height: string;
  girth: string;
  growth_form: string;
  health: string;
  native_status: string;
  flower_present: boolean;
  fruit_present: boolean;
  identification_status: string;
  remarks: string;
  surveyor: string;
  survey_date: string;
  latitude: number | null;
  longitude: number | null;
  gps_accuracy: number | null;
};

const emptyForm = (surveyor: string): FormState => ({
  common_name: "",
  local_name: "",
  scientific_name: "",
  family: "",
  plant_id: null,
  area_id: "none",
  count: 1,
  height: "",
  girth: "",
  growth_form: "",
  health: "healthy",
  native_status: "unknown",
  flower_present: false,
  fruit_present: false,
  identification_status: "identified",
  remarks: "",
  surveyor,
  survey_date: new Date().toISOString().slice(0, 10),
  latitude: null,
  longitude: null,
  gps_accuracy: null,
});

export function ObservationDialog({
  open,
  onOpenChange,
  surveyId,
  areas,
  plants,
  observation,
  point,
  defaultSurveyor,
  onSaved,
}: Props) {
  const [form, setForm] = useState<FormState>(emptyForm(defaultSurveyor));
  const [search, setSearch] = useState("");
  const [showMore, setShowMore] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [photoType, setPhotoType] = useState("whole_plant");
  const save = useSaveObservation(surveyId);
  const online = useOnlineStatus();

  useEffect(() => {
    if (!open) return;
    if (observation) {
      setForm({
        common_name: observation.common_name,
        local_name: observation.local_name ?? "",
        scientific_name: observation.scientific_name ?? "",
        family: observation.family ?? "",
        plant_id: observation.plant_id,
        area_id: observation.area_id ?? "none",
        count: observation.count,
        height: observation.height?.toString() ?? "",
        girth: observation.girth?.toString() ?? "",
        growth_form: observation.growth_form ?? "",
        health: observation.health ?? "healthy",
        native_status: observation.native_status ?? "unknown",
        flower_present: observation.flower_present,
        fruit_present: observation.fruit_present,
        identification_status: observation.identification_status,
        remarks: observation.remarks ?? "",
        surveyor: observation.surveyor ?? defaultSurveyor,
        survey_date: observation.survey_date,
        latitude: observation.latitude,
        longitude: observation.longitude,
        gps_accuracy: observation.gps_accuracy,
      });
    } else {
      setForm(emptyForm(defaultSurveyor));
    }
    setSearch("");
    setFiles([]);
    setShowMore(false);
  }, [open, observation, defaultSurveyor]);

  const matches = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return [];
    return plants
      .filter((p) =>
        [p.common_name, p.scientific_name, p.local_names ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(term),
      )
      .slice(0, 6);
  }, [plants, search]);

  const patch = (values: Partial<FormState>) => setForm((prev) => ({ ...prev, ...values }));

  const selectPlant = (plant: PlantMaster) => {
    patch({
      plant_id: plant.id,
      common_name: plant.common_name,
      scientific_name: plant.scientific_name,
      family: plant.family ?? "",
      local_name: plant.local_names ?? "",
      growth_form: plant.plant_type ?? "",
      native_status: plant.native_status ?? "unknown",
      identification_status: "identified",
    });
    setSearch("");
  };

  const captureGps = () => {
    if (!navigator.geolocation) {
      toast.error("Unable to get GPS location. You can continue by using the map location.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        patch({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          gps_accuracy: pos.coords.accuracy,
        }),
      () => toast.error("Unable to get GPS location. You can continue by using the map location."),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const submit = async () => {
    const name = form.common_name.trim();
    if (!name && form.identification_status !== "pending") {
      toast.error("Please enter a plant name, or mark it as identification pending.");
      return;
    }
    if (form.count < 0) {
      toast.error("Count cannot be negative.");
      return;
    }
    const height = form.height === "" ? null : Number(form.height);
    const girth = form.girth === "" ? null : Number(form.girth);
    if ((height !== null && height < 0) || (girth !== null && girth < 0)) {
      toast.error("Height and girth cannot be negative.");
      return;
    }

    const values = {
      common_name: name || "Unknown plant",
      local_name: form.local_name,
      scientific_name: form.scientific_name,
      family: form.family,
      plant_id: form.plant_id,
      area_id: form.area_id === "none" ? null : form.area_id,
      count: form.count,
      height,
      girth,
      growth_form: form.growth_form,
      health: form.health,
      native_status: form.native_status,
      flower_present: form.flower_present,
      fruit_present: form.fruit_present,
      identification_status: form.identification_status,
      remarks: form.remarks,
      surveyor: form.surveyor,
      survey_date: form.survey_date,
      latitude: form.latitude,
      longitude: form.longitude,
      gps_accuracy: form.gps_accuracy,
      ...(observation
        ? {}
        : {
            map_x: point?.x ?? null,
            map_y: point?.y ?? null,
            survey_time: new Date().toTimeString().slice(0, 8),
          }),
    };

    if (!online && !observation) {
      queueObservation({ ...values, survey_id: surveyId });
      toast.success("You are offline. Data saved locally and will sync when connection returns.");
      onOpenChange(false);
      return;
    }

    try {
      const saved = await save.mutateAsync({ id: observation?.id, values });
      if (files.length > 0) {
        for (const file of files) {
          const ref = await uploadFile("plant-photos", file, surveyId);
          await supabase
            .from("observation_photos")
            .insert({ observation_id: saved.id, photo_type: photoType, photo_url: ref } as never);
        }
      }
      toast.success(observation ? "Plant updated successfully." : "Plant saved successfully.");
      onOpenChange(false);
      onSaved?.();
    } catch {
      toast.error("Unable to save this plant. Please check the details and try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] gap-4 overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{observation ? "Edit plant observation" : "Add plant"}</DialogTitle>
          <DialogDescription>
            {point && !observation
              ? `Map position ${(point.x * 100).toFixed(1)}% × ${(point.y * 100).toFixed(1)}%`
              : "Basic details first — extra field data is optional."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Plant name</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search plant knowledge database…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {matches.length > 0 && (
              <div className="overflow-hidden rounded-md border">
                {matches.map((plant) => (
                  <button
                    key={plant.id}
                    type="button"
                    onClick={() => selectPlant(plant)}
                    className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-accent"
                  >
                    <span className="font-medium">{plant.common_name}</span>
                    <span className="text-xs italic text-muted-foreground">
                      {plant.scientific_name} · {plant.family}
                    </span>
                  </button>
                ))}
              </div>
            )}
            <Input
              placeholder="Common name"
              value={form.common_name}
              onChange={(e) => patch({ common_name: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Scientific name"
                value={form.scientific_name}
                onChange={(e) => patch({ scientific_name: e.target.value })}
              />
              <Input
                placeholder="Family"
                value={form.family}
                onChange={(e) => patch({ family: e.target.value })}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Switch
                checked={form.identification_status === "pending"}
                onCheckedChange={(checked) =>
                  patch({ identification_status: checked ? "pending" : "identified" })
                }
              />
              Unknown plant / identification pending
            </label>
          </div>

          <div className="space-y-2">
            <Label>Number observed</Label>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => patch({ count: Math.max(0, form.count - 1) })}
              >
                <Minus className="size-4" />
              </Button>
              <Input
                type="number"
                min={0}
                className="w-24 text-center text-lg font-semibold"
                value={form.count}
                onChange={(e) => patch({ count: Math.max(0, Number(e.target.value) || 0) })}
              />
              <Button variant="outline" size="icon" onClick={() => patch({ count: form.count + 1 })}>
                <Plus className="size-4" />
              </Button>
              <div className="ml-auto flex gap-1">
                {[1, 2, 5, 10].map((step) => (
                  <Button
                    key={step}
                    variant="secondary"
                    size="sm"
                    onClick={() => patch({ count: form.count + step })}
                  >
                    +{step}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Survey area</Label>
              <Select value={form.area_id} onValueChange={(value) => patch({ area_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="No area" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No area</SelectItem>
                  {areas.map((area) => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.area_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Health</Label>
              <Select value={form.health} onValueChange={(value) => patch({ health: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HEALTH_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {labelize(option)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowMore((v) => !v)}
            className="flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm font-medium"
          >
            Additional details
            <ChevronDown className={cn("size-4 transition", showMore && "rotate-180")} />
          </button>

          {showMore && (
            <div className="space-y-3 rounded-md border bg-surface p-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Height (m)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.height}
                    onChange={(e) => patch({ height: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Girth (cm)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.girth}
                    onChange={(e) => patch({ girth: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Growth form</Label>
                  <Select
                    value={form.growth_form || "unset"}
                    onValueChange={(value) => patch({ growth_form: value === "unset" ? "" : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unset">Not set</SelectItem>
                      {GROWTH_FORMS.map((form_) => (
                        <SelectItem key={form_} value={form_}>
                          {form_}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Native status</Label>
                  <Select
                    value={form.native_status}
                    onValueChange={(value) => patch({ native_status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {NATIVE_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {labelize(option)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <Switch
                    checked={form.flower_present}
                    onCheckedChange={(checked) => patch({ flower_present: checked })}
                  />
                  Flowering
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Switch
                    checked={form.fruit_present}
                    onCheckedChange={(checked) => patch({ fruit_present: checked })}
                  />
                  Fruiting
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Surveyor</Label>
                  <Input
                    value={form.surveyor}
                    onChange={(e) => patch({ surveyor: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Survey date</Label>
                  <Input
                    type="date"
                    value={form.survey_date}
                    onChange={(e) => patch({ survey_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Photos</Label>
                <div className="flex gap-2">
                  <Select value={photoType} onValueChange={setPhotoType}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PHOTO_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {labelize(type)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>GPS location (optional)</Label>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={captureGps}>
                    <MapPin className="mr-2 size-4" /> Capture current location
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {form.latitude
                      ? `${form.latitude.toFixed(5)}, ${form.longitude?.toFixed(5)} ±${Math.round(form.gps_accuracy ?? 0)}m`
                      : "Not captured"}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Remarks</Label>
                <Textarea
                  rows={2}
                  value={form.remarks}
                  onChange={(e) => patch({ remarks: e.target.value })}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={save.isPending}>
            {save.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            {observation ? "Save changes" : "Save observation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
