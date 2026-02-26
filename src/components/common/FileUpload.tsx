"use client";
import { useState, useCallback } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import LinkIcon from "@mui/icons-material/Link";

interface FileUploadProps {
  onFileUploaded: (filename: string) => void;
  onUrlSet: (url: string) => void;
  label?: string;
}

export default function FileUpload({
  onFileUploaded, onUrlSet, label = "Upload File or Link URL",
}: FileUploadProps) {
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const [url, setUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const uploadFile = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      onFileUploaded((await res.json()).filename);
    } finally {
      setUploading(false);
    }
  }, [onFileUploaded]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }, [uploadFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>{label}</Typography>
      <ToggleButtonGroup
        value={mode} exclusive size="small" sx={{ mb: 2 }}
        onChange={(_, v) => v && setMode(v)}
      >
        <ToggleButton value="upload">
          <UploadFileIcon sx={{ mr: 0.5 }} /> Upload File
        </ToggleButton>
        <ToggleButton value="url">
          <LinkIcon sx={{ mr: 0.5 }} /> Link URL
        </ToggleButton>
      </ToggleButtonGroup>

      {mode === "upload" ? (
        <Box
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          sx={{
            border: "2px dashed",
            borderColor: dragOver ? "primary.main" : "divider",
            borderRadius: 1,
            p: 3,
            textAlign: "center",
            bgcolor: dragOver ? "action.hover" : "transparent",
            transition: "all 0.2s ease",
            cursor: uploading ? "wait" : "pointer",
          }}
        >
          <UploadFileIcon sx={{ fontSize: 36, color: "text.secondary", mb: 1 }} />
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {uploading ? "Uploading..." : "Drag & drop a file here, or"}
          </Typography>
          <Button variant="outlined" component="label" disabled={uploading} size="small">
            Browse Files
            <input type="file" hidden onChange={handleFileChange} />
          </Button>
        </Box>
      ) : (
        <Box sx={{ display: "flex", gap: 1 }}>
          <TextField
            size="small" fullWidth placeholder="https://example.com/file"
            value={url} onChange={(e) => setUrl(e.target.value)}
          />
          <Button
            variant="contained" disabled={!url.trim()}
            onClick={() => url.trim() && onUrlSet(url.trim())}
          >
            Set
          </Button>
        </Box>
      )}
    </Box>
  );
}
