import { MUNICIPALITY_CENTROIDS } from "@/lib/municipalities";
import type { AnalysisResult, MapFeature, MunicipalityImpact, RiskLevel } from "@/lib/types/disaster";

const TIMOR_LESTE_BOUNDS = {
  minLat: -10.1,
  maxLat: -8.0,
  minLng: 123.7,
  maxLng: 127.6
};

const DEFAULT_CENTER = { lat: -8.8742, lng: 125.7275 };

export function normalizeAnalysisMapFeatures(analysis: Pick<AnalysisResult, "mapFeatures" | "extraction" | "situationBrief">) {
  return normalizeMapFeatures([
    ...(analysis.mapFeatures ?? []),
    ...buildMunicipalityFallbackFeatures(analysis)
  ]);
}

export function normalizeMapFeatures(features: MapFeature[]) {
  return features.map((feature) => normalizeMapFeature(feature));
}

export function normalizeMapFeature(feature: MapFeature): MapFeature {
  const centroid = getMunicipalityCentroid(feature.municipality);
  const fixed = getValidCoordinate(feature.lat, feature.lng);
  const shouldUseCentroid = feature.type === "affected" || !fixed;
  const coordinate = shouldUseCentroid ? centroid : fixed;
  const usedFallback = shouldUseCentroid || Boolean(fixed?.wasSwapped);

  return {
    ...feature,
    lat: coordinate.lat,
    lng: coordinate.lng,
    note: usedFallback && !feature.note.toLowerCase().includes("centroid")
      ? feature.note + " Coordinates shown at municipality centroid when exact coordinates were unavailable or unreliable."
      : feature.note
  };
}

export function getMapCenter(features: MapFeature[]) {
  if (!features.length) return DEFAULT_CENTER;
  const normalized = normalizeMapFeatures(features);
  const totals = normalized.reduce(
    (acc, feature) => ({ lat: acc.lat + feature.lat, lng: acc.lng + feature.lng }),
    { lat: 0, lng: 0 }
  );
  return {
    lat: totals.lat / normalized.length,
    lng: totals.lng / normalized.length
  };
}

function buildMunicipalityFallbackFeatures(analysis: Pick<AnalysisResult, "mapFeatures" | "extraction" | "situationBrief">) {
  const existingAffectedMunicipalities = new Set(
    (analysis.mapFeatures ?? [])
      .filter((feature) => feature.type === "affected")
      .map((feature) => normalizeName(feature.municipality))
  );
  const impactsByMunicipality = new Map(
    analysis.extraction.municipalityImpacts.map((impact) => [normalizeName(impact.municipality), impact])
  );
  const municipalities = uniqueMunicipalities([
    ...analysis.extraction.municipalityImpacts.map((impact) => impact.municipality),
    ...analysis.extraction.municipalities,
    ...analysis.situationBrief.municipalities
  ]);

  return municipalities
    .filter((municipality) => !existingAffectedMunicipalities.has(normalizeName(municipality)))
    .map((municipality) => {
      const impact = impactsByMunicipality.get(normalizeName(municipality));
      return createMunicipalityFallbackFeature(municipality, impact, analysis.situationBrief.severity);
    });
}

function createMunicipalityFallbackFeature(
  municipality: string,
  impact: MunicipalityImpact | undefined,
  fallbackSeverity: RiskLevel
): MapFeature {
  const centroid = getMunicipalityCentroid(municipality);
  const severity = impact?.riskLevel ?? fallbackSeverity;
  const affectedPopulation = impact?.affectedPopulation && impact.affectedPopulation !== "Not stated"
    ? " Affected population: " + impact.affectedPopulation + "."
    : "";

  return {
    id: "municipality-" + normalizeName(municipality).replace(/[^a-z0-9]+/g, "-"),
    type: "affected",
    name: municipality + " affected area",
    municipality,
    lat: centroid.lat,
    lng: centroid.lng,
    severity,
    note: "Generated from detected municipality because no exact map point was provided." + affectedPopulation + " Coordinates shown at municipality centroid."
  };
}

function uniqueMunicipalities(values: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const name = value.trim();
    const normalized = normalizeName(name);
    if (!name || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(name);
  }

  return result;
}

function getMunicipalityCentroid(name: string) {
  const direct = MUNICIPALITY_CENTROIDS[name];
  if (direct) return direct;

  const normalizedName = normalizeName(name);
  const match = Object.entries(MUNICIPALITY_CENTROIDS).find(([candidate]) => normalizeName(candidate) === normalizedName);
  return match?.[1] ?? DEFAULT_CENTER;
}

function getValidCoordinate(lat: number, lng: number) {
  if (isInTimorLeste(lat, lng)) return { lat, lng, wasSwapped: false };
  if (isInTimorLeste(lng, lat)) return { lat: lng, lng: lat, wasSwapped: true };
  return null;
}

function isInTimorLeste(lat: number, lng: number) {
  return Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= TIMOR_LESTE_BOUNDS.minLat &&
    lat <= TIMOR_LESTE_BOUNDS.maxLat &&
    lng >= TIMOR_LESTE_BOUNDS.minLng &&
    lng <= TIMOR_LESTE_BOUNDS.maxLng;
}

function normalizeName(value: string) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}
