import type { RiskLevel } from "./types/disaster";

export const MUNICIPALITY_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  Aileu: { lat: -8.7281, lng: 125.5668 },
  Ainaro: { lat: -8.9936, lng: 125.5081 },
  Baucau: { lat: -8.4712, lng: 126.4571 },
  Bobonaro: { lat: -8.9692, lng: 125.2197 },
  Covalima: { lat: -9.3129, lng: 125.2565 },
  Dili: { lat: -8.5726, lng: 125.579 },
  Ermera: { lat: -8.7522, lng: 125.3983 },
  Lautem: { lat: -8.5186, lng: 126.9989 },
  "Lautém": { lat: -8.5186, lng: 126.9989 },
  Liquica: { lat: -8.6101, lng: 125.3436 },
  "Liquiçá": { lat: -8.6101, lng: 125.3436 },
  Manatuto: { lat: -8.5114, lng: 126.0144 },
  Manufahi: { lat: -9.0146, lng: 125.8279 },
  Oecussi: { lat: -9.1981, lng: 124.3648 },
  Viqueque: { lat: -8.8591, lng: 126.3646 }
};

const MUNICIPALITY_ALIASES: Record<string, string> = {
  Oecusse: "Oecussi",
  "Oé-Cusse": "Oecussi",
  "Oe-Cusse": "Oecussi",
  "Oe Cusse": "Oecussi",
  "Oecusse-Ambeno": "Oecussi",
  "Oecusse Ambeno": "Oecussi",
  "Oé-Cusse Ambeno": "Oecussi",
  "Oe-Cusse Ambeno": "Oecussi",
  "Pante Macassar": "Oecussi"
};

const MUNICIPALITY_ALIASES_BY_KEY = new Map(
  Object.entries(MUNICIPALITY_ALIASES).map(([alias, canonical]) => [normalizeMunicipalityNameKey(alias), canonical])
);

const MUNICIPALITY_TEXT_REPLACEMENTS = Object.entries(MUNICIPALITY_ALIASES)
  .sort(([left], [right]) => right.length - left.length)
  .map(([alias, canonical]) => ({
    pattern: new RegExp("\\b" + escapeRegExp(alias) + "\\b", "giu"),
    canonical
  }));

export function detectMunicipalities(text: string) {
  const normalized = normalizeMunicipalityNameKey(text);
  const candidates = [...Object.keys(MUNICIPALITY_CENTROIDS), ...Object.keys(MUNICIPALITY_ALIASES)];
  const detected = candidates
    .filter((name) => normalized.includes(normalizeMunicipalityNameKey(name)))
    .map((name) => canonicalizeMunicipalityName(name));

  return uniqueMunicipalityNames(detected);
}

export function canonicalizeMunicipalityName(name: string) {
  const trimmed = name.trim();
  return MUNICIPALITY_ALIASES_BY_KEY.get(normalizeMunicipalityNameKey(trimmed)) ?? trimmed;
}

export function replaceMunicipalityAliasesInText(text: string) {
  return MUNICIPALITY_TEXT_REPLACEMENTS.reduce(
    (value, replacement) => value.replace(replacement.pattern, replacement.canonical),
    text
  );
}

export function uniqueMunicipalityNames(values: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const name = canonicalizeMunicipalityName(value);
    const normalized = normalizeMunicipalityNameKey(name);
    if (!name || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(name);
  }

  return result;
}

export function normalizeMunicipalityNameKey(value: string) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}

export function riskColor(level: RiskLevel) {
  if (level === "High") return "red";
  if (level === "Medium") return "yellow";
  return "green";
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
