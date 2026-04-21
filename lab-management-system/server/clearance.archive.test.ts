import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAccountantCtx(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 10,
    openId: "accountant-test",
    email: "accountant@lab.test",
    name: "Test Accountant",
    username: "accountant_test",
    role: "accountant",
    permissions: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLoginAt: null,
    passwordHash: null,
  };
  return {
    user,
    setCookie: vi.fn(),
    clearCookie: vi.fn(),
  };
}

function createAdminCtx(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-test",
    email: "admin@lab.test",
    name: "Admin User",
    username: "admin",
    role: "admin",
    permissions: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLoginAt: null,
    passwordHash: null,
  };
  return {
    user,
    setCookie: vi.fn(),
    clearCookie: vi.fn(),
  };
}

// Mock db helpers to avoid real DB calls in unit tests
vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    getAllSectorAccounts: vi.fn().mockResolvedValue([
      { id: 1, sectorKey: "sector_1", nameAr: "قطاع/1", nameEn: "Sector/1" },
      { id: 2, sectorKey: "sector_2", nameAr: "قطاع/2", nameEn: "Sector/2" },
    ]),
    getAllClearanceRequests: vi.fn().mockResolvedValue([
      {
        id: 1, requestCode: "CLR-2024-001", status: "issued",
        contractorName: "مقاول أ", contractNumber: "C-001",
        certificateCode: "CERT-CLR-2024-001", totalAmount: "500.00",
        totalTests: 5, passedTests: 5, failedTests: 0,
        sectorId: 1, createdAt: new Date("2024-01-10"),
        certificateIssuedAt: new Date("2024-01-15"),
      },
      {
        id: 2, requestCode: "CLR-2024-002", status: "rejected",
        contractorName: "مقاول ب", contractNumber: "C-002",
        certificateCode: null, totalAmount: "200.00",
        totalTests: 3, passedTests: 2, failedTests: 1,
        sectorId: 2, createdAt: new Date("2024-02-01"),
        certificateIssuedAt: null,
      },
      {
        id: 3, requestCode: "CLR-2024-003", status: "pending",
        contractorName: "مقاول ج", contractNumber: "C-003",
        certificateCode: null, totalAmount: "300.00",
        totalTests: 4, passedTests: 2, failedTests: 0,
        sectorId: 1, createdAt: new Date("2024-03-01"),
        certificateIssuedAt: null,
      },
    ]),
  };
});

describe("clearance.listSectors", () => {
  it("returns list of sector accounts for accountant", async () => {
    const caller = appRouter.createCaller(createAccountantCtx());
    const result = await caller.clearance.listSectors();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("id");
    expect(result[0]).toHaveProperty("sectorKey");
    expect(result[0]).toHaveProperty("nameAr");
    expect(result[0]).toHaveProperty("nameEn");
  });

  it("returns list of sector accounts for admin", async () => {
    const caller = appRouter.createCaller(createAdminCtx());
    const result = await caller.clearance.listSectors();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("clearance.getArchive", () => {
  it("returns only issued and rejected requests (excludes pending)", async () => {
    const caller = appRouter.createCaller(createAccountantCtx());
    const result = await caller.clearance.getArchive({});
    // Should NOT include pending (id=3)
    expect(result.every(r => r.status === "issued" || r.status === "rejected")).toBe(true);
    expect(result.find(r => r.status === "pending")).toBeUndefined();
  });

  it("filters by search term on contractorName", async () => {
    const caller = appRouter.createCaller(createAccountantCtx());
    const result = await caller.clearance.getArchive({ search: "مقاول أ" });
    expect(result.length).toBe(1);
    expect(result[0].contractorName).toBe("مقاول أ");
  });

  it("filters by search term on contractNumber", async () => {
    const caller = appRouter.createCaller(createAccountantCtx());
    const result = await caller.clearance.getArchive({ search: "C-002" });
    expect(result.length).toBe(1);
    expect(result[0].contractNumber).toBe("C-002");
  });

  it("filters by sectorId", async () => {
    const caller = appRouter.createCaller(createAccountantCtx());
    const result = await caller.clearance.getArchive({ sectorId: 1 });
    expect(result.every(r => r.sectorId === 1)).toBe(true);
  });

  it("returns empty array when search has no matches", async () => {
    const caller = appRouter.createCaller(createAccountantCtx());
    const result = await caller.clearance.getArchive({ search: "لا يوجد مقاول بهذا الاسم" });
    expect(result.length).toBe(0);
  });

  it("filters by dateFrom correctly", async () => {
    const caller = appRouter.createCaller(createAccountantCtx());
    const result = await caller.clearance.getArchive({ dateFrom: "2024-02-01" });
    // Only id=2 (2024-02-01) should be included; id=1 (2024-01-10) excluded
    expect(result.every(r => new Date(r.createdAt!) >= new Date("2024-02-01"))).toBe(true);
  });
});
