import type { Request, Response } from "express";
import { sdk } from "./_core/sdk";

// ─── SSE Client Registry ──────────────────────────────────────────────────────
// Maps userId → set of SSE response objects (user can have multiple tabs)
const userClients = new Map<number, Set<Response>>();
// Maps sectorId → set of SSE response objects
const sectorClients = new Map<number, Set<Response>>();

function addUserClient(userId: number, res: Response) {
  if (!userClients.has(userId)) userClients.set(userId, new Set());
  userClients.get(userId)!.add(res);
}

function removeUserClient(userId: number, res: Response) {
  userClients.get(userId)?.delete(res);
  if (userClients.get(userId)?.size === 0) userClients.delete(userId);
}

function addSectorClient(sectorId: number, res: Response) {
  if (!sectorClients.has(sectorId)) sectorClients.set(sectorId, new Set());
  sectorClients.get(sectorId)!.add(res);
}

function removeSectorClient(sectorId: number, res: Response) {
  sectorClients.get(sectorId)?.delete(res);
  if (sectorClients.get(sectorId)?.size === 0) sectorClients.delete(sectorId);
}

function sendSSE(res: Response, event: string, data: unknown) {
  try {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  } catch (_e) {
    // Client disconnected
  }
}

// ─── Broadcast to a specific user ─────────────────────────────────────────────
export function broadcastToUser(userId: number, payload: unknown) {
  const clients = userClients.get(userId);
  if (!clients) return;
  for (const res of Array.from(clients)) {
    sendSSE(res, "notification", payload);
  }
}

// ─── Broadcast to all users with a specific role ──────────────────────────────
// (Used when we don't know userId upfront — server calls this after DB insert)
export function broadcastToRole(role: string, payload: unknown) {
  // Broadcast to all connected users; client filters by role
  for (const [, clients] of Array.from(userClients)) {
    for (const res of Array.from(clients)) {
      sendSSE(res, "notification_role", { role, ...( payload as object) });
    }
  }
}

// ─── Broadcast to a sector ────────────────────────────────────────────────────
export function broadcastToSector(sectorId: number, payload: unknown) {
  const clients = sectorClients.get(sectorId);
  if (!clients) return;
  for (const res of Array.from(clients)) {
    sendSSE(res, "notification", payload);
  }
}

// ─── SSE Handler for lab users ────────────────────────────────────────────────
export async function handleUserSSE(req: Request, res: Response) {
  // Authenticate via session cookie
  let user: { id: number; role: string } | null = null;
  try {
    user = await sdk.authenticateRequest(req) as any;
  } catch (_e) {
    res.status(401).end();
    return;
  }
  if (!user) {
    res.status(401).end();
    return;
  }
  const userId = user.id;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  // Send initial ping to confirm connection
  sendSSE(res, "connected", { userId, role: user.role });

  addUserClient(userId, res);

  // Keep-alive ping every 25s to prevent proxy timeouts
  const ping = setInterval(() => {
    try { res.write(": ping\n\n"); } catch (_e) { clearInterval(ping); }
  }, 25000);

  req.on("close", () => {
    clearInterval(ping);
    removeUserClient(userId, res);
  });
}

// ─── SSE Handler for sector portal ───────────────────────────────────────────
export function handleSectorSSE(req: Request, res: Response) {
  const sectorId = parseInt(req.query.sectorId as string);
  if (!sectorId || isNaN(sectorId)) {
    res.status(400).end();
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  sendSSE(res, "connected", { sectorId });

  addSectorClient(sectorId, res);

  const ping = setInterval(() => {
    try { res.write(": ping\n\n"); } catch (_e) { clearInterval(ping); }
  }, 25000);

  req.on("close", () => {
    clearInterval(ping);
    removeSectorClient(sectorId, res);
  });
}
