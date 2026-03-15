import { NextResponse } from "next/server";
import { getSetting } from "@/db/queries/settings";

interface CompanionServer {
  id: string;
  label: string;
  url: string;
}

interface CompanionServerConfig {
  servers: CompanionServer[];
  defaultServerId: string | null;
}

function parseConfig(value: string | null): CompanionServerConfig {
  if (!value?.trim()) {
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

    return {
      servers,
      defaultServerId: typeof parsed.defaultServerId === "string" ? parsed.defaultServerId : null,
    };
  } catch {
    return { servers: [], defaultServerId: null };
  }
}

export async function GET() {
  const config = parseConfig(await getSetting("companion_servers_json"));
  const defaultServer = config.servers.find((server) => server.id === config.defaultServerId) ?? null;

  return NextResponse.json({
    servers: config.servers,
    defaultServerId: config.defaultServerId,
    defaultServerUrl: defaultServer?.url ?? null,
  });
}
