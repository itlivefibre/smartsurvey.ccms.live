<script setup lang="ts">
import { ref, computed, h, watch } from "vue";
import type { ColumnDef } from "@tanstack/vue-table";
import DateRangePicker from "~/components/Complaint/DateRangePicker.vue";
import { CalendarDate } from "@internationalized/date";

/* =============================
   INTERFACE
============================= */
interface RepairRecord {
  id: number;
  ref_no: string;
  user_id: number;
  watt: string;
  driver: string;
  pcb: string;
  image_path: string;
  resolve_image: string | null;
  lat: string;
  lng: string;
  resolve_lat: string;
  resolve_lng: string;
  light_status: string | null;
  problem: string | null;
  message: string | null;
  project_name: string | null;
  first_image_date: string | null;
  resolve_date: string | null;
  created_at: string;
  updated_at: string | null;
}

/* =============================
   PAGINATION
============================= */
const currentPage = ref(1);
const pageSize = ref(20);
const pageSizeOptions = [5, 10, 20, 50, 100];

/* =============================
   TOKEN
============================= */
const token = localStorage.getItem("access_token");
const accesskey = token;

/* =============================
   API CALL (Backend Pagination)
============================= */
const {
  data: apiData,
  pending,
  error,
} = await useAsyncData<{
  result: RepairRecord[];
  totalRecords: number;
  totalPages: number;
  currentPage: number;
}>(
  "repairingList",
  () =>
    $fetch(
      "https://ayodhya.water.live/api/surveyNew.php?action=get_repairing_list",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: {
          accesskey,
          perPage: pageSize.value,
          page: currentPage.value,
        },
      },
    ),
  {
    watch: [currentPage, pageSize],
  },
);

/* =============================
   SAFE COMPUTEDS
============================= */
const data = computed<RepairRecord[]>(() => {
  return apiData.value?.result || [];
});

const totalRecords = computed(() => {
  return apiData.value?.totalRecords ?? 0;
});

const totalPages = computed(() => {
  return apiData.value?.totalPages ?? 1;
});

/* =============================
   IMAGE MODAL
============================= */
const showModal = ref(false);
const modalImageUrl = ref("");

const baseImageUrl = "https://ayodhya.water.live/api/survey_img_act/";
const baseThumbUrl = "https://ayodhya.water.live/api/survey_img_100_100/";

/* =============================
   TABLE COLUMNS
============================= */
const columns: ColumnDef<RepairRecord>[] = [
  { accessorKey: "id", header: "ID" },
  { accessorKey: "ref_no", header: "Reference No" },
  { accessorKey: "user_id", header: "User Id" },
  { accessorKey: "watt", header: "Watt" },
  { accessorKey: "driver", header: "Driver" },
  { accessorKey: "pcb", header: "PCB" },

  {
    accessorKey: "image_path",
    header: "Before Repair",
    cell: ({ row }) => {
      const img = row.original.image_path;
      if (!img) return "No Image";
      return h("img", {
        src: baseThumbUrl + img,
        class: "w-10 h-10 rounded cursor-pointer",
        onClick: () => {
          modalImageUrl.value = baseImageUrl + img;
          showModal.value = true;
        },
      });
    },
  },

  {
    accessorKey: "resolve_image",
    header: "After Repair",
    cell: ({ row }) => {
      const img = row.original.resolve_image;
      if (!img) return "Pending";
      return h("img", {
        src: baseThumbUrl + img,
        class: "w-10 h-10 rounded cursor-pointer",
        onClick: () => {
          modalImageUrl.value = baseImageUrl + img;
          showModal.value = true;
        },
      });
    },
  },

  { accessorKey: "lat", header: "Latitude" },
  { accessorKey: "lng", header: "Longitude" },
  { accessorKey: "light_status", header: "Status" },
  { accessorKey: "problem", header: "Problem" },
  { accessorKey: "message", header: "Message" },
  { accessorKey: "created_at", header: "Created At" },
  {
    accessorKey: "resolve_date",
    header: "Resolved At",
    cell: ({ row }) => row.original.resolve_date || "N/A",
  },
  { accessorKey: "updated_at", header: "Updated At" },
];
</script>

<template>
  <div>
    <div v-if="pending" class="flex justify-center items-center py-10">
      <div
        class="h-8 w-8 border-4 text-teal-600 border-t-transparent rounded-full animate-spin"
      ></div>
    </div>
    <div v-else-if="error" class="text-center py-10 text-red-500">
      Failed to load complaints.
    </div>
    <div v-else>
      <div class="compact-accordion">
        <!-- Outer card (we keep it but remove its padding via deep selector) -->
        <UCard class="light ring-2 mb-4 border !p-0">
          <!-- Accordion: note we also put !p-0 here as a hint, but real override is in CSS below -->
          <UAccordion
            :items="[
              { label: 'Filters', icon: 'mdi:filter-outline', slot: 'filters' },
            ]"
            class="!p-0"
          >
            <template #filters>
              <!-- Inner card: remove its default padding and control spacing with grid's p-3 -->
              <UCard
                class="w-full bg-white border border-slate-200 shadow-sm mb-3 rounded-lg ring-0 !p-0"
              >
                <div
                  class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-3 filters-grid"
                >
                  <div class="flex flex-col">
                    <label
                      class="text-xs font-medium text-gray-700 flex items-center gap-1 mb-1"
                    >
                      <Icon
                        name="mdi:magnify"
                        size="16"
                        class="text-blue-500"
                      />
                      Pole / Mobile / Ward / Id
                    </label>

                    <div class="relative">
                      <Icon
                        name="mdi:transmission-tower"
                        class="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"
                        size="16"
                      />

                      <input
                        v-model="poleOrMobileFilter"
                        type="text"
                        placeholder="Pole no or mobile"
                        class="pl-8 border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
                      />
                    </div>
                  </div>

                  <!-- Date -->
                  <div class="flex flex-col">
                    <label
                      class="text-xs font-medium text-gray-700 flex items-center gap-1 mb-1"
                    >
                      <Icon
                        name="mdi:calendar-month-outline"
                        size="16"
                        class="text-pink-500"
                      />
                      Date
                    </label>
                    <DateRangePicker v-model="range" />
                  </div>
                </div>
              </UCard>
            </template>
          </UAccordion>
        </UCard>
      </div>
      <!-- Filters & Table -->
      <UCard class="w-full p-4 ring-2 mb-10 border shadow-sm light">
        <div class="flex justify-between items-center mb-2">
          <div class="flex items-center gap-2">
            <h3 class="text-sm font-medium text-gray-500">Repairing Records</h3>
          </div>

          <!-- Export Buttons as Small Icons -->
          <div class="flex gap-2">
            <div
              class="flex items-center gap-2 text-sm text-gray-700 px-5 py-1"
            >
              <USelect
                v-model="pageSize"
                :items="
                  pageSizeOptions.map((s) => ({
                    label: s + ' entries',
                    value: s,
                  }))
                "
                class="w-32"
              />
            </div>

            <UButton
              color="emerald"
              variant="solid"
              size="sm"
              class="flex items-center gap-2 px-3 py-1.5 cursor-pointer bg-teal-500"
              @click="exportCSV"
              title="Export CSV"
            >
              <Icon name="mdi:file-delimited-outline" size="18" />
              Export CSV
            </UButton>
          </div>
        </div>

        <UTable :data="data" :columns="columns" />

        <div
          class="flex items-center justify-between mt-3 text-xs text-gray-500"
        >
          <span>
            Showing {{ data.length }} of {{ totalRecords }} records — Page
            {{ currentPage }} of {{ totalPages }}
          </span>

          <UPagination
            v-model:page="currentPage"
            :total="totalRecords"
            :items-per-page="pageSize"
          />
        </div>
      </UCard>

      <!-- Image Modal -->
      <UModal
        v-model:open="showModal"
        :ui="{ width: 'sm' }"
        title="Image Preview"
      >
        <template #body>
          <div class="flex justify-center">
            <img :src="modalImageUrl" class="max-h-[70vh] rounded shadow" />
          </div>
        </template>
        <template #footer>
          <UButton color="primary" @click="showModal = false">Close</UButton>
        </template>
      </UModal>

      <!-- Edit Modal -->
      <UModal
        v-model:open="showEditModal"
        :ui="{ width: 'md' }"
        title="Edit Complaint"
      >
        <template #body>
          <div class="space-y-4 flex flex-col gap-4">
            <UInput
              v-model="editForm.pole_no"
              label="Pole Number"
              placeholder="Enter Pole Number"
            />
          </div>
        </template>
        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton variant="outline" @click="showEditModal = false"
              >Cancel</UButton
            >
            <UButton color="primary" @click="submitEdit">Save</UButton>
          </div>
        </template>
      </UModal>
    </div>
  </div>
</template>
<style scoped>
.compact-accordion :deep(.p-4),
.compact-accordion :deep(.px-4),
.compact-accordion :deep(.py-4) {
  padding-left: 5 !important;
  padding-right: 5 !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
}
</style>
