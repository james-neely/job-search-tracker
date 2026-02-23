"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import type { ApplicationQuestion } from "@/types";

interface QuestionsEditorProps {
  applicationId: number;
  questions: ApplicationQuestion[];
  onUpdate: () => void;
}

export default function QuestionsEditor({
  applicationId, questions, onUpdate,
}: QuestionsEditorProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editQuestion, setEditQuestion] = useState("");
  const [editAnswer, setEditAnswer] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleAdd = async () => {
    if (!question.trim()) return;
    setSaving(true);
    await fetch(`/api/applications/${applicationId}/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: question.trim(), answer: answer.trim() }),
    });
    setQuestion("");
    setAnswer("");
    setSaving(false);
    onUpdate();
  };

  const handleDelete = async (questionId: number) => {
    await fetch(
      `/api/applications/${applicationId}/questions?questionId=${questionId}`,
      { method: "DELETE" },
    );
    onUpdate();
  };

  const handleCopy = async (item: ApplicationQuestion) => {
    await navigator.clipboard.writeText(item.answer);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const startEdit = (item: ApplicationQuestion) => {
    setEditingId(item.id);
    setEditQuestion(item.question);
    setEditAnswer(item.answer);
  };

  const handleSaveEdit = async () => {
    if (!editQuestion.trim() || editingId === null) return;
    await fetch(
      `/api/applications/${applicationId}/questions?questionId=${editingId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: editQuestion.trim(), answer: editAnswer.trim() }),
      },
    );
    setEditingId(null);
    onUpdate();
  };

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>Application Questions</Typography>
      <List dense disablePadding>
        {questions.map((item) => (
          <ListItem
            key={item.id}
            sx={{ flexDirection: "column", alignItems: "stretch" }}
            secondaryAction={
              editingId !== item.id ? (
                <Box>
                  <IconButton size="small" onClick={() => handleCopy(item)} disabled={!item.answer}>
                    {copiedId === item.id ? <CheckIcon fontSize="small" color="success" /> : <ContentCopyIcon fontSize="small" />}
                  </IconButton>
                  <IconButton size="small" onClick={() => startEdit(item)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton edge="end" size="small" onClick={() => handleDelete(item.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ) : undefined
            }
          >
            {editingId === item.id ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1, width: "100%" }}>
                <TextField
                  size="small" label="Question" value={editQuestion}
                  onChange={(e) => setEditQuestion(e.target.value)} fullWidth
                />
                <TextField
                  size="small" label="Answer" value={editAnswer}
                  onChange={(e) => setEditAnswer(e.target.value)}
                  multiline minRows={2} fullWidth
                />
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button size="small" variant="contained" onClick={handleSaveEdit}>Save</Button>
                  <Button size="small" onClick={() => setEditingId(null)}>Cancel</Button>
                </Box>
              </Box>
            ) : (
              <ListItemText
                primary={item.question}
                secondary={item.answer || "(no answer yet)"}
                secondaryTypographyProps={{ whiteSpace: "pre-wrap" }}
              />
            )}
          </ListItem>
        ))}
      </List>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 2 }}>
        <TextField
          size="small" label="Question" value={question}
          onChange={(e) => setQuestion(e.target.value)} fullWidth
        />
        <TextField
          size="small" label="Answer (optional)" value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          multiline minRows={2} fullWidth
        />
        <Button
          variant="contained" size="small" startIcon={<AddIcon />}
          disabled={!question.trim() || saving} onClick={handleAdd}
          sx={{ alignSelf: "flex-start" }}
        >
          {saving ? "Adding..." : "Add Question"}
        </Button>
      </Box>
    </Box>
  );
}
