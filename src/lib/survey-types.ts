export type Survey = {
  id: string;
  institution_name: string;
  campus_name: string;
  city: string;
  survey_name: string;
  survey_type: string;
  surveyor: string;
  survey_date: string;
  map_url: string | null;
  created_at: string;
  updated_at: string;
};

export type AreaStatus = "not_started" | "in_progress" | "complete";

export type SurveyArea = {
  id: string;
  survey_id: string;
  area_name: string;
  status: AreaStatus;
  created_at: string;
};

export type PlantMaster = {
  id: string;
  common_name: string;
  local_names: string | null;
  scientific_name: string;
  family: string | null;
  genus: string | null;
  species: string | null;
  plant_type: string | null;
  native_status: string | null;
  description: string | null;
  ecological_information: string | null;
  flowering_season: string | null;
  fruiting_season: string | null;
  common_uses: string | null;
  reference_image: string | null;
  created_at: string;
};

export type Observation = {
  id: string;
  survey_id: string;
  area_id: string | null;
  plant_id: string | null;
  common_name: string;
  local_name: string | null;
  scientific_name: string | null;
  family: string | null;
  count: number;
  map_x: number | null;
  map_y: number | null;
  latitude: number | null;
  longitude: number | null;
  gps_accuracy: number | null;
  height: number | null;
  girth: number | null;
  growth_form: string | null;
  health: string | null;
  native_status: string | null;
  flower_present: boolean;
  fruit_present: boolean;
  identification_status: string;
  remarks: string | null;
  surveyor: string | null;
  survey_date: string;
  survey_time: string;
  created_at: string;
  updated_at: string;
};

export type ObservationPhoto = {
  id: string;
  observation_id: string;
  photo_type: string;
  photo_url: string;
  created_at: string;
};

export const HEALTH_OPTIONS = [
  "healthy",
  "good",
  "stressed",
  "diseased",
  "damaged",
  "dead",
] as const;

export const NATIVE_OPTIONS = ["native", "introduced", "unknown"] as const;

export const GROWTH_FORMS = ["Tree", "Shrub", "Herb", "Climber", "Palm", "Grass", "Succulent"];

export const SURVEY_TYPES = [
  "Plant Survey",
  "Tree Survey",
  "Biodiversity Survey",
  "Waste Survey",
  "Infrastructure Survey",
  "Agriculture Survey",
  "Custom Survey",
];

export const PHOTO_TYPES = ["whole_plant", "leaf", "flower", "fruit", "bark", "other"];

export function labelize(value: string | null | undefined) {
  if (!value) return "—";
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function markerCode(index: number) {
  return `PLANT-${String(index + 1).padStart(4, "0")}`;
}
