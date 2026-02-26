"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import VisibilityIcon from "@mui/icons-material/Visibility";
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
            secondaryAction={<DocumentActions doc={doc} onDelete={handleDelete} />}
          >
            <ListItemText
              primary={
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  {doc.isUrl ? <LinkIcon fontSize="small" /> : <InsertDriveFileIcon fontSize="small" />}
                  {doc.label}
                </Box>
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

function DocumentActions({ doc, onDelete }: { doc: Document; onDelete: (id: number) => void }) {
  const previewUrl = doc.isUrl ? doc.filePath : `/api/files/${doc.filePath}`;
  const downloadUrl = doc.isUrl ? doc.filePath : `/api/files/${doc.filePath}?download=1`;

  return (
    <Box sx={{ display: "flex", gap: 0.5 }}>
      <Tooltip title="Preview">
        <IconButton
          edge="end" size="small"
          onClick={() => window.open(previewUrl, "_blank")}
        >
          <VisibilityIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Download">
        <IconButton
          edge="end" size="small" component="a"
          href={downloadUrl} download
        >
          <DownloadIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Delete">
        <IconButton edge="end" size="small" onClick={() => onDelete(doc.id)}>
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
}
