import { ref, onMounted } from "vue";
import { accessToken } from "./useLiffAuth";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export interface Advice {
  id: string;
  lineUserId: string;
  message: string;
  createdAt: string;
}

export function useAdvices() {
  const messages = ref<Advice[]>([]);
  const isLoading = ref(false);
  const isPosting = ref(false);
  const error = ref<string | null>(null);

  async function fetchAdvices() {
    isLoading.value = true;

    try {
      const res = await fetch(`${API_BASE}/advices`);

      if (!res.ok) {
        throw new Error(`Failed to load messages: ${res.status}`);
      }

      const data = await res.json();
      messages.value = data.messages;
      error.value = null;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Unknown error";
    } finally {
      isLoading.value = false;
    }
  }

  async function postAdvice(message: string) {
    // Checking Access Token before doing anything else
    if (!accessToken.value) {
      error.value = "Access Token Error, Please check LIFF login state";
      return false;
    }

    isPosting.value = true;

    try {
      const res = await fetch(`${API_BASE}/advices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken.value}`,
        },
        body: JSON.stringify({ message }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? `Post Error, Server responded with status ${res.status}`);
      }

      await fetchAdvices();
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Unknown error";
      return false;
    } finally {
      isPosting.value = false;
    }
  }

  async function deleteAdvice(id: string) {
    if (!accessToken.value) {
      error.value = "Access Token Error, Please check LIFF login state";
      return;
    }

    const res = await fetch(`${API_BASE}/advices/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken.value}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      error.value = body?.error ?? `Delete Error, Server responded with status ${res.status}`;
      return;
    }

    await fetchAdvices();
  }

  onMounted(() => {
    fetchAdvices();
  });

  return { messages, isLoading, isPosting, error, fetchAdvices, postAdvice, deleteAdvice };
}
