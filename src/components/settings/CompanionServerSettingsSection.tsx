"use client";

import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Radio from "@mui/material/Radio";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import DeleteIcon from "@mui/icons-material/Delete";

interface CompanionServer {
  id: string;
  label: string;
  url: string;
}

interface CompanionServerConfig {
  servers: CompanionServer[];
  defaultServerId: string | null;
}

interface Props {
  value: string;
  onChange: (nextValue: string) => void;
}

function parseConfig(value: string): CompanionServerConfig {
  if (!value.trim()) {
    return { servers: [], defaultServerId: null };
  }

  try {
    const parsed = JSON.parse(value) as Partial<CompanionServerConfig>;
    const servers = Array.isArray(parsed.servers)
      ? parsed.servers.filter((server) =>
          server &&
          typeof server.id === "string" &&
          typeof server.label === "string" &&
          typeof server.url === "string"
        )
      : [];

    const defaultServerId = typeof parsed.defaultServerId === "string"
      ? parsed.defaultServerId
      : null;

    return { servers, defaultServerId };
  } catch {
    return { servers: [], defaultServerId: null };
  }
}

function serializeConfig(config: CompanionServerConfig) {
  return JSON.stringify(config);
}

export default function CompanionServerSettingsSection({ value, onChange }: Props) {
  const config = useMemo(() => parseConfig(value), [value]);
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");

  const handleConfigChange = (nextConfig: CompanionServerConfig) => {
    onChange(serializeConfig(nextConfig));
  };

  const handleAddServer = () => {
    if (!label.trim() || !url.trim()) return;

    const id = typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}`;

    const nextServers = [
      ...config.servers,
      { id, label: label.trim(), url: url.trim().replace(/\/$/, "") },
    ];

    handleConfigChange({
      servers: nextServers,
      defaultServerId: config.defaultServerId ?? id,
    });
    setLabel("");
    setUrl("");
  };

  const handleDeleteServer = (serverId: string) => {
    const nextServers = config.servers.filter((server) => server.id !== serverId);
    handleConfigChange({
      servers: nextServers,
      defaultServerId:
        config.defaultServerId === serverId ? (nextServers[0]?.id ?? null) : config.defaultServerId,
    });
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Extension Companion Servers
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Manage which Job Search Tracker servers the Chrome companion can send captures to.
      </Typography>

      <Stack spacing={1.5} sx={{ mb: 3 }}>
        {config.servers.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No companion servers saved yet.
          </Typography>
        ) : (
          config.servers.map((server) => (
            <Box
              key={server.id}
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                p: 1.5,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2">{server.label}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ wordBreak: "break-word" }}>
                  {server.url}
                </Typography>
              </Box>
              <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                <Radio
                  checked={config.defaultServerId === server.id}
                  onChange={() =>
                    handleConfigChange({ ...config, defaultServerId: server.id })
                  }
                />
                <IconButton color="error" onClick={() => handleDeleteServer(server.id)}>
                  <DeleteIcon />
                </IconButton>
              </Stack>
            </Box>
          ))
        )}
      </Stack>

      <Stack spacing={2}>
        <TextField
          label="Server Label"
          placeholder="Local Dev, Production"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          fullWidth
        />
        <TextField
          label="Server URL"
          placeholder="http://localhost:3001"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          fullWidth
        />
        <Stack direction="row" spacing={1}>
          <Button variant="contained" onClick={handleAddServer}>
            Add Server
          </Button>
          <Button
            variant="outlined"
            onClick={() => setUrl(typeof window === "undefined" ? "" : window.location.origin)}
          >
            Use Current Origin
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
