/**
 * Local Authentication Module
 * Handles username/password login for internal lab users.
 * Uses the same JWT session mechanism as Manus OAuth.
 */
import type { Express, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { getUserByUsername, updateUserLastSignedIn, createInternalUser, getAllUsers } from "../db";
import { sdk } from "./sdk";
import { getSessionCookieOptions } from "./cookies";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export function registerLocalAuthRoutes(app: Express) {
  // POST /api/auth/local/login
  app.post("/api/auth/local/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body as { username?: string; password?: string };

      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }

      const user = await getUserByUsername(username.trim().toLowerCase());

      if (!user) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      if (!user.isActive) {
        return res.status(403).json({ error: "Account is disabled. Contact your administrator." });
      }

      if (!user.passwordHash) {
        return res.status(401).json({ error: "Account not configured for local login" });
      }

      const passwordValid = await bcrypt.compare(password, user.passwordHash);
      if (!passwordValid) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      // Create session token using the same mechanism as Manus OAuth
      const sessionToken = await sdk.createSessionToken(user.openId, {
        expiresInMs: ONE_YEAR_MS,
        name: user.name?.trim() || username.trim(),
      });

      // Set session cookie
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      // Update last signed in
      await updateUserLastSignedIn(user.id);

      return res.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          role: user.role,
          permissions: user.permissions,
        },
      });
    } catch (error) {
      console.error("[LocalAuth] Login error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // POST /api/auth/local/logout
  app.post("/api/auth/local/logout", (req: Request, res: Response) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return res.json({ success: true });
  });

  // POST /api/auth/local/setup-admin
  // Creates the first admin account if no users exist yet
  app.post("/api/auth/local/setup-admin", async (req: Request, res: Response) => {
    try {
      const { name, username, password } = req.body as { name?: string; username?: string; password?: string };

      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }

      // Check if any admin already exists
      const existingUsers = await getAllUsers();
      const adminExists = existingUsers.some(u => u.role === "admin");
      if (adminExists) {
        return res.status(409).json({ error: "Admin account already exists. Please login." });
      }

      // Check if username is taken
      const existing = await getUserByUsername(username.trim().toLowerCase());
      if (existing) {
        return res.status(409).json({ error: "Username already taken" });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      await createInternalUser({
        name: name || "Admin",
        username: username.trim().toLowerCase(),
        passwordHash,
        role: "admin",
        permissions: undefined,
      });

      return res.json({ success: true, message: "Admin account created. You can now login." });
    } catch (error) {
      console.error("[LocalAuth] Setup admin error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // GET /api/auth/local/has-admin
  // Returns whether an admin account exists (for showing setup button)
  app.get("/api/auth/local/has-admin", async (_req: Request, res: Response) => {
    try {
      const existingUsers = await getAllUsers();
      const adminExists = existingUsers.some(u => u.role === "admin");
      return res.json({ hasAdmin: adminExists });
    } catch (error) {
      return res.json({ hasAdmin: false });
    }
  });
}
