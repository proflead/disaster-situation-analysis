"use client";

import { upload } from "@vercel/blob/client";
import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { AlertTriangle, BarChart3, BookOpenCheck, Building2, CheckCircle2, ClipboardList, Clock3, Download, FileText, Info, Loader2, PackageCheck, UploadCloud, Waves, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert } from "@/components/ui/alert";
import { DisasterMap } from "@/components/map/disaster-map";
import { DIRECT_UPLOAD_LIMIT_BYTES, VERCEL_UPLOAD_LIMIT_BYTES, formatUploadSize } from "@/lib/uploads/limits";
import type { AnalysisResult, GapStatus, MunicipalityImpact, Priority, RiskLevel, SummaryChart } from "@/lib/types/disaster";

export function CpaDashboard() {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = (acceptedFiles: File[]) => {
    setFiles((current) => {
      const nextFiles = [...current, ...acceptedFiles].slice(0, 20);
      const validationError = validateUploadSize(nextFiles);
      setError(validationError);
      return validationError ? current : nextFiles;
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"]
    },
    maxFiles: 20
  });

  async function runAnalysis() {
    if (!files.length) {
      setError("Add at least one PDF or XLSX file before running analysis.");
      return;
    }

    const validationError = validateUploadSize(files);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await runAnalysisRequest(files);
      const payload = await readJsonResponse(response);
      if (!response.ok) throw new Error(getResponseError(payload, "Analysis failed."));
      setAnalysis(payload as AnalysisResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function exportFile(kind: "pdf" | "pptx") {
    if (!analysis) return;
    try {
      setError(null);
      const response = await fetch("/api/export/" + kind, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(analysis)
      });
      if (!response.ok) throw new Error(await readErrorResponse(response));
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = kind === "pdf" ? "Civil-Protection-Authority-Copilot-Briefing.pdf" : "Civil-Protection-Authority-Copilot-Executive-Briefing.pptx";
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed.");
    }
  }

  const confidence = analysis ? Math.round(analysis.extraction.confidenceScore * 100) : 0;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="bg-teal-50 text-teal-800">Civil Protection Authority Copilot</Badge>
              <span className="text-xs font-medium text-slate-500">Timor-Leste municipal response</span>
            </div>
            <h1 className="mt-2 text-balance text-2xl font-semibold tracking-normal text-slate-950 lg:text-3xl">Disaster Situation Analysis and Response Planning</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">Upload reports and generate a response-ready briefing, action plan, resource gaps, and map.</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2 rounded-lg border bg-slate-50 p-1.5">
            <Button variant="ghost" onClick={() => exportFile("pdf")} disabled={!analysis}><Download size={16} /> PDF</Button>
            <Button variant="ghost" onClick={() => exportFile("pptx")} disabled={!analysis}><Download size={16} /> PPTX</Button>
            <Button onClick={runAnalysis} disabled={isAnalyzing}>{isAnalyzing ? <Loader2 className="animate-spin" size={16} /> : <Waves size={16} />} Analyze</Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-5 xl:grid-cols-[360px_1fr] lg:px-6">
        <section className="space-y-4 xl:sticky xl:top-4 xl:self-start">
          <Card className="border-slate-200 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm uppercase text-slate-600"><UploadCloud size={16} /> Documents <InfoTooltip text="Upload the PDF or XLSX reports, SOPs, guidelines, or assessments Civil Protection Authority Copilot should analyze." /></CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div {...getRootProps()} className={(isDragActive ? "border-teal-500 bg-teal-50 " : "border-slate-300 bg-white hover:border-teal-400 hover:bg-teal-50/40 ") + "flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed p-5 text-center transition-colors"}>
                <input {...getInputProps()} />
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-teal-600 text-white"><UploadCloud size={24} /></div>
                <p className="font-semibold text-slate-950">Drop reports here</p>
                <p className="mt-1 text-sm text-slate-500">PDF or XLSX, up to 25 MB total</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">Files</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">{files.length}/20</span>
                    {files.length > 0 && <button type="button" onClick={() => setFiles([])} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Clear files"><X size={14} /></button>}
                  </div>
                </div>
                {files.length ? (
                  <div className="max-h-56 space-y-2 overflow-auto pr-1">
                    {files.map((file) => (
                      <div key={file.name} className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
                        <FileText size={15} className="shrink-0 text-teal-700" />
                        <span className="truncate text-slate-700">{file.name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">No files selected.</p>
                )}
              </div>

              {error && <Alert className="border-red-200 bg-red-50 text-red-800">{error}</Alert>}
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm uppercase text-slate-600">Status <InfoTooltip text="Shows whether analysis has been generated and the AI confidence score after processing." /></CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Confidence</span>
                <strong className="text-slate-950">{confidence}%</strong>
              </div>
              <Progress value={confidence} />
              <div className="flex items-start gap-2 rounded-md bg-slate-50 p-3 text-sm text-slate-600">
                {analysis ? <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-700" /> : <Info size={16} className="mt-0.5 shrink-0 text-slate-500" />}
                <span>{analysis ? "Analysis complete. Review outputs on the right." : "Analysis appears after upload and processing."}</span>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="min-w-0">
          {analysis ? <AnalysisWorkspace analysis={analysis} /> : <EmptyAnalysisState isAnalyzing={isAnalyzing} />}
        </section>
      </div>
    </main>
  );
}

async function runAnalysisRequest(files: File[]) {
  const totalBytes = getTotalFileBytes(files);
  if (totalBytes <= VERCEL_UPLOAD_LIMIT_BYTES) {
    const body = new FormData();
    files.forEach((file) => body.append("files", file));
    return fetch("/api/analyze", { method: "POST", body });
  }

  const uploads = await uploadFilesToStorage(files);
  return fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uploads })
  });
}

async function uploadFilesToStorage(files: File[]) {
  const uploads = [];

  for (const file of files) {
    const blob = await upload("reports/" + sanitizeFilename(file.name), file, {
      access: "private",
      handleUploadUrl: "/api/uploads/blob",
      contentType: file.type || "application/octet-stream",
      multipart: file.size > VERCEL_UPLOAD_LIMIT_BYTES,
    });

    uploads.push({
      name: file.name,
      url: blob.url,
      pathname: blob.pathname,
      contentType: blob.contentType || file.type || "application/octet-stream",
    });
  }

  return uploads;
}

function validateUploadSize(files: File[]) {
  const totalBytes = getTotalFileBytes(files);
  if (totalBytes <= DIRECT_UPLOAD_LIMIT_BYTES) return null;
  return "Uploads must be under " + formatUploadSize(DIRECT_UPLOAD_LIMIT_BYTES) + " total. Selected files are " + formatUploadSize(totalBytes) + ". Use fewer or smaller files.";
}

function getTotalFileBytes(files: File[]) {
  return files.reduce((sum, file) => sum + file.size, 0);
}


function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "report";
}

async function readJsonResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return response.json();

  const text = await response.text();
  const message = summarizeResponseText(text);
  if (!response.ok) return { error: message || `Request failed with status ${response.status}.` };

  throw new Error(
    `Expected JSON from the analysis API, but received ${contentType || "a non-JSON response"}. ${message}`.trim()
  );
}

async function readErrorResponse(response: Response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const payload = await response.json();
    return getResponseError(payload, `Request failed with status ${response.status}.`);
  }

  return summarizeResponseText(await response.text()) || `Request failed with status ${response.status}.`;
}

function getResponseError(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object" && "error" in payload) {
    const error = (payload as { error?: unknown }).error;
    if (typeof error === "string" && error.trim()) return error;
  }
  return fallback;
}

function summarizeResponseText(text: string) {
  return text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 500);
}

function EmptyAnalysisState({ isAnalyzing }: { isAnalyzing: boolean }) {
  return (
    <Card className="min-h-[560px] border-slate-200 shadow-none">
      <CardContent className="flex min-h-[560px] flex-col items-center justify-center p-8 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-teal-600 text-white">
          {isAnalyzing ? <Loader2 className="animate-spin" size={28} /> : <ClipboardList size={28} />}
        </div>
        <h2 className="text-xl font-semibold text-slate-950">{isAnalyzing ? "Analyzing reports" : "No analysis yet"}</h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
          {isAnalyzing
            ? "Extracting facts, checking contradictions, retrieving guidance, and drafting response outputs. Large batches can take up to 5 minutes."
            : "Upload one or more PDF or XLSX reports, then click Analyze."}
        </p>
      </CardContent>
    </Card>
  );
}

function AnalysisWorkspace({ analysis }: { analysis: AnalysisResult }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
        <SummaryStat label="Disaster" value={analysis.extraction.disasterType} tooltip="The main hazard type identified from the uploaded reports, such as flood, earthquake, landslide, drought, or wildfire." />
        <SummaryStat label="Municipalities" value={analysis.extraction.municipalities.join(", ") || "Not stated"} tooltip="Municipalities automatically detected in the uploaded documents. No manual selection is used." />
        <SummaryStat label="People Affected" value={analysis.situationBrief.populationAffected || analysis.extraction.affectedPopulation} tooltip="The affected population figure extracted or summarized from the reports. Check contradictions if source figures differ." />
        <SummaryStat label="Confidence" value={Math.round(analysis.extraction.confidenceScore * 100) + "%"} tooltip="How confident the AI is based on available evidence, missing information, contradictions, and report clarity." />
      </div>

      <Tabs defaultValue="summary">
        <TabsList className="rounded-lg border border-slate-200 bg-white p-1 shadow-none">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="brief">Brief</TabsTrigger>
          <TabsTrigger value="plan">Plan</TabsTrigger>
          <TabsTrigger value="gaps">Gaps</TabsTrigger>
          <TabsTrigger value="map">Map</TabsTrigger>
        </TabsList>

        <TabsContent value="summary"><SummaryTab analysis={analysis} /></TabsContent>
        <TabsContent value="brief"><BriefTab analysis={analysis} /></TabsContent>
        <TabsContent value="plan"><PlanTab analysis={analysis} /></TabsContent>
        <TabsContent value="gaps"><GapsTab analysis={analysis} /></TabsContent>
        <TabsContent value="map"><DisasterMap features={analysis.mapFeatures} /></TabsContent>
      </Tabs>
    </div>
  );
}

function SummaryTab({ analysis }: { analysis: AnalysisResult }) {
  return (
    <div className="space-y-4">
      <Card className="border-slate-200 shadow-none">
        <CardHeader><CardTitle className="flex items-center gap-2">Executive Summary <InfoTooltip text="A concise operational summary for senior briefing and rapid situational awareness." /></CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm leading-6 text-slate-700">
          <p>{analysis.executiveSummary.executiveSummary}</p>
          <p>{analysis.executiveSummary.situationOverview}</p>
          <p>{analysis.executiveSummary.impactAssessment}</p>
        </CardContent>
      </Card>

      <ImpactCharts analysis={analysis} />

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="border-slate-200 shadow-none">
          <CardHeader><CardTitle className="flex items-center gap-2">Risk <InfoTooltip text="Risk levels by operational category. High means urgent attention is likely required." /></CardTitle></CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            {Object.entries(analysis.executiveSummary.riskAssessment).map(([key, value]) => (
              <RiskPill key={key} label={labelize(key)} level={value as RiskLevel} />
            ))}
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-none">
          <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle size={18} /> Attention Needed <InfoTooltip text="Critical missing information the officer may need to verify before final decisions." /></CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {analysis.extraction.missingInformation.slice(0, 3).map((gap) => (
              <PlainItem key={gap.item} title={gap.item} body={gap.reason} badge={gap.severity} />
            ))}
          </CardContent>
        </Card>
      </div>

      {analysis.extraction.contradictions.length > 0 && <Contradictions analysis={analysis} />}
    </div>
  );
}

function ImpactCharts({ analysis }: { analysis: AnalysisResult }) {
  const charts = getSummaryCharts(analysis);

  if (charts.length) {
    return <GeneratedSummaryCharts charts={charts} />;
  }

  const impacts = getMunicipalityImpacts(analysis);
  const maxOperational = Math.max(1, ...impacts.map((impact) => impact.sheltersOpen + impact.healthFacilitiesMentioned + impact.roadIssues));

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card className="border-slate-200 shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BarChart3 size={18} /> Summary Charts <InfoTooltip text="Charts are generated from numeric evidence in the uploaded reports. If no report-supported numbers are found, operational indicators are shown instead." /></CardTitle>
        </CardHeader>
        <CardContent className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
          No chartable suco, population, infrastructure, shelter, or resource-gap figures were found in the extracted summary.
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">Operational Indicators <InfoTooltip text="Fallback view using extracted shelters, health facilities, and road issues when report-level chart data is unavailable." /></CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {impacts.map((impact) => {
            return (
              <div key={impact.municipality} className="space-y-2 rounded-md border border-slate-200 bg-white p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{impact.municipality}</p>
                    <p className="text-xs text-slate-500">Population: {impact.affectedPopulation || "Not stated"}</p>
                  </div>
                  <RiskPill label="Risk" level={impact.riskLevel} />
                </div>
                <StackedBar impact={impact} max={maxOperational} />
                <div className="grid grid-cols-3 gap-2 text-xs text-slate-600">
                  <span>Shelters: <strong>{impact.sheltersOpen}</strong></span>
                  <span>Health: <strong>{impact.healthFacilitiesMentioned}</strong></span>
                  <span>Roads: <strong>{impact.roadIssues}</strong></span>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

function GeneratedSummaryCharts({ charts }: { charts: SummaryChart[] }) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {charts.slice(0, 4).map((chart) => <SummaryChartCard key={chart.title} chart={chart} />)}
    </div>
  );
}

function SummaryChartCard({ chart }: { chart: SummaryChart }) {
  const maxValue = Math.max(1, ...chart.data.map((datum) => datum.value));

  return (
    <Card className="border-slate-200 shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><BarChart3 size={18} /> {chart.title} <InfoTooltip text={chart.description || "Chart generated from uploaded report evidence."} /></CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {chart.chartType === "metric" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {chart.data.map((datum) => (
              <div key={datum.label} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-medium uppercase text-slate-500">{datum.label}</p>
                <p className="mt-1 text-2xl font-semibold text-slate-950">{datum.value.toLocaleString()} <span className="text-sm font-medium text-slate-500">{datum.unit}</span></p>
                <p className="mt-2 text-xs leading-5 text-slate-500">Source: {datum.source}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {chart.data.map((datum) => (
              <div key={datum.label}>
                <BarRow label={datum.label} value={datum.value} max={maxValue} suffix={datum.unit || chart.unit} emptyLabel="Not stated" />
                <p className="mt-1 text-xs leading-5 text-slate-500">Source: {datum.source}</p>
              </div>
            ))}
          </div>
        )}
        {chart.sourceNote && <p className="rounded-md bg-slate-50 p-3 text-xs leading-5 text-slate-600">{chart.sourceNote}</p>}
      </CardContent>
    </Card>
  );
}

function getSummaryCharts(analysis: AnalysisResult): SummaryChart[] {
  const generated = analysis.executiveSummary.summaryCharts ?? [];
  const usableGenerated = generated.filter((chart) => chart.data.some((datum) => Number.isFinite(datum.value) && datum.value > 0));
  if (usableGenerated.length) return usableGenerated;

  return buildFallbackSummaryCharts(analysis);
}

function buildFallbackSummaryCharts(analysis: AnalysisResult): SummaryChart[] {
  const impacts = getMunicipalityImpacts(analysis);
  const sucoData = impacts
    .filter((impact) => typeof impact.affectedSucos === "number" && impact.affectedSucos > 0)
    .map((impact) => ({
      label: impact.municipality,
      value: impact.affectedSucos ?? 0,
      unit: "sucos",
      source: "Structured municipality impact extraction"
    }));

  if (sucoData.length) {
    return [{
      title: "Affected sucos by municipality",
      description: "Municipality-level suco counts extracted from the uploaded report.",
      chartType: "bar",
      unit: "sucos",
      sourceNote: "Generated from municipalityImpacts in the structured analysis output.",
      data: sucoData
    }];
  }

  const fallbackText = getSummaryChartFallbackText(analysis);
  const totalSucos = extractSucoTotal(fallbackText);
  if (totalSucos) {
    return [{
      title: "Assessment coverage",
      description: "Total number of sucos stated in the uploaded report or generated summary.",
      chartType: "bar",
      unit: "sucos",
      sourceNote: "A total suco count was found, but municipality-level counts were not available in the structured extraction. The chart therefore shows the supported total only.",
      data: [{
        label: "Total sucos reported",
        value: totalSucos,
        unit: "sucos",
        source: "Executive summary / situation overview"
      }]
    }];
  }

  return [];
}

function getSummaryChartFallbackText(analysis: AnalysisResult) {
  return [
    analysis.executiveSummary.executiveSummary,
    analysis.executiveSummary.situationOverview,
    analysis.executiveSummary.municipalitiesAffected,
    analysis.executiveSummary.impactAssessment,
    analysis.extraction.affectedPopulation,
    analysis.extraction.assumptions.join(" ")
  ].join(" ");
}

function extractSucoTotal(text: string) {
  const match = text.match(/(\d{1,4})\s+(?:affected\s+|assessed\s+|at-risk\s+|risk-assessed\s+)?sucos?\b/i);
  if (!match) return null;
  return Number(match[1]);
}

function BarRow({ label, value, max, suffix, emptyLabel }: { label: string; value: number | null; max: number; suffix: string; emptyLabel: string }) {
  const width = typeof value === "number" ? Math.max(6, (value / max) * 100) : 0;
  const displayValue = typeof value === "number" ? String(value) + " " + suffix : emptyLabel;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="text-slate-500">{displayValue}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        {typeof value === "number" ? <div className="h-full rounded-full bg-teal-600" style={{ width: String(width) + "%" }} /> : <div className="h-full w-full rounded-full bg-slate-200" />}
      </div>
    </div>
  );
}

function StackedBar({ impact, max }: { impact: MunicipalityImpact; max: number }) {
  const total = impact.sheltersOpen + impact.healthFacilitiesMentioned + impact.roadIssues;
  if (total === 0) {
    return <div className="h-3 rounded-full bg-slate-100" title="No operational indicators extracted" />;
  }

  const scale = Math.max(total, max);
  const shelterWidth = (impact.sheltersOpen / scale) * 100;
  const healthWidth = (impact.healthFacilitiesMentioned / scale) * 100;
  const roadsWidth = (impact.roadIssues / scale) * 100;

  return (
    <div className="flex h-3 overflow-hidden rounded-full bg-slate-100" title="Shelters, health facilities, and road issues mentioned">
      <div className="bg-emerald-600" style={{ width: String(shelterWidth) + "%" }} />
      <div className="bg-sky-600" style={{ width: String(healthWidth) + "%" }} />
      <div className="bg-amber-500" style={{ width: String(roadsWidth) + "%" }} />
    </div>
  );
}

function getMunicipalityImpacts(analysis: AnalysisResult): MunicipalityImpact[] {
  const extracted = analysis.extraction.municipalityImpacts;
  if (extracted?.length) return extracted;

  return analysis.extraction.municipalities.map((municipality) => {
    const plan = analysis.actionPlan.municipalityPlans.find((item) => item.municipality === municipality);
    return {
      municipality,
      affectedSucos: null,
      affectedPopulation: "Not stated",
      sheltersOpen: analysis.extraction.shelters.filter((item) => item.municipality === municipality).length,
      healthFacilitiesMentioned: analysis.extraction.hospitals.filter((item) => item.municipality === municipality).length,
      roadIssues: analysis.extraction.roads.filter((item) => item.municipality === municipality).length,
      riskLevel: plan?.riskLevel ?? analysis.situationBrief.severity
    };
  });
}

function BriefTab({ analysis }: { analysis: AnalysisResult }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
      <Card className="border-slate-200 shadow-none">
        <CardHeader><CardTitle className="flex items-center gap-2">Top Actions <InfoTooltip text="The highest-priority recommended response actions for the first operational period." /></CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {analysis.situationBrief.recommendedActions.map((action, index) => (
            <div key={action} className="flex gap-3 rounded-md border border-slate-200 bg-white p-3 text-sm">
              <Badge variant="secondary">{index + 1}</Badge>
              <p className="font-medium leading-5 text-slate-800">{action}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-none">
        <CardHeader><CardTitle className="flex items-center gap-2">Top Risks <InfoTooltip text="The most important threats or constraints extracted from the reports." /></CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {analysis.situationBrief.topRisks.map((risk) => (
            <div key={risk} className="rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm font-medium text-red-800">{risk}</div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function PlanTab({ analysis }: { analysis: AnalysisResult }) {
  return (
    <div className="space-y-4">
      <Card className="border-slate-200 shadow-none">
        <CardHeader><CardTitle className="flex items-center gap-2">Combined Action Plan <InfoTooltip text="One response plan combining all detected municipalities, agencies, resources, timelines, and citations." /></CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-6 text-slate-700">{analysis.actionPlan.overallSummary}</p>
          <div className="grid gap-2 md:grid-cols-4">
            <PlanFieldGuide icon={<Building2 size={16} />} label="Agency" text="Who should lead or coordinate the action." />
            <PlanFieldGuide icon={<Clock3 size={16} />} label="Timeline" text="When the action should happen, focused on the first 0-24 hours." />
            <PlanFieldGuide icon={<PackageCheck size={16} />} label="Resources" text="Teams, supplies, vehicles, equipment, or services required." />
            <PlanFieldGuide icon={<BookOpenCheck size={16} />} label="Citation" text="SOP or guideline reference supporting the recommendation." />
          </div>
        </CardContent>
      </Card>

      {[analysis.actionPlan.combinedPlan, ...analysis.actionPlan.municipalityPlans].map((plan) => (
        <Card key={plan.municipality} className="border-slate-200 shadow-none">
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center justify-between gap-2">
              <span>{plan.municipality}</span>
              <RiskPill label="Risk" level={plan.riskLevel} />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="rounded-md bg-slate-50 p-3 text-sm leading-6 text-slate-700">{plan.currentSituation}</p>
            <div className="space-y-4">
              {plan.priorityActions.map((item) => (
                <div key={item.action} className="rounded-lg border border-slate-200 bg-white p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={priorityVariant(item.priority)}>{item.priority}</Badge>
                        <span className="text-xs font-semibold uppercase text-slate-500">Priority action</span>
                      </div>
                      <h4 className="text-base font-semibold leading-6 text-slate-950">{item.action}</h4>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <PlanDetail icon={<Building2 size={17} />} label="Responsible Agency" value={item.responsibleAgency} tooltip="The organization or group expected to lead this action." />
                    <PlanDetail icon={<Clock3 size={17} />} label="Timeline" value={item.timeline} tooltip="The recommended response window for this action." />
                    <PlanDetail icon={<PackageCheck size={17} />} label="Resources Required" value={item.resourcesRequired.join(", ")} tooltip="Operational resources likely needed to complete this action." />
                    <PlanDetail icon={<BookOpenCheck size={17} />} label="Guidance Citation" value={item.citations.length ? item.citations[0].source + ", " + item.citations[0].section : "No citation provided"} tooltip="Relevant SOP or guideline section used to support this recommendation." highlight />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function PlanFieldGuide({ icon, label, text }: { icon: React.ReactNode; label: string; text: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
        <span className="text-teal-700">{icon}</span>
        <span>{label}</span>
      </div>
      <p className="mt-1 text-xs leading-5 text-slate-500">{text}</p>
    </div>
  );
}

function PlanDetail({ icon, label, value, tooltip, highlight = false }: { icon: React.ReactNode; label: string; value: string; tooltip: string; highlight?: boolean }) {
  return (
    <div className={highlight ? "rounded-md border border-teal-200 bg-teal-50 p-3" : "rounded-md border border-slate-200 bg-slate-50 p-3"}>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
        <span className={highlight ? "text-teal-700" : "text-slate-500"}>{icon}</span>
        <span>{label}</span>
        <InfoTooltip text={tooltip} />
      </div>
      <p className={highlight ? "mt-2 whitespace-normal break-words text-sm font-medium leading-5 text-teal-900" : "mt-2 whitespace-normal break-words text-sm font-medium leading-5 text-slate-800"}>{value}</p>
    </div>
  );
}

function GapsTab({ analysis }: { analysis: AnalysisResult }) {
  return (
    <div className="space-y-4">
      <Card className="border-slate-200 shadow-none">
        <CardHeader><CardTitle className="flex items-center gap-2">Resource Gap Analysis <InfoTooltip text="Decision-support estimate comparing required resources with available resources and highlighting deficits." /></CardTitle></CardHeader>
        <CardContent><p className="text-sm leading-6 text-slate-700">{analysis.resourceGapAnalysis.overview}</p></CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {analysis.resourceGapAnalysis.gaps.map((gap) => (
          <Card key={gap.label} className="border-slate-200 shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <span>{gap.label}</span>
                <Badge variant={gapVariant(gap.status)}>{gap.status}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-3 gap-2">
                <SummaryStat label="Required" value={gap.required} tooltip="Estimated resources needed for this response category." />
                <SummaryStat label="Available" value={gap.available} tooltip="Resources reported or inferred as currently available." />
                <SummaryStat label="Deficit" value={gap.deficit} tooltip="Shortfall between required and available resources." />
              </div>
              <Alert>{gap.recommendation}</Alert>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Contradictions({ analysis }: { analysis: AnalysisResult }) {
  return (
    <Card className="border-slate-200 shadow-none">
      <CardHeader><CardTitle className="flex items-center gap-2">Potential Discrepancies <InfoTooltip text="Conflicting facts across reports. Civil Protection Authority Copilot shows both sources instead of choosing silently." /></CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {analysis.extraction.contradictions.map((item) => (
          <div key={item.field} className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <div className="mb-2 flex items-center justify-between gap-2"><strong>{item.field}</strong><Badge variant="yellow">{item.severity}</Badge></div>
            <div className="grid gap-2 md:grid-cols-2">
              <PlainItem title={item.reportA} body={item.valueA} />
              <PlainItem title={item.reportB} body={item.valueB} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function SummaryStat({ label, value, tooltip }: { label: string; value: string; tooltip?: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-3 shadow-none">
      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
        <span>{label}</span>
        {tooltip && <InfoTooltip text={tooltip} />}
      </div>
      <p className="mt-1 whitespace-normal break-words text-sm font-semibold leading-5 text-slate-950" title={value}>{value}</p>
    </div>
  );
}

function InfoTooltip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex align-middle">
      <button type="button" aria-label={text} className="inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Info size={14} />
      </button>
      <span className="pointer-events-none absolute left-1/2 top-6 z-30 hidden w-64 -translate-x-1/2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-normal leading-5 text-slate-700 shadow-lg group-focus-within:block group-hover:block">
        {text}
      </span>
    </span>
  );
}

function PlainItem({ title, body, badge }: { title: string; body: string; badge?: RiskLevel }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-3 text-sm">
      <div className="flex items-center justify-between gap-2">
        <strong className="text-slate-900">{title}</strong>
        {badge && <Badge variant={riskVariant(badge)}>{badge}</Badge>}
      </div>
      <p className="mt-1 text-slate-600">{body}</p>
    </div>
  );
}

function RiskPill({ label, level }: { label: string; level: RiskLevel }) {
  return <Badge variant={riskVariant(level)}>{label}: {level}</Badge>;
}

function riskVariant(level: RiskLevel) {
  if (level === "High") return "red" as const;
  if (level === "Medium") return "yellow" as const;
  return "green" as const;
}

function priorityVariant(priority: Priority) {
  if (priority === "Critical") return "red" as const;
  if (priority === "High") return "yellow" as const;
  return "secondary" as const;
}

function gapVariant(status: GapStatus) {
  if (status === "Red") return "red" as const;
  if (status === "Yellow") return "yellow" as const;
  return "green" as const;
}

function labelize(value: string) {
  return value.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
}
