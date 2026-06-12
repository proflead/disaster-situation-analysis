export const disasterAnalysisJsonSchema = {
  name: "cpa_disaster_analysis",
  schema: {
    type: "object",
    additionalProperties: false,
    required: [
      "extraction",
      "executiveSummary",
      "situationBrief",
      "actionPlan",
      "resourceGapAnalysis",
      "mapFeatures",
      "ragCitations"
    ],
    properties: {
      extraction: {
        type: "object",
        additionalProperties: false,
        required: [
          "disasterType",
          "municipalities",
          "eventDate",
          "affectedPopulation",
          "vulnerableGroups",
          "infrastructureDamage",
          "shelters",
          "roads",
          "waterSupplyStatus",
          "hospitals",
          "schools",
          "criticalInfrastructureImpacts",
          "municipalityImpacts",
          "confidenceScore",
          "assumptions",
          "contradictions",
          "missingInformation"
        ],
        properties: {
          disasterType: { type: "string" },
          municipalities: { type: "array", items: { type: "string" } },
          eventDate: { type: "string" },
          affectedPopulation: { type: "string" },
          vulnerableGroups: { type: "array", items: { type: "string" } },
          infrastructureDamage: { type: "array", items: { $ref: "#/$defs/infrastructureImpact" } },
          shelters: { type: "array", items: { $ref: "#/$defs/shelter" } },
          roads: { type: "array", items: { $ref: "#/$defs/road" } },
          waterSupplyStatus: { type: "string" },
          hospitals: { type: "array", items: { $ref: "#/$defs/hospital" } },
          schools: { type: "array", items: { $ref: "#/$defs/school" } },
          criticalInfrastructureImpacts: { type: "array", items: { $ref: "#/$defs/infrastructureImpact" } },
          municipalityImpacts: { type: "array", items: { $ref: "#/$defs/municipalityImpact" } },
          confidenceScore: { type: "number", minimum: 0, maximum: 1 },
          assumptions: { type: "array", items: { type: "string" } },
          contradictions: { type: "array", items: { $ref: "#/$defs/contradiction" } },
          missingInformation: { type: "array", items: { $ref: "#/$defs/missingInformation" } }
        }
      },
      executiveSummary: {
        type: "object",
        additionalProperties: false,
        required: [
          "executiveSummary",
          "situationOverview",
          "municipalitiesAffected",
          "impactAssessment",
          "riskAssessment",
          "informationGaps",
          "contradictions",
          "assumptions",
          "confidenceScore",
          "citations",
          "summaryCharts"
        ],
        properties: {
          executiveSummary: { type: "string" },
          situationOverview: { type: "string" },
          municipalitiesAffected: { type: "string" },
          impactAssessment: { type: "string" },
          riskAssessment: {
            type: "object",
            additionalProperties: false,
            required: ["lifeSafety", "infrastructure", "logistics", "publicHealth"],
            properties: {
              lifeSafety: { $ref: "#/$defs/riskLevel" },
              infrastructure: { $ref: "#/$defs/riskLevel" },
              logistics: { $ref: "#/$defs/riskLevel" },
              publicHealth: { $ref: "#/$defs/riskLevel" }
            }
          },
          informationGaps: { type: "array", items: { $ref: "#/$defs/missingInformation" } },
          contradictions: { type: "array", items: { $ref: "#/$defs/contradiction" } },
          assumptions: { type: "array", items: { type: "string" } },
          confidenceScore: { type: "number", minimum: 0, maximum: 1 },
          citations: { type: "array", items: { $ref: "#/$defs/citation" } },
          summaryCharts: { type: "array", items: { $ref: "#/$defs/summaryChart" } }
        }
      },
      situationBrief: {
        type: "object",
        additionalProperties: false,
        required: ["disasterType", "severity", "municipalities", "populationAffected", "topRisks", "recommendedActions"],
        properties: {
          disasterType: { type: "string" },
          severity: { $ref: "#/$defs/riskLevel" },
          municipalities: { type: "array", items: { type: "string" } },
          populationAffected: { type: "string" },
          topRisks: { type: "array", items: { type: "string" } },
          recommendedActions: { type: "array", maxItems: 5, items: { type: "string" } }
        }
      },
      actionPlan: {
        type: "object",
        additionalProperties: false,
        required: ["overallSummary", "combinedPlan", "municipalityPlans"],
        properties: {
          overallSummary: { type: "string" },
          combinedPlan: { $ref: "#/$defs/municipalityPlan" },
          municipalityPlans: { type: "array", items: { $ref: "#/$defs/municipalityPlan" } }
        }
      },
      resourceGapAnalysis: {
        type: "object",
        additionalProperties: false,
        required: ["overview", "gaps", "recommendations"],
        properties: {
          overview: { type: "string" },
          gaps: { type: "array", items: { $ref: "#/$defs/resourceGap" } },
          recommendations: { type: "array", items: { type: "string" } }
        }
      },
      mapFeatures: { type: "array", items: { $ref: "#/$defs/mapFeature" } },
      ragCitations: { type: "array", items: { $ref: "#/$defs/citation" } }
    },
    $defs: {
      riskLevel: { type: "string", enum: ["Low", "Medium", "High"] },
      priority: { type: "string", enum: ["Critical", "High", "Medium"] },
      gapStatus: { type: "string", enum: ["Green", "Yellow", "Red"] },
      citation: {
        type: "object",
        additionalProperties: false,
        required: ["source", "section", "excerpt"],
        properties: {
          source: { type: "string" },
          section: { type: "string" },
          excerpt: { type: "string" }
        }
      },
      contradiction: {
        type: "object",
        additionalProperties: false,
        required: ["field", "reportA", "valueA", "reportB", "valueB", "severity"],
        properties: {
          field: { type: "string" },
          reportA: { type: "string" },
          valueA: { type: "string" },
          reportB: { type: "string" },
          valueB: { type: "string" },
          severity: { $ref: "#/$defs/riskLevel" }
        }
      },
      missingInformation: {
        type: "object",
        additionalProperties: false,
        required: ["item", "severity", "reason"],
        properties: {
          item: { type: "string" },
          severity: { $ref: "#/$defs/riskLevel" },
          reason: { type: "string" }
        }
      },
      infrastructureImpact: {
        type: "object",
        additionalProperties: false,
        required: ["type", "location", "status", "severity", "source"],
        properties: {
          type: { type: "string" },
          location: { type: "string" },
          status: { type: "string" },
          severity: { $ref: "#/$defs/riskLevel" },
          source: { type: "string" }
        }
      },
      shelter: {
        type: "object",
        additionalProperties: false,
        required: ["name", "municipality", "capacity", "occupancy", "status"],
        properties: {
          name: { type: "string" },
          municipality: { type: "string" },
          capacity: { type: "number" },
          occupancy: { type: "number" },
          status: { type: "string" }
        }
      },
      road: {
        type: "object",
        additionalProperties: false,
        required: ["name", "municipality", "status", "impact"],
        properties: {
          name: { type: "string" },
          municipality: { type: "string" },
          status: { type: "string" },
          impact: { type: "string" }
        }
      },
      hospital: {
        type: "object",
        additionalProperties: false,
        required: ["name", "municipality", "status", "capacityNote"],
        properties: {
          name: { type: "string" },
          municipality: { type: "string" },
          status: { type: "string" },
          capacityNote: { type: "string" }
        }
      },
      school: {
        type: "object",
        additionalProperties: false,
        required: ["name", "municipality", "status"],
        properties: {
          name: { type: "string" },
          municipality: { type: "string" },
          status: { type: "string" }
        }
      },
      municipalityImpact: {
        type: "object",
        additionalProperties: false,
        required: ["municipality", "affectedSucos", "affectedPopulation", "sheltersOpen", "healthFacilitiesMentioned", "roadIssues", "riskLevel"],
        properties: {
          municipality: { type: "string" },
          affectedSucos: { type: ["number", "null"] },
          affectedPopulation: { type: "string" },
          sheltersOpen: { type: "number" },
          healthFacilitiesMentioned: { type: "number" },
          roadIssues: { type: "number" },
          riskLevel: { $ref: "#/$defs/riskLevel" }
        }
      },
      summaryChart: {
        type: "object",
        additionalProperties: false,
        required: ["title", "description", "chartType", "unit", "sourceNote", "data"],
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          chartType: { type: "string", enum: ["bar", "metric"] },
          unit: { type: "string" },
          sourceNote: { type: "string" },
          data: { type: "array", items: { $ref: "#/$defs/summaryChartDatum" } }
        }
      },
      summaryChartDatum: {
        type: "object",
        additionalProperties: false,
        required: ["label", "value", "unit", "source"],
        properties: {
          label: { type: "string" },
          value: { type: "number" },
          unit: { type: "string" },
          source: { type: "string" }
        }
      },
      actionPlanItem: {
        type: "object",
        additionalProperties: false,
        required: ["priority", "action", "responsibleAgency", "resourcesRequired", "timeline", "citations"],
        properties: {
          priority: { $ref: "#/$defs/priority" },
          action: { type: "string" },
          responsibleAgency: { type: "string" },
          resourcesRequired: { type: "array", items: { type: "string" } },
          timeline: { type: "string" },
          citations: { type: "array", items: { $ref: "#/$defs/citation" } }
        }
      },
      municipalityPlan: {
        type: "object",
        additionalProperties: false,
        required: ["municipality", "currentSituation", "riskLevel", "priorityActions", "assumptions", "confidenceScore"],
        properties: {
          municipality: { type: "string" },
          currentSituation: { type: "string" },
          riskLevel: { $ref: "#/$defs/riskLevel" },
          priorityActions: { type: "array", items: { $ref: "#/$defs/actionPlanItem" } },
          assumptions: { type: "array", items: { type: "string" } },
          confidenceScore: { type: "number", minimum: 0, maximum: 1 }
        }
      },
      resourceGap: {
        type: "object",
        additionalProperties: false,
        required: ["label", "required", "available", "deficit", "status", "recommendation"],
        properties: {
          label: { type: "string" },
          required: { type: "string" },
          available: { type: "string" },
          deficit: { type: "string" },
          status: { $ref: "#/$defs/gapStatus" },
          recommendation: { type: "string" }
        }
      },
      mapFeature: {
        type: "object",
        additionalProperties: false,
        required: ["id", "type", "name", "municipality", "lat", "lng", "severity", "note"],
        properties: {
          id: { type: "string" },
          type: { type: "string", enum: ["affected", "hospital", "shelter", "school", "road", "critical"] },
          name: { type: "string" },
          municipality: { type: "string" },
          lat: { type: "number" },
          lng: { type: "number" },
          severity: { $ref: "#/$defs/riskLevel" },
          note: { type: "string" }
        }
      }
    }
  },
  strict: true
} as const;
