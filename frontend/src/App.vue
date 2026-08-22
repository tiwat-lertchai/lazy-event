<script setup lang="ts">
import { onMounted } from "vue";
import { RouterLink, RouterView } from "vue-router";
import { initLiff, isReady } from "./composables/useLiffAuth";

onMounted(() => {
  initLiff();
});
</script>

<template>
  <div class="app">
    <p v-if="!isReady">กำลังเข้าสู่ระบบ...</p>

    <template v-else>
      <nav class="app__nav">
        <RouterLink to="/">อัปโหลดรูป</RouterLink>
        <RouterLink to="/queue">คิวของฉัน</RouterLink>
        <RouterLink to="/board">ข้อความอวยพร</RouterLink>
        <RouterLink to="/admin">Admin</RouterLink>
      </nav>

      <RouterView />
    </template>
  </div>
</template>
