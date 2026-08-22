<script setup lang="ts">
import { ref } from "vue";
import { useAdvices } from "../composables/useAdvices";

// isAdmin controls whether the delete button shows. The backend still checks
// admin status on every DELETE request regardless of what this flag says here.
defineProps<{ isAdmin?: boolean }>();

const { messages, isLoading, isPosting, error, postAdvice, deleteAdvice } = useAdvices();

const newMessage = ref("");

async function handleSubmit() {
  if (!newMessage.value.trim()) return;

  const success = await postAdvice(newMessage.value.trim());
  if (success) {
    newMessage.value = "";
  }
}
</script>

<template>
  <div class="advice-board">
    <h1>ข้อความอวยพร</h1>

    <form @submit.prevent="handleSubmit">
      <textarea
        v-model="newMessage"
        placeholder="เขียนข้อความอวยพรของคุณ..."
        maxlength="500"
      ></textarea>
      <button type="submit" :disabled="isPosting || !newMessage.trim()">
        {{ isPosting ? "กำลังส่ง..." : "ส่งข้อความ" }}
      </button>
    </form>

    <p v-if="error" class="advice-board__error">{{ error }}</p>
    <p v-if="isLoading">กำลังโหลด...</p>

    <ul v-else class="advice-board__list">
      <li v-for="advice in messages" :key="advice.id">
        <p>{{ advice.message }}</p>
        <button v-if="isAdmin" @click="deleteAdvice(advice.id)">ลบ</button>
      </li>
    </ul>
  </div>
</template>
