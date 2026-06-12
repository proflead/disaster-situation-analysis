export type RiskLevel = "Low" | "Medium" | "High";
export type Priority = "Critical" | "High" | "Medium";
export type GapStatus = "Green" | "Yellow" | "Red";

export type Citation = {
  source: string;
  section: string;
  excerpt: string;
};

export type Contradiction = {
  field: string;
  reportA: string;
  valueA: string;
  reportB: string;
  valueB: string;
  severity: RiskLevel;
};

export type MissingInformation = {
  item: string;
  severity: RiskLevel;
  reason: string;
};

export type InfrastructureImpact = {
  type: string;
  location: string;
  status: string;
  severity: RiskLevel;
  source: string;
};

export type ShelterStatus = {
  name: string;
  municipality: string;
  capacity: number;
  occupancy: number;
  status: string;
};

export type RoadStatus = {
  name: string;
  municipality: string;
  status: string;
  impact: string;
};

export type HospitalStatus = {
  name: string;
  municipality: string;
  status: string;
  capacityNote: string;
};

export type SchoolStatus = {
  name: string;
  municipality: string;
  status: string;
};

export type MunicipalityImpact = {
  municipality: string;
  affectedSucos: number | null;
  affectedPopulation: string;
  sheltersOpen: number;
  healthFacilitiesMentioned: number;
  roadIssues: number;
  riskLevel: RiskLevel;
};

export type SummaryChartDatum = {
  label: string;
  value: number;
  unit: string;
  source: string;
};

export type SummaryChart = {
  title: string;
  description: string;
  chartType: "bar" | "metric";
  unit: string;
  sourceNote: string;
  data: SummaryChartDatum[];
};

export type DisasterExtraction = {
  disasterType: string;
  municipalities: string[];
  eventDate: string;
  affectedPopulation: string;
  vulnerableGroups: string[];
  infrastructureDamage: InfrastructureImpact[];
  shelters: ShelterStatus[];
  roads: RoadStatus[];
  waterSupplyStatus: string;
  hospitals: HospitalStatus[];
  schools: SchoolStatus[];
  criticalInfrastructureImpacts: InfrastructureImpact[];
  municipalityImpacts: MunicipalityImpact[];
  confidenceScore: number;
  assumptions: string[];
  contradictions: Contradiction[];
  missingInformation: MissingInformation[];
};

export type RiskAssessment = {
  lifeSafety: RiskLevel;
  infrastructure: RiskLevel;
  logistics: RiskLevel;
  publicHealth: RiskLevel;
};

export type ActionPlanItem = {
  priority: Priority;
  action: string;
  responsibleAgency: string;
  resourcesRequired: string[];
  timeline: string;
  citations: Citation[];
};

export type MunicipalityPlan = {
  municipality: string;
  currentSituation: string;
  riskLevel: RiskLevel;
  priorityActions: ActionPlanItem[];
  assumptions: string[];
  confidenceScore: number;
};

export type ResourceGap = {
  label: string;
  required: string;
  available: string;
  deficit: string;
  status: GapStatus;
  recommendation: string;
};

export type MapFeature = {
  id: string;
  type: "affected" | "hospital" | "shelter" | "school" | "road" | "critical";
  name: string;
  municipality: string;
  lat: number;
  lng: number;
  severity: RiskLevel;
  note: string;
};

export type AnalysisResult = {
  id: string;
  createdAt: string;
  uploadedFiles: string[];
  extraction: DisasterExtraction;
  executiveSummary: {
    executiveSummary: string;
    situationOverview: string;
    municipalitiesAffected: string;
    impactAssessment: string;
    riskAssessment: RiskAssessment;
    informationGaps: MissingInformation[];
    contradictions: Contradiction[];
    assumptions: string[];
    confidenceScore: number;
    citations: Citation[];
    summaryCharts: SummaryChart[];
  };
  situationBrief: {
    disasterType: string;
    severity: RiskLevel;
    municipalities: string[];
    populationAffected: string;
    topRisks: string[];
    recommendedActions: string[];
  };
  actionPlan: {
    overallSummary: string;
    combinedPlan: MunicipalityPlan;
    municipalityPlans: MunicipalityPlan[];
  };
  resourceGapAnalysis: {
    overview: string;
    gaps: ResourceGap[];
    recommendations: string[];
  };
  mapFeatures: MapFeature[];
  ragCitations: Citation[];
};
