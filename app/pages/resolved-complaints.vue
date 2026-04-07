<script setup lang="ts">
import { ref, computed, h, watch, onMounted } from "vue";
import type { ColumnDef } from "@tanstack/vue-table";

/* -----------------------
   TYPES
------------------------ */
interface Survey {
  id: number;
  electrician_id: number;
  name: string;
  ward_no: string;
  pole_no: string;
  watt: string;
  image_path: string;
  lat: string;
  lng: string;
  light_status: "Working" | "Not Working" | "N/A";
  message: string | null;
  mobile_no: number | null;
  is_active: number;
  created_at: string;
  resolve_at: string;
  updated_at: string | null;
  resolve_image?: string | null;
  electrician?: number | null;
  time_category?: string;
}

/* -----------------------
   GLOBAL STATE
------------------------ */
const currentPage = ref(1);
const pageSize = ref(10);
const pageSizeOptions = [5, 10, 20, 50, 100];

// Filters
const wardFilter = ref("");
const poleFilter = ref("");
const wattFilter = ref("");
const statusFilter = ref<"All" | "Working" | "Not Working" | "N/A">("All");
const dateFilter = ref("");
const resolutionStatusFilter = ref<"All" | "Resolved" | "Unresolved">("All");

const showModal = ref(false);
const modalImageUrl = ref("");

const accesskey = localStorage.getItem("access_token");

const electricians = ref<{ label: string; value: number }[]>([]);

/* -----------------------
   CATEGORY BUTTON STATE
------------------------ */
const activeCategory = ref("All");

/* -----------------------
   API CALL — complaint report
------------------------ */
const {
  data: complaintData,
  pending,
  error,
} = await useAsyncData<{
  error: number;
  result: {
    resolved_0_12: Survey[];
    resolved_12_24: Survey[];
    resolved_1_2_days: Survey[];
    resolved_2_30_days: Survey[];
    resolved_30_plus: Survey[];
  };
}>(
  "complaints_report",
  () =>
    $fetch(
      `https://ayodhya.water.live/api/surveyNew.php?action=get_complaint_report`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: { accesskey },
      }
    ),
  { lazy: true }
);

/* -----------------------
   MERGE ALL GROUPS INTO ONE LIST
------------------------ */
const mergedData = computed(() => {
  if (!complaintData.value?.result) return [];

  const groups = [
    { key: "resolved_0_12", label: "0–12 Hours" },
    { key: "resolved_12_24", label: "12–24 Hours" },
    { key: "resolved_1_2_days", label: "1–2 Days" },
    { key: "resolved_2_30_days", label: "2–30 Days" },
    { key: "resolved_30_plus", label: "30+ Days" },
  ];

  let output: Survey[] = [];

  for (const g of groups) {
    const arr = (complaintData.value?.result[g.key] || []).map((item) => ({
      ...item,
      time_category: g.label,
    }));
    output.push(...arr);
  }

  return output;
});

// console.log("merge_data", mergedData);

/* -----------------------
   CATEGORY FILTERING
------------------------ */
const categoryData = computed(() => {
  if (activeCategory.value === "All") return mergedData.value;

  const map: Record<string, string> = {
    "0-12": "0–12 Hours",
    "12-24": "12–24 Hours",
    "1-2": "1–2 Days",
    "2-30": "2–30 Days",
    "30+": "30+ Days",
  };

  return mergedData.value.filter(
    (i) => i.time_category === map[activeCategory.value]
  );
});

/* The table uses this data: */
const data = categoryData;

/* -----------------------
   GET ELECTRICIAN LIST
------------------------ */
onMounted(async () => {
  try {
    const res = await $fetch(
      "https://ayodhya.water.live/api/surveyNew.php?action=get_electrician",
      {
        method: "POST",
        body: { accesskey },
      }
    );

    if (Array.isArray(res.result)) {
      electricians.value = res.result.map((e: any) => ({
        label: e.name,
        value: e.id,
      }));
    }
  } catch (err) {
    console.error(err);
  }
});

/* -----------------------
   FILTERING
------------------------ */
const filteredData = computed(() => {
  let items = data.value;

  if (wardFilter.value.trim())
    items = items.filter((i) =>
      i.ward_no.toLowerCase().includes(wardFilter.value.toLowerCase())
    );

  if (poleFilter.value.trim())
    items = items.filter((i) =>
      i.pole_no.toLowerCase().includes(poleFilter.value.toLowerCase())
    );

  if (wattFilter.value.trim())
    items = items.filter((i) =>
      i.watt.toLowerCase().includes(wattFilter.value.toLowerCase())
    );

  if (statusFilter.value !== "All")
    items = items.filter((i) => i.light_status === statusFilter.value);

  if (dateFilter.value)
    items = items.filter(
      (i) =>
        new Date(i.created_at).toISOString().split("T")[0] === dateFilter.value
    );

  if (resolutionStatusFilter.value === "Resolved") {
    items = items.filter((i) => i.resolve_image);
  } else if (resolutionStatusFilter.value === "Unresolved") {
    items = items.filter((i) => !i.resolve_image);
  }

  return items;
});

/* -----------------------
   PAGINATION
------------------------ */
const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredData.value.length / pageSize.value))
);

watch(totalPages, (n) => {
  if (currentPage.value > n) currentPage.value = n;
});

/* Reset page when filters change */
watch(
  [
    wardFilter,
    poleFilter,
    wattFilter,
    statusFilter,
    dateFilter,
    resolutionStatusFilter,
    activeCategory,
  ],
  () => {
    currentPage.value = 1;
  }
);

/* -----------------------
   SORTING
------------------------ */
const sortBy = ref<keyof Survey | null>(null);
const sortDir = ref<"asc" | "desc">("asc");

const paginatedData = computed(() => {
  let sorted = [...filteredData.value];

  if (sortBy.value) {
    sorted.sort((a, b) => {
      const av = a[sortBy.value!];
      const bv = b[sortBy.value!];

      if (typeof av === "number" && typeof bv === "number")
        return sortDir.value === "asc" ? av - bv : bv - av;

      if (typeof av === "string" && typeof bv === "string")
        return sortDir.value === "asc"
          ? av.localeCompare(bv)
          : bv.localeCompare(av);

      return 0;
    });
  }

  const start = (currentPage.value - 1) * pageSize.value;
  return sorted.slice(start, start + pageSize.value);
});

function renderSortableHeader(label: string, key: keyof Survey) {
  return h(
    "div",
    {
      class: "flex items-center justify-center gap-1 cursor-pointer",
      onClick: () => {
        if (sortBy.value === key) {
          sortDir.value = sortDir.value === "asc" ? "desc" : "asc";
        } else {
          sortBy.value = key;
          sortDir.value = "asc";
        }
      },
    },
    [
      label,
      sortBy.value === key
        ? h("span", { class: "text-xs" }, sortDir.value === "asc" ? "▲" : "▼")
        : h("span", { class: "text-xs text-gray-300" }, "⇅"),
    ]
  );
}

/* -----------------------
   TABLE COLUMNS
------------------------ */
const baseImageUrl = "https://ayodhya.water.live/api/survey_img_act/";
const baseImageUrl_thmb = "https://ayodhya.water.live/api/survey_img_100_100/";

const columns: ColumnDef<Survey>[] = [
  {
    accessorKey: "id",
    header: () => renderSortableHeader("ID", "id"),
    meta: { class: { th: "text-center", td: "text-center" } },
  },

  {
    accessorKey: "ward_no",
    header: () => renderSortableHeader("Ward No", "ward_no"),
    meta: { class: { th: "text-center", td: "text-center" } },
  },

  {
    accessorKey: "name",
    header: () => renderSortableHeader("Name", "name"),
    meta: { class: { th: "text-center", td: "text-center" } },
  },
  {
    accessorKey: "reference_by",
    header: "Reference By",
    // header: () => renderSortableHeader("Reference By", "reference_by"),
    meta: { class: { th: "text-center", td: "text-center" } },
  },
  {
    accessorKey: "pole_no",
    header: () => renderSortableHeader("Pole No", "pole_no"),
    meta: { class: { th: "text-center", td: "text-center" } },
  },

  // NEW CATEGORY COLUMN
  {
    accessorKey: "time_category",
    header: "Time Category",
    meta: { class: { th: "text-center", td: "text-center" } },
  },

  {
    accessorKey: "pole_no",
    header: () => renderSortableHeader("Pole No", "pole_no"),
    meta: { class: { th: "text-center", td: "text-center" } },
  },

  {
    accessorKey: "watt",
    header: () => renderSortableHeader("Watt", "watt"),
    meta: { class: { th: "text-center", td: "text-center" } },
  },

  {
    accessorKey: "image_path",
    header: "Before",
    cell: ({ row }) => {
      const img = row.getValue("image_path");
      const th = baseImageUrl_thmb + img;
      const full = baseImageUrl + img;

      return h("img", {
        src: th,
        class: "w-10 h-10 object-cover rounded cursor-pointer border",
        onClick: () => {
          modalImageUrl.value = full;
          showModal.value = true;
        },
      });
    },
  },

  {
    accessorKey: "resolve_image",
    header: "After Repair",
    cell: ({ row }) => {
      //   const img = row.getValue("resolve_image") as string | null;

      const imageFileName = row.getValue("resolve_image") as string;
      const imageUrl = baseImageUrl_thmb + imageFileName;
      const imageUrl_act = baseImageUrl + imageFileName;
      if (!imageUrl)
        return h(
          "div",
          { class: "flex justify-center" },
          h("span", { class: "text-gray-400" }, "No Image")
        );
      const url = baseImageUrl + imageUrl;
      return h(
        "div",
        { class: "flex justify-center" },
        h("img", {
          src: imageUrl,
          class: "w-10 h-10 object-cover rounded cursor-zoom-in border",
          loading: "lazy",
          onClick: () => {
            modalImageUrl.value = imageUrl_act;
            showModal.value = true;
          },
        })
      );
    },
    meta: { class: { th: "text-center" } },
  },

  {
    accessorKey: "light_status",
    header: "Light Status",
    cell: ({ row }) => {
      const s = row.getValue("light_status") as string;
      const color =
        s === "Working"
          ? "bg-emerald-50 text-emerald-600"
          : s === "Not Working"
          ? "bg-rose-50 text-rose-600"
          : "bg-gray-100 text-gray-600";
      return h(
        "span",
        { class: `px-2 py-1 rounded text-sm font-medium ${color}` },
        s
      );
    },
  },
  // {
  //   accessorKey: "resolved_status",
  //   header: "Resolved Status",
  //   cell: ({ row }) => {
  //     const beforeImg = row.original.image_path;
  //     const afterImg = row.original.resolve_image;
  //     //   const created_at = row.getValue("created_at");
  //     //   const resolve_date = row.getValue("resolve_date");
  //     //   console.log("created_at",created_at)
  //     //   console.log("resolve_date",resolve_date)
  //     const isResolved = beforeImg && afterImg;
  //     const label = isResolved ? "Resolved" : "Pending";
  //     const colorClass = isResolved
  //       ? "bg-emerald-50 text-emerald-600"
  //       : "bg-rose-50 text-rose-600";

  //     return h("span", {
  //       class: `px-2 py-1 rounded text-sm font-semibold ${colorClass}`,
  //       innerText: label,
  //     });
  //   },
  //   meta: { class: { th: "text-center", td: "text-center" } },
  // },

  {
    accessorKey: "resolved_status",
    header: "Resolved Status",
    cell: ({ row }) => {
      const beforeImg = row.original.image_path;
      const afterImg = row.original.resolve_image;
      const createdAt = row.original.created_at;
      const resolvedAt = row.original.resolve_date;

      const createdDate = new Date(createdAt);
      const resolvedDate = resolvedAt ? new Date(resolvedAt) : null;
      const endTime = resolvedDate || new Date();

      // Difference in milliseconds
      const diffMs = endTime - createdDate;

      // Time breakdown
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffMonths = Math.floor(diffDays / 30); // approximate month
      const diffHours = Math.floor(
        (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      // Build readable duration
      let durationText = "";
      if (diffMonths > 0) {
        durationText = `${diffMonths}m ${
          diffDays % 30
        }d ${diffHours}h ${diffMins}m`;
      } else if (diffDays > 0) {
        durationText = `${diffDays}d ${diffHours}h ${diffMins}m`;
      } else if (diffHours > 0) {
        durationText = `${diffHours}h ${diffMins}m`;
      } else if (diffMins > 0) {
        durationText = `${diffMins}m`;
      } else {
        durationText = "<1m";
      }

      // Determine status
      const isResolved = beforeImg && afterImg;
      const label = isResolved ? "Resolved" : "Unresolved";
      const colorClass = isResolved
        ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
        : "bg-rose-100 text-rose-700 border border-rose-200";

      // Tooltip for details
      const tooltipText = isResolved
        ? `Resolved at: ${resolvedDate.toLocaleString()}`
        : `Created at: ${createdDate.toLocaleString()}`;

      // Optional animated pulse for unresolved
      const pulseClass = !isResolved
        ? "animate-pulse ring-2 ring-rose-200"
        : "";

      // Build cell
      return h("div", { class: "flex flex-col items-center gap-1" }, [
        h(
          "div",
          {
            class: `flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-semibold transition-all ${colorClass} ${pulseClass}`,
            title: tooltipText,
          },
          [
            h("span", { innerText: label }),
            !isResolved &&
              h("span", {
                innerHTML: "🕒",
                class: "text-xs opacity-80",
              }),
          ].filter(Boolean)
        ),
        h("small", { class: "text-gray-500 text-xs italic" }, durationText),
      ]);
    },
    meta: { class: { th: "text-center", td: "text-center" } },
  },
  {
    accessorKey: "ref_complaint_date",
    header: () => "Complaint At",
    cell: ({ row }) => {
      const dateValue = row.getValue("ref_complaint_date");
      const created_at = row.getValue("created_at");

      if (!dateValue) {
        const date = new Date(created_at);
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");

        return `${day}/${month}/${year} ${hours}:${minutes}`;
      }

      const date = new Date(dateValue);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      // const hours = String(date.getHours()).padStart(2, "0");
      // const minutes = String(date.getMinutes()).padStart(2, "0");

      return `${day}/${month}/${year}`;
    },
    meta: { class: { th: "text-center", td: "text-center" } },
  },
  {
    accessorKey: "created_at",
    header: () => renderSortableHeader("Created At", "created_at"),
    cell: ({ row }) => {
      const dateValue = row.getValue("created_at");
      if (!dateValue) return "Awaiting";

      const date = new Date(dateValue);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");

      return `${day}/${month}/${year} ${hours}:${minutes}`;
    },
    meta: { class: { th: "text-center", td: "text-center" } },
  },
  {
    accessorKey: "resolve_date",
    header: () => renderSortableHeader("Resolve At", "resolve_at"),
    cell: ({ row }) => {
      const dateValue = row.getValue("resolve_date");
      if (!dateValue) return "N/A";

      const date = new Date(dateValue);
      // Format: DD/MM/YYYY HH:MM
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0"); // Month is 0-indexed
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");

      return `${day}/${month}/${year} ${hours}:${minutes}`;
    },
    meta: { class: { th: "text-center", td: "text-center" } },
  },
];

/* -----------------------
   OPTIONS FOR FILTER SELECTS
------------------------ */
const wardOptions = computed(() =>
  [...new Set(mergedData.value.map((i) => i.ward_no))].sort()
);

const wattOptions = computed(() =>
  [...new Set(mergedData.value.map((i) => i.watt))].sort()
);
</script>

<template>
  <div>
    <!-- Loading -->
    <div v-if="pending" class="flex justify-center items-center py-10">
      <div
        class="h-8 w-8 border-4 text-teal-600 border-t-transparent rounded-full animate-spin"
      ></div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="py-10 text-center text-red-500">
      Failed to load complaints.
    </div>

    <div v-else>
      <!-- CATEGORY BUTTONS -->
      <div class="flex flex-wrap gap-2 mb-4">
        <button
          @click="activeCategory = 'All'"
          :class="
            activeCategory === 'All' ? 'bg-teal-600 text-white' : 'bg-gray-200'
          "
          class="px-3 py-1 rounded cursor-pointer"
        >
          All
        </button>

        <button
          @click="activeCategory = '0-12'"
          :class="
            activeCategory === '0-12' ? 'bg-teal-600 text-white' : 'bg-gray-200'
          "
          class="px-3 py-1 rounded cursor-pointer"
        >
          0–12 Hours
        </button>

        <button
          @click="activeCategory = '12-24'"
          :class="
            activeCategory === '12-24'
              ? 'bg-teal-600 text-white'
              : 'bg-gray-200'
          "
          class="px-3 py-1 rounded cursor-pointer"
        >
          12–24 Hours
        </button>

        <button
          @click="activeCategory = '1-2'"
          :class="
            activeCategory === '1-2' ? 'bg-teal-600 text-white' : 'bg-gray-200'
          "
          class="px-3 py-1 rounded cursor-pointer"
        >
          1–2 Days
        </button>

        <button
          @click="activeCategory = '2-30'"
          :class="
            activeCategory === '2-30' ? 'bg-teal-600 text-white' : 'bg-gray-200'
          "
          class="px-3 py-1 rounded cursor-pointer"
        >
          2–30 Days
        </button>

        <button
          @click="activeCategory = '30+'"
          :class="
            activeCategory === '30+' ? 'bg-teal-600 text-white' : 'bg-gray-200'
          "
          class="px-3 py-1 rounded cursor-pointer"
        >
          30+ Days
        </button>
      </div>

      <!-- FILTERS -->

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
                  class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-3 filters-grid"
                >
                  <!-- Ward -->
                  <div class="flex flex-col">
                    <label
                      class="text-xs font-medium text-gray-700 flex items-center gap-1 mb-1"
                    >
                      <Icon
                        name="mdi:home-city-outline"
                        size="16"
                        class="text-emerald-600"
                      />
                      Ward
                    </label>
                    <select
                      v-model="wardFilter"
                      class="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400"
                    >
                      <option value="">All</option>
                      <option
                        v-for="ward in wardOptions"
                        :key="ward"
                        :value="ward"
                      >
                        {{ ward }}
                      </option>
                    </select>
                  </div>

                  <!-- Pole -->
                  <div class="flex flex-col">
                    <label
                      class="text-xs font-medium text-gray-700 flex items-center gap-1 mb-1"
                    >
                      <Icon
                        name="mdi:transmission-tower"
                        size="16"
                        class="text-blue-500"
                      />
                      Pole
                    </label>
                    <input
                      v-model="poleFilter"
                      type="text"
                      placeholder="Pole No."
                      class="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
                    />
                  </div>

                  <!-- Status -->
                  <div class="flex flex-col">
                    <label
                      class="text-xs font-medium text-gray-700 flex items-center gap-1 mb-1"
                    >
                      <Icon
                        name="mdi:check-decagram-outline"
                        size="16"
                        class="text-purple-500"
                      />
                      Status
                    </label>
                    <select
                      v-model="statusFilter"
                      class="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-1 focus:ring-purple-400 focus:border-purple-400"
                    >
                      <option value="All">All</option>
                      <option value="Working">Working</option>
                      <option value="Not Working">Not Working</option>
                      <option value="N/A">N/A</option>
                    </select>
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
                    <input
                      v-model="dateFilter"
                      type="date"
                      class="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-1 focus:ring-pink-400 focus:border-pink-400"
                    />
                  </div>
                </div>
              </UCard>
            </template>
          </UAccordion>
        </UCard>
      </div>

      <!-- TABLE CARD -->
      <UCard class="p-4 ring-2 border">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-sm font-medium">Resolved Complaint</h3>

          <div class="flex items-center gap-2">
            <span class="text-xs text-gray-600">Show</span>
            <select
              v-model.number="pageSize"
              class="border rounded px-2 py-1 text-sm"
            >
              <option v-for="s in pageSizeOptions" :value="s">{{ s }}</option>
            </select>
            <span class="text-xs text-gray-600">entries</span>
          </div>
        </div>

        <UTable :data="paginatedData" :columns="columns" />

        <!-- Pagination -->
        <div
          class="flex justify-between items-center mt-3 text-xs text-gray-500"
        >
          <span>
            Showing {{ paginatedData.length }} of
            {{ filteredData.length }} records — Page {{ currentPage }} of
            {{ totalPages }}
          </span>

          <UPagination
            v-model:page="currentPage"
            :items-per-page="pageSize"
            :total="filteredData.length"
          />
        </div>
      </UCard>

      <!-- IMAGE MODAL -->
      <UModal v-model:open="showModal">
        <template #body>
          <img :src="modalImageUrl" class="max-h-[75vh] rounded shadow" />
        </template>
      </UModal>
    </div>
  </div>
</template>

<style scoped>
button {
  transition: 0.2s;
}
</style>
