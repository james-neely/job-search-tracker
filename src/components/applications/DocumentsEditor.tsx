"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import DeleteIcon from "@mui/icons-material/Delete";
import LinkIcon from "@mui/icons-material/Link";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import FileUpload from "@/components/common/FileUpload";
import type { Document } from "@/types";

interface DocumentsEditorProps {
  applicationId: number;
  documents: Document[];
  onUpdate: () => void;
}

export default function DocumentsEditor({
  applicationId, documents, onUpdate,
}: DocumentsEditorProps) {
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);

  const saveDocument = async (filePath: string, isUrl: boolean) => {
    if (!label.trim()) return;
    setSaving(true);
    await fetch(`/api/applications/${applicationId}/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: label.trim(), filePath, isUrl }),
    });
    setLabel("");
    setSaving(false);
    onUpdate();
  };

  const handleDelete = async (docId: number) => {
    await fetch(
      `/api/applications/${applicationId}/documents?docId=${docId}`,
      { method: "DELETE" },
    );
    onUpdate();
  };

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>Documents</Typography>
      <List dense disablePadding>
        {documents.map((doc) => (
          <ListItem
            key={doc.id}
            secondaryAction={
              <IconButton edge="end" size="small" onClick={() => handleDelete(doc.id)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            }
          >
            <ListItemText
              primary={
                doc.isUrl ? (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <LinkIcon fontSize="small" />
                    <a href={doc.filePath} target="_blank" rel="noopener noreferrer">
                      {doc.label}
                    </a>
                  </Box>
                ) : (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <InsertDriveFileIcon fontSize="small" />
                    {doc.label}
                  </Box>
                )
              }
            />
          </ListItem>
        ))}
      </List>

      <Box sx={{ mt: 2 }}>
        <TextField
          size="small" label="Document Label" fullWidth sx={{ mb: 1 }}
          value={label} onChange={(e) => setLabel(e.target.value)}
          disabled={saving}
          helperText={!label.trim() ? "Enter a label before uploading" : saving ? "Saving..." : undefined}
        />
        <FileUpload
          label={saving ? "Saving..." : "Add Document"}
          onFileUploaded={(filename) => saveDocument(filename, false)}
          onUrlSet={(url) => saveDocument(url, true)}
        />
      </Box>
    </Box>
  );
}
