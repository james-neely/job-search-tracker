"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type {
  Application,
  ApplicationResumeAtsAnalysisHistory,
  ResumeVersion,
} from "@/types";
import type { ResumeAtsAnalysis } from "@/lib/resume-json";
import { formatRelativeTime } from "@/lib/utils";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

interface ResumeTailorPanelProps {
  application: Application;
  onUpdate?: () => void;
}

interface TailoredResumeResult {
  resumeVersion: ResumeVersion;
  documents: Array<{
    format: string;
    label: string;
    applicationDocument: {
      id: number;
      label: string;
      filePath: string;
      isUrl: boolean;
      createdAt: string | null;
    } | null;
  }>;
}

export default function ResumeTailorPanel({
  application,
  onUpdate,
}: ResumeTailorPanelProps) {
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(true);
  const [tailoring, setTailoring] = useState(false);
  const [tailorError, setTailorError] = useState<string | null>(null);
  const [tailoredResult, setTailoredResult] = useState<TailoredResumeResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ResumeAtsAnalysis | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<ApplicationResumeAtsAnalysisHistory[]>([]);

  useEffect(() => {
    let active = true;

    async function loadVersions() {
      setLoadingVersions(true);
      try {
        const response = await fetch("/api/resume/versions");
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error ?? "Failed to load resumes");
        }
        if (active) {
          setVersions(data);
        }
      } catch (error) {
        if (active) {
          setTailorError(error instanceof Error ? error.message : "Failed to load resumes");
        }
      } finally {
        if (active) {
          setLoadingVersions(false);
        }
      }
    }

    void loadVersions();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadAnalysisHistory() {
      try {
        const response = await fetch(`/api/applications/${application.id}/resume-ats-analysis`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error ?? "Failed to load ATS history");
        }
        if (active) {
          setAnalysisHistory(data.history ?? []);
        }
      } catch {
        if (active) {
          setAnalysisHistory([]);
        }
      }
    }

    void loadAnalysisHistory();
    return () => {
      active = false;
    };
  }, [application.id]);

  const mainResume = useMemo(
    () => versions.find((version) => version.isMain) ?? null,
    [versions]
  );
  const effectiveAttachedResumeId =
    tailoredResult?.attachedResumeVersionId ?? application.attachedResumeVersionId ?? null;
  const attachedResume = useMemo(
    () => versions.find((version) => version.id === effectiveAttachedResumeId) ?? tailoredResult?.resumeVersion ?? null,
    [versions, effectiveAttachedResumeId, tailoredResult]
  );

  const handleGenerateTailoredResume = async () => {
    setTailoring(true);
    setTailorError(null);
    setTailoredResult(null);

    try {
      const response = await fetch(`/api/applications/${application.id}/tailored-resume`, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to generate tailored resume");
      }
      setTailoredResult(data);
      setVersions((current) =>
        current.some((version) => version.id === data.resumeVersion.id)
          ? current.map((version) => version.id === data.resumeVersion.id ? data.resumeVersion : version)
          : [data.resumeVersion, ...current]
      );
      onUpdate?.();
    } catch (error) {
      setTailorError(
        error instanceof Error ? error.message : "Failed to generate tailored resume"
      );
    } finally {
      setTailoring(false);
    }
  };

  const handleAnalyzeResume = async () => {
    setAnalyzing(true);
    setAnalysisError(null);
    setAnalysis(null);

    try {
      const response = await fetch(
        `/api/applications/${application.id}/resume-ats-analysis`,
        { method: "POST" }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to analyze resume");
      }
      setAnalysis(data.analysis);
      if (data.historyItem) {
        setAnalysisHistory((current) => [data.historyItem, ...current]);
      }
    } catch (error) {
      setAnalysisError(
        error instanceof Error ? error.message : "Failed to analyze resume"
      );
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Resume AI Tools
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Use the designated main resume as the base for tailored generation and ATS analysis.
      </Typography>

      {loadingVersions ? (
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, py: 2 }}>
          <CircularProgress size={20} />
          <Typography variant="body2">Loading resume library...</Typography>
        </Box>
      ) : (
        <Stack spacing={1} sx={{ mb: 2 }}>
          {mainResume ? (
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              <Chip size="small" color="primary" label="Main Resume" />
              <Chip size="small" variant="outlined" label={mainResume.title} />
            </Stack>
          ) : (
            <Alert severity="warning">
              No main resume is selected. Set one in the resume library before using these tools.
            </Alert>
          )}
          {attachedResume ? (
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              <Chip size="small" color="secondary" label="Attached Resume" />
              <Chip size="small" variant="outlined" label={attachedResume.title} />
              <Button component={Link} href={`/resume/${attachedResume.id}`} size="small">
                Open Attached Resume
              </Button>
            </Stack>
          ) : null}
        </Stack>
      )}

      {!application.jobDescription?.trim() && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Add a job description on this application before generating a tailored resume or ATS analysis.
        </Alert>
      )}

      {tailorError && <Alert severity="error" sx={{ mb: 2 }}>{tailorError}</Alert>}
      {analysisError && <Alert severity="error" sx={{ mb: 2 }}>{analysisError}</Alert>}

      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 3 }}>
        <Button
          variant="contained"
          disabled={tailoring || !mainResume || !application.jobDescription?.trim()}
          onClick={() => void handleGenerateTailoredResume()}
        >
          {tailoring ? "Generating Tailored Resume..." : "Generate Tailored Resume"}
        </Button>
        <Button
          variant="outlined"
          disabled={analyzing || !mainResume || !application.jobDescription?.trim()}
          onClick={() => void handleAnalyzeResume()}
        >
          {analyzing ? "Analyzing ATS Fit..." : "Analyze Main Resume for ATS"}
        </Button>
        <Button component={Link} href="/resume" variant="text">
          Open Resume Library
        </Button>
      </Box>

      {tailoredResult && (
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
            Tailored Resume Ready
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Created a tailored resume version for {application.companyName} - {application.jobTitle}.
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
            <Button
              component={Link}
              href={`/resume/${tailoredResult.resumeVersion.id}`}
              variant="outlined"
              size="small"
            >
              Open Tailored Resume
            </Button>
            {tailoredResult.documents.map((document) => (
              <Button
                key={document.format}
                size="small"
                variant="outlined"
                href={document.applicationDocument ? `/api/files/${document.applicationDocument.filePath}?download=1` : undefined}
                target="_blank"
                rel="noopener noreferrer"
              >
                Download {document.label}
              </Button>
            ))}
          </Box>
          <Typography variant="caption" color="text.secondary">
            The generated files were also attached to this application under Documents.
          </Typography>
        </Paper>
      )}

      {analysis && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
            ATS Analysis
          </Typography>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 2 }}>
            <Chip color="primary" label={`ATS Score ${analysis.overallScore}/100`} />
            <Chip
              variant="outlined"
              label={`Keywords ${analysis.matchedKeywordCount}/${analysis.totalKeywordCount}`}
            />
          </Stack>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {analysis.summary}
          </Typography>

          <Box sx={{ display: "grid", gap: 2 }}>
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Matched Keywords
              </Typography>
              <Typography variant="body2">
                {analysis.matchedKeywords.length > 0
                  ? analysis.matchedKeywords.join(", ")
                  : "No matched keywords returned."}
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Missing Keywords
              </Typography>
              <Typography variant="body2">
                {analysis.missingKeywords.length > 0
                  ? analysis.missingKeywords.join(", ")
                  : "No missing keywords returned."}
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Section Feedback
              </Typography>
              <Stack spacing={1}>
                <Typography variant="body2"><strong>Summary:</strong> {analysis.sectionFeedback.summary}</Typography>
                <Typography variant="body2"><strong>Skills:</strong> {analysis.sectionFeedback.skills}</Typography>
                <Typography variant="body2"><strong>Work Experience:</strong> {analysis.sectionFeedback.workExperience}</Typography>
                <Typography variant="body2"><strong>Projects:</strong> {analysis.sectionFeedback.projects}</Typography>
                <Typography variant="body2"><strong>Education:</strong> {analysis.sectionFeedback.education}</Typography>
              </Stack>
            </Box>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Formatting Risks
              </Typography>
              <Typography variant="body2">
                {analysis.formattingRisks.length > 0
                  ? analysis.formattingRisks.join(", ")
                  : "No major formatting risks identified."}
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Top Recommendations
              </Typography>
              <Typography variant="body2">
                {analysis.topRecommendations.length > 0
                  ? analysis.topRecommendations.join(", ")
                  : "No additional recommendations returned."}
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}

      <Paper variant="outlined" sx={{ p: 2, mt: 3 }}>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
          ATS History
        </Typography>
        {analysisHistory.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No ATS analysis runs yet.
          </Typography>
        ) : (
          <Stack spacing={1.5}>
            {analysisHistory.map((item, index) => {
              const previous = analysisHistory[index + 1];
              const delta = previous ? item.overallScore - previous.overallScore : null;
              return (
                <Paper key={item.id} variant="outlined" sx={{ p: 1.5 }}>
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 0.5 }}>
                    <Chip size="small" color="primary" label={`Score ${item.overallScore}/100`} />
                    <Chip size="small" variant="outlined" label={`${item.matchedKeywordCount}/${item.totalKeywordCount} keywords`} />
                    {delta !== null ? (
                      <Chip
                        size="small"
                        color={delta > 0 ? "success" : delta < 0 ? "warning" : "default"}
                        label={delta > 0 ? `+${delta}` : `${delta}`}
                      />
                    ) : null}
                  </Stack>
                  <Typography variant="body2">
                    {item.resumeVersionTitle}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Ran {formatRelativeTime(item.createdAt)}
                  </Typography>
                </Paper>
              );
            })}
          </Stack>
        )}
      </Paper>
    </Paper>
  );
}
