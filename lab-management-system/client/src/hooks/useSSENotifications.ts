import { useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";

export type NotificationPayload = {
  id?: number;
  title: string;
  message: string;
  type?: string;
  notificationType?: string;
  targetRole?: string;
  sectorId?: number | null;
  isRead?: boolean;
  createdAt?: string | Date;
};

type Options = {
  onNew?: (n: NotificationPayload) => void;
  userRole?: string;
};

/**
 * Connects to the SSE endpoint and calls onNew whenever a new notification arrives.
 * Also triggers a tRPC refetch so the bell badge stays in sync.
 */
export function useSSENotifications({ onNew, userRole }: Options = {}) {
  const utils = trpc.useUtils();
  const esRef = useRef<EventSource | null>(null);

  const refetchNotifications = useCallback(() => {
    utils.notifications.list.invalidate().catch(() => {});
  }, [utils]);

  useEffect(() => {
    const es = new EventSource("/api/notifications/stream", { withCredentials: true });
    esRef.current = es;

    es.addEventListener("connected", () => {
      // Connection confirmed
    });

    es.addEventListener("notification", (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data) as NotificationPayload;
        refetchNotifications();
        onNew?.(payload);
      } catch (_err) { /* ignore parse errors */ }
    });

    // Role-based broadcast: only process if role matches
    es.addEventListener("notification_role", (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data) as NotificationPayload & { role: string };
        if (!userRole || payload.role === userRole) {
          refetchNotifications();
          onNew?.(payload);
        }
      } catch (_err) { /* ignore parse errors */ }
    });

    es.onerror = () => {
      // SSE will auto-reconnect; no action needed
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [refetchNotifications, onNew, userRole]);
}
