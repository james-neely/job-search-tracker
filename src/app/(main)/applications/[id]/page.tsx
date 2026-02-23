"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import LoadingState from "@/components/common/LoadingState";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import ApplicationForm from "@/components/applications/ApplicationForm";
import StatusTimeline from "@/components/applications/StatusTimeline";
import CompanyLinksEditor from "@/components/applications/CompanyLinksEditor";
import DocumentsEditor from "@/components/applications/DocumentsEditor";
import QuestionsEditor from "@/components/applications/QuestionsEditor";
import InterviewPrepPanel from "@/components/ai/InterviewPrepPanel";
import CompanyResearchPanel from "@/components/ai/CompanyResearchPanel";
import ResumeTailorPanel from "@/components/ai/ResumeTailorPanel";
import ApplicationChat from "@/components/ai/ApplicationChat";
import type { Application, ApplicationQuestion, CompanyLink, Document, StatusHistoryEntry } from "@/types";

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [tab, setTab] = useState(0);
  const [application, setApplication] = useState<Application | null>(null);
  const [links, setLinks] = useState<CompanyLink[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [questions, setQuestions] = useState<ApplicationQuestion[]>([]);
  const [history, setHistory] = useState<StatusHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const fetchAll = useCallback(async () => {
    const [appRes, linksRes, docsRes, questionsRes, histRes] = await Promise.all([
      fetch(`/api/applications/${id}`),
      fetch(`/api/applications/${id}/links`),
      fetch(`/api/applications/${id}/documents`),
      fetch(`/api/applications/${id}/questions`),
      fetch(`/api/applications/${id}/status-history`),
    ]);
    setApplication(await appRes.json());
    setLinks(await linksRes.json());
    setDocuments(await docsRes.json());
    setQuestions(await questionsRes.json());
    setHistory(await histRes.json());
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleDelete = async () => {
    await fetch(`/api/applications/${id}`, { method: "DELETE" });
    router.push("/applications");
  };

  if (loading) return <LoadingState message="Loading application..." />;
  if (!application) return <Typography>Application not found.</Typography>;

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1, mb: 2, flexWrap: "wrap" }}>
        <Typography variant="h4" fontWeight="bold" sx={{ fontSize: { xs: "1.5rem", md: "2.125rem" } }}>
          {application.companyName} - {application.jobTitle}
        </Typography>
        <Button color="error" variant="outlined" onClick={() => setDeleteOpen(true)}>
          Delete
        </Button>
      </Box>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 3 }}>
        <Tab label="Details" />
        <Tab label="Links" />
        <Tab label="Documents" />
        <Tab label="Timeline" />
        <Tab label="Questions" />
        <Tab label="AI Tools" />
      </Tabs>
      {tab === 0 && <ApplicationForm application={application} />}
      {tab === 1 && <CompanyLinksEditor applicationId={application.id} links={links} onUpdate={fetchAll} />}
      {tab === 2 && <DocumentsEditor applicationId={application.id} documents={documents} onUpdate={fetchAll} />}
      {tab === 3 && <StatusTimeline history={history} />}
      {tab === 4 && <QuestionsEditor applicationId={application.id} questions={questions} onUpdate={fetchAll} />}
      {tab === 5 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <InterviewPrepPanel companyName={application.companyName} jobTitle={application.jobTitle} jobDescription={application.jobDescription ?? undefined} />
          <CompanyResearchPanel companyName={application.companyName} jobTitle={application.jobTitle} />
          <ResumeTailorPanel companyName={application.companyName} jobTitle={application.jobTitle} jobDescription={application.jobDescription ?? undefined} />
        </Box>
      )}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Application Assistant
        </Typography>
        <ApplicationChat application={application} />
      </Paper>
      <ConfirmDialog open={deleteOpen} title="Delete Application" message="Are you sure? This will permanently delete this application and all related data." onConfirm={handleDelete} onCancel={() => setDeleteOpen(false)} />
    </Box>
  );
}
