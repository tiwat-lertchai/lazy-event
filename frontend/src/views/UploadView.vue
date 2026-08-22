<script setup lang="ts">
import { ref, computed } from "vue";
import { usePhotoUpload, type PaperSize, type UploadItem } from "../composables/usePhotoUpload";
import { PRICE_TIERS, ALLOWED_QUANTITIES } from "../composables/usePricing";

const { isUploading, uploadError, uploadPhoto } = usePhotoUpload();

const selectedFile = ref<File | null>(null);
const previewUrl = ref<string | null>(null);
const selectedSize = ref<PaperSize>("4x6");
const selectedQuantity = ref<number>(1);
const uploadDone = ref(false);

const price = computed(() => PRICE_TIERS[selectedQuantity.value] ?? 0);

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file) return;

  selectedFile.value = file;
  previewUrl.value = URL.createObjectURL(file);
  uploadDone.value = false;
}

async function handleSubmit() {
  if (!selectedFile.value) return;

  const items: UploadItem[] = [
    { paperSize: selectedSize.value, quantity: selectedQuantity.value },
  ];

  const result = await uploadPhoto(selectedFile.value, items);

  if (result) {
    uploadDone.value = true;
    selectedFile.value = null;
    previewUrl.value = null;
  }
}
</script>

<template>
  <div class="upload-view">
    <h1>อัปโหลดรูปเพื่อปริ้น</h1>

    <input type="file" accept="image/jpeg,image/png" @change="handleFileChange" />

    <img v-if="previewUrl" :src="previewUrl" alt="ตัวอย่างรูปที่เลือก" width="200" />

    <div class="upload-view__options">
      <label>
        ขนาดกระดาษ
        <select v-model="selectedSize">
          <option value="4x6">4x6</option>
          <option value="polaroid_3x3">โพลารอยด์ 3x3</option>
        </select>
      </label>

      <label>
        จำนวน
        <select v-model.number="selectedQuantity">
          <option v-for="qty in ALLOWED_QUANTITIES" :key="qty" :value="qty">
            {{ qty }} ใบ
          </option>
        </select>
      </label>
    </div>

    <p>ราคา: {{ price }} บาท</p>

    <button :disabled="!selectedFile || isUploading" @click="handleSubmit">
      {{ isUploading ? "กำลังอัปโหลด..." : "ส่งรูปเข้าคิวปริ้น" }}
    </button>

    <p v-if="uploadError" class="upload-view__error">{{ uploadError }}</p>
    <p v-if="uploadDone">ส่งรูปเรียบร้อยแล้ว ตรวจสอบสถานะได้ที่หน้าคิว</p>
  </div>
</template>
