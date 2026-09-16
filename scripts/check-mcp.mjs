#!/usr/bin/env node
// Release gate: proves every MCP server this package registers actually
// starts, speaks MCP and answers `tools/list` — a live check, not a trust
// in the version number in content/mcp-servers.json.
//
// Unlike every other script under scripts/, THIS ONE REACHES THE NETWORK:
// a bare `npx <pkg>@latest` fetches the package from the registry on a
// cold cache. That is the point — a dead published build must fail here,
// before `npm publish` runs — but it means this script has no place in a
// normal PR run; see .github/workflows/ci.yml and release.yml.
//
//   node scripts/check-mcp.mjs [--help]
//   node scripts/check-mcp.mjs --server playwright
//   node scripts/check-mcp.mjs --skip ShopwareDevKnowledgeBase [--skip other]

import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mcpServers } from '../lib/content.mjs';

const TIMEOUT_MS = 90_000;

function parseArgs(argv) {
  const opts = { server: null, skip: [], help: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') opts.help = true;
    else if (arg === '--server') opts.server = argv[++i];
    else if (arg === '--skip') opts.skip.push(argv[++i]);
    else {
      console.error(`unknown argument: ${arg}`);
      process.exit(1);
    }
  }
  return opts;
}

function printHelp() {
  console.log(`Checks that every registered MCP server starts and answers.

Usage:
  node scripts/check-mcp.mjs [options]

Options:
  --server <name>   Check only this server (repeatable is not supported;
                     last one wins).
  --skip <name>      Skip this server (repeatable). Use to exclude a known-
                     bad third party without deleting the gate.
  --help, -h          Print this help and exit 0.

Reaches the network: each server is spawned for real via npx.`);
}

function readLines(buffer) {
  const text = buffer.toString('utf8');
  return text.split('\n').filter((line) => line.trim().length > 0);
}

/**
 * Spawn one MCP server over stdio, run the initialize/tools-list handshake,
 * and resolve with { ok, detail } — never rejects, so the caller can keep
 * checking the rest of the servers after one fails.
 */
function checkServer(server) {
  return new Promise((resolvePromise) => {
    let settled = false;
    const finish = (ok, detail) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        child.kill();
      } catch {
        // already dead
      }
      resolvePromise({ ok, detail });
    };

    let child;
    try {
      child = spawn(server.command, server.args, { stdio: ['pipe', 'pipe', 'pipe'] });
    } catch (err) {
      finish(false, `failed to spawn: ${err.message}`);
      return;
    }

    let stdout = Buffer.alloc(0);
    let stderr = '';
    let sawInitResult = false;
    let sawToolsResult = false;
    let serverInfoName = null;

    const timer = setTimeout(() => {
      finish(
        false,
        `timed out after ${TIMEOUT_MS}ms waiting for a response (sawInit=${sawInitResult}, sawTools=${sawToolsResult}); stderr: ${stderr.slice(-500) || '(empty)'}`,
      );
    }, TIMEOUT_MS);

    child.on('error', (err) => {
      finish(false, `spawn error: ${err.message}`);
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString('utf8');
    });

    child.on('exit', (code, signal) => {
      if (settled) return;
      if (!sawToolsResult) {
        finish(
          false,
          `process exited (code=${code}, signal=${signal}) before answering tools/list; stderr: ${stderr.slice(-500) || '(empty)'}`,
        );
      }
    });

    child.stdout.on('data', (chunk) => {
      stdout = Buffer.concat([stdout, chunk]);
      for (const line of readLines(stdout)) {
        let msg;
        try {
          msg = JSON.parse(line);
        } catch {
          continue; // not every line of stdout need be a JSON-RPC frame
        }
        if (msg.id === 1 && msg.result) {
          if (!msg.result.serverInfo?.name) {
            finish(false, `initialize response carried no result.serverInfo.name: ${line}`);
            return;
          }
          sawInitResult = true;
          serverInfoName = msg.result.serverInfo.name;
          child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' })}\n`);
          child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list' })}\n`);
        } else if (msg.id === 1 && msg.error) {
          finish(false, `initialize failed: ${JSON.stringify(msg.error)}`);
        } else if (msg.id === 2 && msg.result) {
          const tools = msg.result.tools;
          if (!Array.isArray(tools) || tools.length === 0) {
            finish(false, `tools/list returned no tools: ${line}`);
            return;
          }
          sawToolsResult = true;
          finish(true, `serverInfo=${serverInfoName} tools=${tools.length}`);
        } else if (msg.id === 2 && msg.error) {
          finish(false, `tools/list failed: ${JSON.stringify(msg.error)}`);
        }
      }
    });

    child.stdin.write(
      `${JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'check-mcp', version: '1' },
        },
      })}\n`,
    );
  });
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    printHelp();
    process.exit(0);
  }

  const workRoot = mkdtempSync(join(tmpdir(), 'check-mcp-'));
  let servers;
  try {
    servers = mcpServers({ platform: process.platform, root: workRoot });
  } finally {
    rmSync(workRoot, { recursive: true, force: true });
  }

  let targets = servers;
  if (opts.server) {
    targets = servers.filter((s) => s.name === opts.server);
    if (targets.length === 0) {
      console.error(`no such server: ${opts.server} (known: ${servers.map((s) => s.name).join(', ')})`);
      process.exit(1);
    }
  }
  targets = targets.filter((s) => !opts.skip.includes(s.name));

  if (targets.length === 0) {
    console.error('no servers to check (all skipped or none matched --server)');
    process.exit(1);
  }

  const results = [];
  for (const server of targets) {
    const spec = server.args.find((a) => a.includes('@')) ?? server.args.join(' ');
    process.stdout.write(`checking ${server.name} (${spec}) ...\n`);
    const { ok, detail } = await checkServer(server);
    results.push({ name: server.name, spec, ok, detail });
    if (ok) {
      console.log(`  ok — ${server.name}: ${detail}`);
    } else {
      console.error(`  FAIL — ${server.name} (${spec}): ${detail}`);
    }
  }

  const skipped = servers.filter((s) => opts.skip.includes(s.name)).map((s) => s.name);
  if (skipped.length) {
    console.log(`skipped: ${skipped.join(', ')}`);
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`${results.length - failed.length}/${results.length} servers answered`);
  if (failed.length) {
    console.error(`failed: ${failed.map((f) => f.name).join(', ')}`);
    process.exit(1);
  }
}

main();
