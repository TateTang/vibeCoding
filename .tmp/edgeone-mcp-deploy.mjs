import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

const cwd = process.cwd();
const mcpConfigPath = path.join(cwd, ".vscode", "mcp.json");
const deployTarget = path.join(cwd, "dashboard", "dist");

const config = JSON.parse(await fs.readFile(mcpConfigPath, "utf8"));
const edge = config?.servers?.["edgeone-pages-mcp-server"];

if (!edge?.command || !Array.isArray(edge.args)) {
  throw new Error("Missing edgeone-pages-mcp-server config");
}

if (!edge.env?.EDGEONE_PAGES_API_TOKEN) {
  throw new Error("Missing EDGEONE_PAGES_API_TOKEN");
}

class MCPClient {
  constructor(command, args, env) {
    this.proc = spawn(command, args, {
      env: {
        ...process.env,
        ...env,
      },
      stdio: ["pipe", "pipe", "pipe"],
    });
    this.buffer = Buffer.alloc(0);
    this.nextId = 1;
    this.pending = new Map();
    this.stderr = "";
    this.proc.stdout.on("data", (chunk) => this.onData(chunk));
    this.proc.stderr.on("data", (chunk) => {
      this.stderr += chunk.toString();
    });
    this.proc.on("exit", (code, signal) => {
      const message = `server exited code=${code ?? ""} signal=${signal ?? ""} stderr=${this.stderr}`;
      for (const [, pending] of this.pending) {
        pending.reject(new Error(message));
      }
      this.pending.clear();
    });
  }

  onData(chunk) {
    this.buffer = Buffer.concat([this.buffer, chunk]);

    while (true) {
      const headerEnd = this.buffer.indexOf("\r\n\r\n");
      if (headerEnd === -1) {
        return;
      }

      const header = this.buffer.slice(0, headerEnd).toString();
      const match = header.match(/Content-Length: (\d+)/i);
      if (!match) {
        throw new Error(`Missing Content-Length header: ${header}`);
      }

      const length = Number(match[1]);
      const bodyStart = headerEnd + 4;
      if (this.buffer.length < bodyStart + length) {
        return;
      }

      const body = this.buffer.slice(bodyStart, bodyStart + length).toString();
      this.buffer = this.buffer.slice(bodyStart + length);
      const message = JSON.parse(body);

      if (message.id !== undefined && this.pending.has(message.id)) {
        const pending = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) {
          pending.reject(new Error(JSON.stringify(message.error)));
        } else {
          pending.resolve(message.result);
        }
      }
    }
  }

  request(method, params) {
    const id = this.nextId++;
    const message = JSON.stringify({
      jsonrpc: "2.0",
      id,
      method,
      params,
    });
    const payload = `Content-Length: ${Buffer.byteLength(message)}\r\n\r\n${message}`;

    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.proc.stdin.write(payload);
    });
  }

  notify(method, params) {
    const message = JSON.stringify({
      jsonrpc: "2.0",
      method,
      params,
    });
    const payload = `Content-Length: ${Buffer.byteLength(message)}\r\n\r\n${message}`;
    this.proc.stdin.write(payload);
  }

  async shutdown() {
    try {
      this.proc.stdin.end();
    } catch {}

    await new Promise((resolve) => {
      this.proc.once("exit", resolve);
    });
  }
}

const client = new MCPClient(edge.command, edge.args, edge.env);

try {
  await client.request("initialize", {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: {
      name: "codex-local-deployer",
      version: "1.0.0",
    },
  });
  client.notify("notifications/initialized", {});

  const tools = await client.request("tools/list", {});
  const toolNames = tools?.tools?.map((tool) => tool.name) ?? [];
  const toolName = toolNames.includes("deploy_folder_or_zip")
    ? "deploy_folder_or_zip"
    : toolNames.includes("deploy_folder")
      ? "deploy_folder"
      : null;

  if (!toolName) {
    throw new Error(`No deploy tool found. Available tools: ${toolNames.join(", ")}`);
  }

  const args =
    toolName === "deploy_folder_or_zip"
      ? { builtFolderPath: deployTarget }
      : { folderPath: deployTarget };

  const result = await client.request("tools/call", {
    name: toolName,
    arguments: args,
  });

  console.log(JSON.stringify(result, null, 2));
} finally {
  await client.shutdown();
}
