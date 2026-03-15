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
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
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
    setSaving(true);
    const fallbackLabel = isUrl ? "Linked Document" : "Uploaded Document";
    await fetch(`/api/applications/${applicationId}/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: label.trim() || fallbackLabel, filePath, isUrl }),
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
          <DocumentRow
            key={doc.id}
            applicationId={applicationId}
            doc={doc}
            onDelete={handleDelete}
            onUpdate={onUpdate}
          />
        ))}
      </List>

      <Box sx={{ mt: 2 }}>
        <TextField
          size="small"
          label="Document Label"
          fullWidth
          sx={{ mb: 1 }}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          disabled={saving}
          helperText={saving ? "Saving..." : "Optional. You can upload first and rename after."}
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

function DocumentRow({
  applicationId,
  doc,
  onDelete,
  onUpdate,
}: {
  applicationId: number;
  doc: Document;
  onDelete: (id: number) => void;
  onUpdate: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(doc.label);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!label.trim()) return;
    setSaving(true);
    await fetch(`/api/applications/${applicationId}/documents`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ docId: doc.id, label: label.trim() }),
    });
    setSaving(false);
    setEditing(false);
    onUpdate();
  };

  return (
    <ListItem
      secondaryAction={
        <DocumentActions
          doc={doc}
          editing={editing}
          saving={saving}
          onDelete={onDelete}
          onStartEdit={() => setEditing(true)}
          onCancelEdit={() => {
            setLabel(doc.label);
            setEditing(false);
          }}
          onSave={handleSave}
        />
      }
    >
      <ListItemText
        primary={
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, pr: 12 }}>
            {doc.isUrl ? <LinkIcon fontSize="small" /> : <InsertDriveFileIcon fontSize="small" />}
            {editing ? (
              <TextField
                size="small"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                disabled={saving}
                sx={{ minWidth: 260 }}
              />
            ) : (
              doc.label
            )}
          </Box>
        }
      />
    </ListItem>
  );
}

function DocumentActions({
  doc,
  editing,
  saving,
  onDelete,
  onStartEdit,
  onCancelEdit,
  onSave,
}: {
  doc: Document;
  editing: boolean;
  saving: boolean;
  onDelete: (id: number) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => Promise<void>;
}) {
  const previewUrl = doc.isUrl ? doc.filePath : `/api/files/${doc.filePath}`;
  const downloadUrl = doc.isUrl ? doc.filePath : `/api/files/${doc.filePath}?download=1`;

  return (
    <Box sx={{ display: "flex", gap: 0.5 }}>
      <Tooltip title={editing ? "Save title" : "Edit title"}>
        <IconButton
          edge="end"
          size="small"
          onClick={() => {
            if (editing) {
              void onSave();
            } else {
              onStartEdit();
            }
          }}
          disabled={saving}
        >
          {editing ? <CheckIcon fontSize="small" /> : <EditIcon fontSize="small" />}
        </IconButton>
      </Tooltip>
      {editing ? (
        <Tooltip title="Cancel">
          <IconButton edge="end" size="small" onClick={onCancelEdit} disabled={saving}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ) : null}
      <Tooltip title="Preview">
        <IconButton edge="end" size="small" onClick={() => window.open(previewUrl, "_blank")}>
          <VisibilityIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Download">
        <IconButton edge="end" size="small" component="a" href={downloadUrl} download>
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
