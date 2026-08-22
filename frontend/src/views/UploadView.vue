<script setup lang="ts">
import { ref, computed } from "vue";
import { usePhotoUpload, type PaperSize, type UploadItem } from "../composables/usePhotoUpload";
import { PRICE_TIERS, ALLOWED_QUANTITIES } from "../composables/usePricing";

const { isUploading, uploadError, uploadPhotos } = usePhotoUpload();

interface SelectedPhoto {
  file: File;
  previewUrl: string;
}

const selectedPhotos = ref<SelectedPhoto[]>([]);
const selectedSize = ref<PaperSize>("4x6");
const selectedQuantity = ref<number>(1);
const uploadDone = ref(false);

// Same paperSize+quantity applies to every photo in this batch, so the
// total is just the per-photo price multiplied by how many photos are selected.
const pricePerPhoto = computed(() => PRICE_TIERS[selectedQuantity.value] ?? 0);
const totalPrice = computed(() => pricePerPhoto.value * selectedPhotos.value.length);

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const files = target.files;

  if (!files || files.length === 0) return;

  selectedPhotos.value = Array.from(files).map((file) => ({
    file,
    previewUrl: URL.createObjectURL(file),
  }));
  uploadDone.value = false;
}

function removePhoto(index: number) {
  selectedPhotos.value.splice(index, 1);
}

async function handleSubmit() {
  if (selectedPhotos.value.length === 0) return;

  const items: UploadItem[] = [
    { paperSize: selectedSize.value, quantity: selectedQuantity.value },
  ];

  const files = selectedPhotos.value.map((p) => p.file);
  const result = await uploadPhotos(files, items);

  if (result) {
    uploadDone.value = true;
    selectedPhotos.value = [];
  }
}
</script>

<template>
  <div class="upload-view">
    <h1>อัปโหลดรูปเพื่อปริ้น</h1>

    <input
      type="file"
      accept="image/jpeg,image/png"
      multiple
      @change="handleFileChange"
    />

    <ul v-if="selectedPhotos.length > 0" class="upload-view__previews">
      <li v-for="(photo, index) in selectedPhotos" :key="index">
        <img :src="photo.previewUrl" alt="ตัวอย่างรูปที่เลือก" width="100" />
        <button type="button" @click="removePhoto(index)">ลบ</button>
      </li>
    </ul>

    <div class="upload-view__options">
      <label>
        ขนาดกระดาษ
        <select v-model="selectedSize">
          <option value="4x6">4x6</option>
          <option value="polaroid_3x3">โพลารอยด์ 3x3</option>
        </select>
      </label>

      <label>
        จำนวน (ต่อรูป)
        <select v-model.number="selectedQuantity">
          <option v-for="qty in ALLOWED_QUANTITIES" :key="qty" :value="qty">
            {{ qty }} ใบ
          </option>
        </select>
      </label>
    </div>

    <p v-if="selectedPhotos.length > 0">
      {{ selectedPhotos.length }} รูป x {{ pricePerPhoto }} บาท = {{ totalPrice }} บาท
    </p>

    <button :disabled="selectedPhotos.length === 0 || isUploading" @click="handleSubmit">
      {{ isUploading ? "กำลังอัปโหลด..." : "ส่งรูปเข้าคิวปริ้น" }}
    </button>

    <p v-if="uploadError" class="upload-view__error">{{ uploadError }}</p>
    <p v-if="uploadDone">ส่งรูปเรียบร้อยแล้ว ตรวจสอบสถานะได้ที่หน้าคิว</p>
  </div>
</template>