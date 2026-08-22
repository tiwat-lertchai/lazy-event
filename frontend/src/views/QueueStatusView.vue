<script setup lang="ts">
import { useQueues } from "../composables/useQueues";

const { jobs, isLoading, error, fetchQueues } = useQueues();

const statusLabels: Record<string, string> = {
  pending: "รอคิว",
  printing: "กำลังปริ้น",
  done: "เสร็จแล้ว",
  failed: "ผิดพลาด",
};
</script>

<template>
  <div class="queue-status">
    <div class="queue-status__header">
      <span>อัปเดตอัตโนมัติทุก 8 วินาที</span>
      <button :disabled="isLoading" @click="fetchQueues">
        {{ isLoading ? "กำลังโหลด..." : "รีเฟรช" }}
      </button>
    </div>

    <p v-if="isLoading && jobs.length === 0">กำลังโหลด...</p>
    <p v-else-if="error">โหลดคิวไม่สำเร็จ: {{ error }}</p>

    <ul v-else>
      <li v-for="job in jobs" :key="job.id">
        <img :src="job.imageUrl" :alt="job.paperSize" width="80" />
        <span>{{ job.paperSize }} x{{ job.quantity }}</span>
        <span>{{ job.priceBaht }} บาท</span>
        <span>{{ statusLabels[job.status] ?? job.status }}</span>
      </li>
    </ul>
  </div>
</template>
