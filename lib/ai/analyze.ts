import { randomUUID } from "crypto";
import { OPENAI_ANALYSIS_MODEL, getOpenAIClient } from "./client";
import { buildAnalysisPrompt } from "./prompts";
import { disasterAnalysisJsonSchema } from "./schemas";
import type { AnalysisResult } from "@/lib/types/disaster";
import { normalizeAnalysisMapFeatures } from "@/lib/map/normalize";
import { canonicalizeMunicipalityName, replaceMunicipalityAliasesInText, uniqueMunicipalityNames } from "@/lib/municipalities";

type ReportInput = {
  filename: string;
  text: string;
};

type AnalysisPayload = Omit<AnalysisResult, "id" | "createdAt" | "uploadedFiles">;

const OPENAI_RESPONSE_TIMEOUT_MS = 280000;

export async function analyzeDisasterReports({
  reports,
  ragContext
}: {
  reports: ReportInput[];
  ragContext: string;
}): Promise<AnalysisResult> {
  const openai = getOpenAIClient();

  if (!openai) {
    throw new Error(
      "OPENAI_API_KEY is required to analyze uploaded reports. In Vercel, add OPENAI_API_KEY in Project Settings > Environment Variables for Production/Preview and redeploy. For local development, add it to .env.local and restart the app."
    );
  }

  const response = await openai.responses.create({
    model: OPENAI_ANALYSIS_MODEL,
    instructions:
      "You are an emergency-management AI assistant. Return only valid JSON that matches the requested schema. Cite SOP and guideline context in recommendations.",
    input: buildAnalysisPrompt({ reports, ragContext }),
    text: {
      format: {
        type: "json_schema",
        ...disasterAnalysisJsonSchema
      }
    },
    max_output_tokens: 12000
  } as never, { timeout: OPENAI_RESPONSE_TIMEOUT_MS });

  const outputText =
    (response as unknown as { output_text?: string }).output_text ??
    extractOutputText(response as unknown as { output?: unknown[] });

  const parsed = normalizeAnalysisMunicipalityNames(parseAnalysisOutput(outputText));

  const analysis = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    uploadedFiles: reports.map((report) => report.filename),
    ...parsed
  };

  return {
    ...analysis,
    mapFeatures: normalizeAnalysisMapFeatures(analysis)
  };
}

function normalizeAnalysisMunicipalityNames(payload: AnalysisPayload): AnalysisPayload {
  const normalizeText = replaceMunicipalityAliasesInText;
  const normalizeMunicipality = canonicalizeMunicipalityName;
  const normalizePlan = (plan: AnalysisPayload["actionPlan"]["combinedPlan"]) => ({
    ...plan,
    municipality: normalizeMunicipality(plan.municipality),
    currentSituation: normalizeText(plan.currentSituation),
    assumptions: plan.assumptions.map(normalizeText),
    priorityActions: plan.priorityActions.map((action) => ({
      ...action,
      action: normalizeText(action.action),
      responsibleAgency: normalizeText(action.responsibleAgency),
      resourcesRequired: action.resourcesRequired.map(normalizeText),
      citations: action.citations.map((citation) => ({
        ...citation,
        section: normalizeText(citation.section)
      }))
    }))
  });

  return {
    ...payload,
    extraction: {
      ...payload.extraction,
      municipalities: uniqueMunicipalityNames(payload.extraction.municipalities),
      infrastructureDamage: payload.extraction.infrastructureDamage.map((item) => ({
        ...item,
        location: normalizeText(item.location),
        status: normalizeText(item.status)
      })),
      shelters: payload.extraction.shelters.map((item) => ({
        ...item,
        name: normalizeText(item.name),
        municipality: normalizeMunicipality(item.municipality),
        status: normalizeText(item.status)
      })),
      roads: payload.extraction.roads.map((item) => ({
        ...item,
        name: normalizeText(item.name),
        municipality: normalizeMunicipality(item.municipality),
        status: normalizeText(item.status),
        impact: normalizeText(item.impact)
      })),
      hospitals: payload.extraction.hospitals.map((item) => ({
        ...item,
        name: normalizeText(item.name),
        municipality: normalizeMunicipality(item.municipality),
        status: normalizeText(item.status),
        capacityNote: normalizeText(item.capacityNote)
      })),
      schools: payload.extraction.schools.map((item) => ({
        ...item,
        name: normalizeText(item.name),
        municipality: normalizeMunicipality(item.municipality),
        status: normalizeText(item.status)
      })),
      criticalInfrastructureImpacts: payload.extraction.criticalInfrastructureImpacts.map((item) => ({
        ...item,
        location: normalizeText(item.location),
        status: normalizeText(item.status)
      })),
      municipalityImpacts: payload.extraction.municipalityImpacts.map((impact) => ({
        ...impact,
        municipality: normalizeMunicipality(impact.municipality),
        affectedPopulation: normalizeText(impact.affectedPopulation)
      })),
      assumptions: payload.extraction.assumptions.map(normalizeText),
      contradictions: payload.extraction.contradictions.map((item) => ({
        ...item,
        field: normalizeText(item.field),
        valueA: normalizeText(item.valueA),
        valueB: normalizeText(item.valueB)
      })),
      missingInformation: payload.extraction.missingInformation.map((item) => ({
        ...item,
        item: normalizeText(item.item),
        reason: normalizeText(item.reason)
      }))
    },
    executiveSummary: {
      ...payload.executiveSummary,
      executiveSummary: normalizeText(payload.executiveSummary.executiveSummary),
      situationOverview: normalizeText(payload.executiveSummary.situationOverview),
      municipalitiesAffected: normalizeText(payload.executiveSummary.municipalitiesAffected),
      impactAssessment: normalizeText(payload.executiveSummary.impactAssessment),
      informationGaps: payload.executiveSummary.informationGaps.map((item) => ({
        ...item,
        item: normalizeText(item.item),
        reason: normalizeText(item.reason)
      })),
      contradictions: payload.executiveSummary.contradictions.map((item) => ({
        ...item,
        field: normalizeText(item.field),
        valueA: normalizeText(item.valueA),
        valueB: normalizeText(item.valueB)
      })),
      assumptions: payload.executiveSummary.assumptions.map(normalizeText),
      summaryCharts: payload.executiveSummary.summaryCharts.map((chart) => ({
        ...chart,
        title: normalizeText(chart.title),
        description: normalizeText(chart.description),
        sourceNote: normalizeText(chart.sourceNote),
        data: chart.data.map((datum) => ({
          ...datum,
          label: normalizeText(datum.label),
          source: normalizeText(datum.source)
        }))
      }))
    },
    situationBrief: {
      ...payload.situationBrief,
      municipalities: uniqueMunicipalityNames(payload.situationBrief.municipalities),
      populationAffected: normalizeText(payload.situationBrief.populationAffected),
      topRisks: payload.situationBrief.topRisks.map(normalizeText),
      recommendedActions: payload.situationBrief.recommendedActions.map(normalizeText)
    },
    actionPlan: {
      ...payload.actionPlan,
      overallSummary: normalizeText(payload.actionPlan.overallSummary),
      combinedPlan: normalizePlan(payload.actionPlan.combinedPlan),
      municipalityPlans: payload.actionPlan.municipalityPlans.map(normalizePlan)
    },
    resourceGapAnalysis: {
      ...payload.resourceGapAnalysis,
      overview: normalizeText(payload.resourceGapAnalysis.overview),
      gaps: payload.resourceGapAnalysis.gaps.map((gap) => ({
        ...gap,
        label: normalizeText(gap.label),
        required: normalizeText(gap.required),
        available: normalizeText(gap.available),
        deficit: normalizeText(gap.deficit),
        recommendation: normalizeText(gap.recommendation)
      })),
      recommendations: payload.resourceGapAnalysis.recommendations.map(normalizeText)
    },
    mapFeatures: payload.mapFeatures.map((feature) => ({
      ...feature,
      name: normalizeText(feature.name),
      municipality: normalizeMunicipality(feature.municipality),
      note: normalizeText(feature.note)
    }))
  };
}

function parseAnalysisOutput(outputText: string): AnalysisPayload {
  try {
    return JSON.parse(outputText) as AnalysisPayload;
  } catch {
    const excerpt = outputText.replace(/\s+/g, " ").trim().slice(0, 300) || "empty response";
    throw new Error(
      `OpenAI returned a non-JSON analysis response. Try again, or check OPENAI_ANALYSIS_MODEL in the deployment environment. Response excerpt: ${excerpt}`
    );
  }
}

function extractOutputText(response: { output?: unknown[] }) {
  const output = response.output ?? [];
  const chunks: string[] = [];
  for (const item of output) {
    const content = (item as { content?: unknown[] }).content ?? [];
    for (const contentItem of content) {
      const text = (contentItem as { text?: string }).text;
      if (text) chunks.push(text);
    }
  }
  return chunks.join("\n");
}
