import { ref, onMounted } from "vue";
import { accessToken } from "./useLiffAuth";
import type { PrintJob, QueueStatus } from "./useQueues";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// Next allowed status per current status, used to render the right action button.
// Must match the backend's domain/photoQueue/stateMachine.ts.
const NEXT_STATUS: Record<QueueStatus, QueueStatus | null> = {
  pending: "printing",
  printing: "done",
  done: null,
  failed: "pending",
};

export function useAdminQueues() {
  const jobs = ref<PrintJob[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function fetchAllQueues(statusFilter?: QueueStatus) {
    isLoading.value = true;

    try {
      const url = new URL(`${API_BASE}/photos/admin/queues`);
      if (statusFilter) {
        url.searchParams.set("status", statusFilter);
      }

      const res = await fetch(url, {
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

  async function updateStatus(jobId: string, newStatus: QueueStatus) {
    // Checking Access Token before doing anything else
    if (!accessToken.value) {
      error.value = "Access Token Error, Please check LIFF login state";
      return;
    }

    const res = await fetch(`${API_BASE}/photos/admin/queues/${jobId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken.value}`,
      },
      body: JSON.stringify({ status: newStatus }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      error.value = body?.error ?? `Update Error, Server responded with status ${res.status}`;
      return;
    }

    // Refresh the list to reflect the change instead of guessing the new shape locally
    await fetchAllQueues();
  }

  onMounted(() => {
    fetchAllQueues();
  });

  return { jobs, isLoading, error, fetchAllQueues, updateStatus, NEXT_STATUS };
}
