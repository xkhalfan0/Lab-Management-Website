import { useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";

export type SectorNotificationPayload = {
  id?: number;
  title: string;
  message: string;
  notificationType?: string;
  sectorId?: number;
  isRead?: boolean;
  createdAt?: string | Date;
};

type Options = {
  sectorId: number | null | undefined;
  onNew?: (n: SectorNotificationPayload) => void;
};

/**
 * Connects to the sector SSE endpoint and calls onNew when a notification arrives.
 * Also triggers a tRPC refetch so the bell badge stays in sync.
 */
export function useSSESectorNotifications({ sectorId, onNew }: Options) {
  const utils = trpc.useUtils();
  const esRef = useRef<EventSource | null>(null);

  const refetch = useCallback(() => {
    utils.sector.getNotifications.invalidate().catch(() => {});
  }, [utils]);

  useEffect(() => {
    if (!sectorId) return;

    const es = new EventSource(
      `/api/notifications/sector-stream?sectorId=${sectorId}`,
      { withCredentials: true }
    );
    esRef.current = es;

    es.addEventListener("connected", () => {
      // Connection confirmed
    });

    es.addEventListener("notification", (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data) as SectorNotificationPayload;
        refetch();
        onNew?.(payload);
      } catch (_err) { /* ignore */ }
    });

    es.onerror = () => {
      // SSE will auto-reconnect
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [sectorId, refetch, onNew]);
}
