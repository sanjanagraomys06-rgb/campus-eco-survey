import * as XLSX from "xlsx";
import type { Observation, Survey, SurveyArea } from "./survey-types";
import { labelize, markerCode } from "./survey-types";
import { speciesSummary as summarize } from "./survey-data";


export type ExportRow = Record<string, string | number>;

function orderedObservations(observations: Observation[]) {
  return [...observations].sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export function buildRecordRows(
  survey: Survey,
  observations: Observation[],
  areas: SurveyArea[],
): ExportRow[] {
  const areaName = (id: string | null) => areas.find((a) => a.id === id)?.area_name ?? "";
  return orderedObservations(observations).map((o, index) => ({
    Survey: survey.survey_name,
    Institution: survey.institution_name,
    Campus: survey.campus_name,
    City: survey.city,
    "Survey Area": areaName(o.area_id),
    "Plant ID": markerCode(index),
    "Common Name": o.common_name,
    "Local Name": o.local_name ?? "",
    "Scientific Name": o.scientific_name ?? "",
    Family: o.family ?? "",
    Count: o.count,
    Latitude: o.latitude ?? "",
    Longitude: o.longitude ?? "",
    "GPS Accuracy": o.gps_accuracy ?? "",
    "Map X": o.map_x ?? "",
    "Map Y": o.map_y ?? "",
    "Height (m)": o.height ?? "",
    "Girth (cm)": o.girth ?? "",
    "Growth Form": o.growth_form ?? "",
    Health: labelize(o.health),
    "Native Status": labelize(o.native_status),
    "Flower Present": o.flower_present ? "Yes" : "No",
    "Fruit Present": o.fruit_present ? "Yes" : "No",
    "Identification Status": labelize(o.identification_status),
    "Survey Date": o.survey_date,
    "Survey Time": o.survey_time,
    Surveyor: o.surveyor ?? "",
    Remarks: o.remarks ?? "",
  }));
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function fileBase(survey: Survey) {
  return survey.survey_name.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "survey";
}

export function exportCsv(survey: Survey, observations: Observation[], areas: SurveyArea[]) {
  const rows = buildRecordRows(survey, observations, areas);
  const sheet = XLSX.utils.json_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(sheet);
  download(new Blob([csv], { type: "text/csv;charset=utf-8" }), `${fileBase(survey)}.csv`);
}

export function exportExcel(survey: Survey, observations: Observation[], areas: SurveyArea[]) {
  const book = XLSX.utils.book_new();

  const records = XLSX.utils.json_to_sheet(buildRecordRows(survey, observations, areas));
  XLSX.utils.book_append_sheet(book, records, "Survey Records");

  const plantRows = summarize(observations).map((s) => ({
    Plant: s.common_name,
    "Scientific Name": s.scientific_name,
    "Total Count": s.total,
    "Number of Locations": s.locations,
  }));
  XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(plantRows), "Plant Summary");

  const areaRows = areas.map((a) => {
    const inArea = observations.filter((o) => o.area_id === a.id);
    return {
      Area: a.area_name,
      "Total Plants": inArea.reduce((sum, o) => sum + o.count, 0),
      Species: new Set(inArea.map((o) => (o.scientific_name || o.common_name).toLowerCase())).size,
      Status: labelize(a.status),
    };
  });
  XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(areaRows), "Area Summary");

  const out = XLSX.write(book, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
  download(
    new Blob([out], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    `${fileBase(survey)}.xlsx`,
  );
}

/** Parses an uploaded CSV/Excel file into plant master rows. */
export async function parsePlantImport(file: File) {
  const buffer = await file.arrayBuffer();
  const book = XLSX.read(buffer, { type: "array" });
  const firstSheet = book.Sheets[book.SheetNames[0]!]!;
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: "" });

  const pick = (row: Record<string, unknown>, keys: string[]) => {
    for (const key of Object.keys(row)) {
      const normalized = key.toLowerCase().replace(/[^a-z]/g, "");
      if (keys.includes(normalized)) return String(row[key] ?? "").trim();
    }
    return "";
  };

  const valid: Record<string, string>[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();

  raw.forEach((row, index) => {
    const common = pick(row, ["commonname", "plantname", "name", "common"]);
    const scientific = pick(row, ["scientificname", "botanicalname", "scientific"]);
    if (!common && !scientific) {
      errors.push(`Row ${index + 2}: missing plant name`);
      return;
    }
    const key = (scientific || common).toLowerCase();
    if (seen.has(key)) {
      errors.push(`Row ${index + 2}: duplicate entry "${scientific || common}"`);
      return;
    }
    seen.add(key);
    valid.push({
      common_name: common || scientific,
      scientific_name: scientific,
      local_names: pick(row, ["localnames", "localname"]),
      family: pick(row, ["family"]),
      genus: pick(row, ["genus"]),
      species: pick(row, ["species"]),
      plant_type: pick(row, ["planttype", "type", "growthform"]),
      native_status: pick(row, ["nativestatus", "native"]).toLowerCase() || "unknown",
      description: pick(row, ["description"]),
      ecological_information: pick(row, ["ecologicalimportance", "ecologicalinformation"]),
      flowering_season: pick(row, ["floweringseason"]),
      fruiting_season: pick(row, ["fruitingseason"]),
      common_uses: pick(row, ["commonuses", "uses"]),
    });
  });

  return { valid, errors };
}
