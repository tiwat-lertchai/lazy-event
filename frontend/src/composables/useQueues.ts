import { ref, onMounted, onUnmounted } from "vue";
import { accessToken } from "./useLiffAuth";

export type QueueStatus = "pending" | "printing" | "done" | "failed";

export interface PrintJob {
  id: string;
  imageUrl: string;
  paperSize: "4x6" | "polaroid_3x3";
  quantity: number;
  priceBaht: number;
  status: QueueStatus;
  createdAt: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const POLL_INTERVAL_MS = 8000;

// Loads the current user's print jobs and refreshes them on an interval.
// Simple polling instead of WebSocket — queue status doesn't change fast
// enough to need real-time push, and this keeps the frontend much simpler.
export function useQueues() {
  const jobs = ref<PrintJob[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  let intervalId: ReturnType<typeof setInterval> | undefined;

  async function fetchQueues() {
    isLoading.value = true;

    try {
      const res = await fetch(`${API_BASE}/photos/queues`, {
        headers: { Authorization: `Bearer ${accessToken.value}` },
      });

      if (!res.ok) {
        throw new Error(`Failed to load queues: ${res.status}`);
      }

      const data = await res.json();
      jobs.value = data.jobs;
      error.value = null;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Unknown error";
    } finally {
      isLoading.value = false;
    }
  }

  onMounted(() => {
    fetchQueues();
    intervalId = setInterval(fetchQueues, POLL_INTERVAL_MS);
  });

  onUnmounted(() => {
    clearInterval(intervalId);
  });

  return { jobs, isLoading, error, fetchQueues };
}
