<script setup lang="ts">
import { ref } from "vue";
import { useAdminQueues } from "../composables/useAdminQueues";
import type { QueueStatus } from "../composables/useQueues";

const { jobs, isLoading, error, fetchAllQueues, updateStatus, NEXT_STATUS } = useAdminQueues();

const statusLabels: Record<QueueStatus, string> = {
  pending: "รอคิว",
  printing: "กำลังปริ้น",
  done: "เสร็จแล้ว",
  failed: "ผิดพลาด",
};

const statusFilter = ref<QueueStatus | "">("");

function handleFilterChange() {
  fetchAllQueues(statusFilter.value || undefined);
}
</script>

<template>
  <div class="admin-queue">
    <h1>จัดการคิวปริ้น (Admin)</h1>

    <label>
      กรองตามสถานะ
      <select v-model="statusFilter" @change="handleFilterChange">
        <option value="">ทั้งหมด</option>
        <option value="pending">รอคิว</option>
        <option value="printing">กำลังปริ้น</option>
        <option value="done">เสร็จแล้ว</option>
        <option value="failed">ผิดพลาด</option>
      </select>
    </label>

    <p v-if="isLoading">กำลังโหลด...</p>
    <p v-if="error" class="admin-queue__error">{{ error }}</p>

    <table v-if="!isLoading">
      <thead>
        <tr>
          <th>รูป</th>
          <th>ขนาด</th>
          <th>จำนวน</th>
          <th>ราคา</th>
          <th>สถานะ</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="job in jobs" :key="job.id">
          <td><img :src="job.imageUrl" :alt="job.paperSize" width="60" /></td>
          <td>{{ job.paperSize }}</td>
          <td>{{ job.quantity }}</td>
          <td>{{ job.priceBaht }} บาท</td>
          <td>{{ statusLabels[job.status] }}</td>
          <td>
            <button
              v-if="NEXT_STATUS[job.status]"
              @click="updateStatus(job.id, NEXT_STATUS[job.status]!)"
            >
              เปลี่ยนเป็น {{ statusLabels[NEXT_STATUS[job.status]!] }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
