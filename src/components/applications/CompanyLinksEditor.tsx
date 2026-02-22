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
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import type { CompanyLink } from "@/types";

interface CompanyLinksEditorProps {
  applicationId: number;
  links: CompanyLink[];
  onUpdate: () => void;
}

export default function CompanyLinksEditor({
  applicationId, links, onUpdate,
}: CompanyLinksEditorProps) {
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!label.trim() || !url.trim()) return;
    setSaving(true);
    await fetch(`/api/applications/${applicationId}/links`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: label.trim(), url: url.trim() }),
    });
    setLabel("");
    setUrl("");
    setSaving(false);
    onUpdate();
  };

  const handleDelete = async (linkId: number) => {
    await fetch(
      `/api/applications/${applicationId}/links?linkId=${linkId}`,
      { method: "DELETE" },
    );
    onUpdate();
  };

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>Company Links</Typography>
      <List dense disablePadding>
        {links.map((link) => (
          <ListItem
            key={link.id}
            secondaryAction={
              <IconButton edge="end" size="small" onClick={() => handleDelete(link.id)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            }
          >
            <ListItemText
              primary={
                <a href={link.url} target="_blank" rel="noopener noreferrer">
                  {link.label}
                </a>
              }
            />
          </ListItem>
        ))}
      </List>

      <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
        <TextField
          size="small" label="Label" value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <TextField
          size="small" label="URL" value={url}
          onChange={(e) => setUrl(e.target.value)} sx={{ flex: 1 }}
        />
        <Button
          variant="contained" size="small" startIcon={<AddIcon />}
          disabled={!label.trim() || !url.trim() || saving} onClick={handleAdd}
        >
          {saving ? "Adding..." : "Add"}
        </Button>
      </Box>
    </Box>
  );
}
