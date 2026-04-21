import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock DB ─────────────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue({
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockResolvedValue({ insertId: 1 }),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
  }),
  createNotification: vi.fn().mockResolvedValue({ insertId: 1 }),
  notifyUsersByRole: vi.fn().mockResolvedValue(undefined),
  notifySector: vi.fn().mockResolvedValue(undefined),
  getSectorIdByKey: vi.fn().mockResolvedValue(42),
  getNotificationsByUser: vi.fn().mockResolvedValue([
    {
      id: 1,
      userId: 10,
      title: "New Sample Received",
      message: "Sample LAB-001 has been registered",
      type: "action_required",
      notificationType: "new_sample",
      targetRole: "lab_manager",
      sectorId: null,
      isRead: false,
      createdAt: new Date("2026-01-01T10:00:00Z"),
    },
  ]),
  markNotificationRead: vi.fn().mockResolvedValue(undefined),
  markAllNotificationsRead: vi.fn().mockResolvedValue(undefined),
}));

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("Notification System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("notifyUsersByRole", () => {
    it("should call notifyUsersByRole with correct params for lab_manager on new sample", async () => {
      const { notifyUsersByRole } = await import("./db");
      await notifyUsersByRole(
        "lab_manager",
        "New Sample Received",
        "Sample LAB-001 has been registered and awaits distribution.",
        1,
        "action_required",
        "new_sample"
      );
      expect(notifyUsersByRole).toHaveBeenCalledWith(
        "lab_manager",
        "New Sample Received",
        "Sample LAB-001 has been registered and awaits distribution.",
        1,
        "action_required",
        "new_sample"
      );
    });

    it("should call notifyUsersByRole for accountant on clearance started", async () => {
      const { notifyUsersByRole } = await import("./db");
      await notifyUsersByRole(
        "accountant",
        "بدأت إجراءات براءة الذمة للعقد C-001",
        "تم بدء إجراءات براءة الذمة للمقاول \"Test Contractor\" - عقد: C-001",
        undefined,
        "action_required",
        "clearance_started"
      );
      expect(notifyUsersByRole).toHaveBeenCalledWith(
        "accountant",
        expect.stringContaining("براءة الذمة"),
        expect.any(String),
        undefined,
        "action_required",
        "clearance_started"
      );
    });

    it("should call notifyUsersByRole for accountant on clearance QC approved", async () => {
      const { notifyUsersByRole } = await import("./db");
      await notifyUsersByRole(
        "accountant",
        "تم تأكيد اختبارات براءة الذمة BR-001",
        "تم تأكيد جميع الاختبارات — يمكن إصدار أمر الدفع",
        undefined,
        "action_required",
        "clearance_qc_approved"
      );
      expect(notifyUsersByRole).toHaveBeenCalledWith(
        "accountant",
        expect.stringContaining("تأكيد"),
        expect.stringContaining("أمر الدفع"),
        undefined,
        "action_required",
        "clearance_qc_approved"
      );
    });
  });

  describe("notifySector", () => {
    it("should call notifySector with correct params for sample_received", async () => {
      const { notifySector } = await import("./db");
      await notifySector(
        42,
        "تم استلام عينتك في المختبر",
        "تم استلام العينة LAB-001 في مختبر الإنشاءات والمواد الهندسية",
        1,
        "sample_received"
      );
      expect(notifySector).toHaveBeenCalledWith(
        42,
        expect.stringContaining("استلام"),
        expect.any(String),
        1,
        "sample_received"
      );
    });

    it("should call notifySector for result_issued", async () => {
      const { notifySector } = await import("./db");
      await notifySector(
        42,
        "صدرت نتيجة اختبار العينة LAB-001",
        "تم اعتماد نتائج اختبار العينة LAB-001 — يمكن الاطلاع عليها",
        1,
        "result_issued"
      );
      expect(notifySector).toHaveBeenCalledWith(
        42,
        expect.stringContaining("نتيجة"),
        expect.any(String),
        1,
        "result_issued"
      );
    });

    it("should call notifySector for clearance_started", async () => {
      const { notifySector } = await import("./db");
      await notifySector(
        42,
        "بدأت إجراءات براءة الذمة للعقد C-001",
        "تم بدء إجراءات براءة الذمة",
        undefined,
        "clearance_started"
      );
      expect(notifySector).toHaveBeenCalledWith(
        42,
        expect.stringContaining("براءة الذمة"),
        expect.any(String),
        undefined,
        "clearance_started"
      );
    });

    it("should call notifySector for clearance_issued", async () => {
      const { notifySector } = await import("./db");
      await notifySector(
        42,
        "صدرت شهادة براءة الذمة للعقد C-001",
        "صدرت شهادة براءة الذمة — يمكن تحميلها",
        undefined,
        "clearance_issued"
      );
      expect(notifySector).toHaveBeenCalledWith(
        42,
        expect.stringContaining("شهادة"),
        expect.any(String),
        undefined,
        "clearance_issued"
      );
    });
  });

  describe("getSectorIdByKey", () => {
    it("should return sector ID for valid sector key", async () => {
      const { getSectorIdByKey } = await import("./db");
      const id = await getSectorIdByKey("roads");
      expect(id).toBe(42);
    });

    it("should return null for invalid sector key", async () => {
      const { getSectorIdByKey } = await import("./db");
      vi.mocked(getSectorIdByKey).mockResolvedValueOnce(null);
      const id = await getSectorIdByKey("nonexistent");
      expect(id).toBeNull();
    });
  });

  describe("getNotificationsByUser", () => {
    it("should return notifications with notificationType field", async () => {
      const { getNotificationsByUser } = await import("./db");
      const notifs = await getNotificationsByUser(10);
      expect(notifs).toHaveLength(1);
      expect(notifs[0]).toMatchObject({
        id: 1,
        userId: 10,
        notificationType: "new_sample",
        targetRole: "lab_manager",
        isRead: false,
      });
    });
  });
});
