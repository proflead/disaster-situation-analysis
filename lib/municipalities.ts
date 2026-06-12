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
  Oecusse: { lat: -9.1981, lng: 124.3648 },
  Viqueque: { lat: -8.8591, lng: 126.3646 }
};

export function detectMunicipalities(text: string) {
  const normalized = text.toLowerCase();
  return Object.keys(MUNICIPALITY_CENTROIDS)
    .filter((name) => normalized.includes(name.toLowerCase()))
    .filter((name, index, names) => {
      const plain = name.normalize("NFD").replace(/\p{Diacritic}/gu, "");
      return names.findIndex((candidate) => candidate.normalize("NFD").replace(/\p{Diacritic}/gu, "") === plain) === index;
    });
}

export function riskColor(level: RiskLevel) {
  if (level === "High") return "red";
  if (level === "Medium") return "yellow";
  return "green";
}
