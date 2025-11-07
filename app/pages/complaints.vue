<script setup lang="ts">
import { ref, computed, h, watch, onMounted } from "vue";
import type { ColumnDef } from "@tanstack/vue-table";

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
  mobile_no:number | null;
  is_active: number;
  created_at: string;
  resolve_at: string;
  updated_at: string | null;
  resolve_image?: string | null;
  electrician?: number | null;
}

const currentPage = ref(1);
const pageSize = ref(10);
const pageSizeOptions = [5, 10, 20, 50, 100];

// Filters
const wardFilter = ref("");
const poleFilter = ref("");
const wattFilter = ref("");
const statusFilter = ref<"All" | "Working" | "Not Working" | "N/A">("All");
const dateFilter = ref("");

// Modals
const showModal = ref(false);
const modalImageUrl = ref("");
const showEditModal = ref(false);
const editForm = ref<{
  id: number;
  pole_no: string;
  electrician?: number | null;
}>({
  id: 0,
  pole_no: "",
  electrician: null,
});
// console.log("editForm", editForm);

// Electricians list
const electricians = ref<{ label: string; value: number }[]>([]);
// console.log("electricians", electricians);

// Token
const token = localStorage.getItem("access_token");
const accesskey = token;

// Fetch surveys
const {
  data: complaintData,
  pending,
  error,
  refresh,
} = await useAsyncData<{ error: number; result: Survey[] }>(
  "complaints",
  () =>
    $fetch(
      `https://ayodhya.water.live/api/surveyNew.php?action=get_complaint`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: { accesskey },
      }
    ),

  { lazy: true }
);

// Fetch electricians
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

// Reactive main data array
const data = computed(() => complaintData?.value?.result ?? []);


// console.log("data",data);

const resolutionStatusFilter = ref<"All" | "Resolved" | "Unresolved">("All");
// Filtered data
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
  // ✅ New Resolution Filter
  if (resolutionStatusFilter.value === "Resolved") {
    items = items.filter((i) => i.image_path && i.resolve_image);
  } else if (resolutionStatusFilter.value === "Unresolved") {
    items = items.filter((i) => !i.image_path || !i.resolve_image);
  }
  return items;
});

// Summary counts
// const totalComplaints = computed(() => data.value.length);
// const solvedComplaints = computed(() => data.value.filter((i) => i.light_status === "Working").length);
// const unsolvedComplaints = computed(() => data.value.filter((i) => i.light_status === "Not Working").length);

const totalComplaints = computed(() => filteredData.value.length);

const resolvedComplaints = computed(
  () => filteredData.value.filter((i) => i.image_path && i.resolve_image).length
);

const unresolvedComplaints = computed(
  () =>
    filteredData.value.filter((i) => !i.image_path || !i.resolve_image).length
);

// Pagination
const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredData.value.length / pageSize.value))
);
watch(totalPages, (newTotal) => {
  if (currentPage.value > newTotal) currentPage.value = newTotal;
});
// Watch filters and reset to first page when they change
watch(
  [wardFilter, poleFilter, wattFilter, statusFilter, dateFilter, resolutionStatusFilter],
  () => {
    currentPage.value = 1; // reset pagination
  }
);

// Sorting
const sortBy = ref<keyof Survey | null>(null);
const sortDir = ref<"asc" | "desc">("asc");

const paginatedData = computed(() => {
  let sorted = [...filteredData.value];
  if (sortBy.value) {
    sorted.sort((a, b) => {
      const aVal = a[sortBy.value!];
      const bVal = b[sortBy.value!];
      if (typeof aVal === "number" && typeof bVal === "number")
        return sortDir.value === "asc" ? aVal - bVal : bVal - aVal;
      if (typeof aVal === "string" && typeof bVal === "string")
        return sortDir.value === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
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
      class:
        "flex items-center justify-center gap-1 cursor-pointer select-none",
      onClick: () => {
        if (sortBy.value === key)
          sortDir.value = sortDir.value === "asc" ? "desc" : "asc";
        else {
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
    header: "Before Repair",
    cell: ({ row }) => {
      const imageFileName = row.getValue("image_path") as string;
      const imageUrl = baseImageUrl_thmb + imageFileName;
      const imageUrl_act = baseImageUrl + imageFileName;
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
    accessorKey: "resolve_image",
    header: "After Repair",
    cell: ({ row }) => {
      const img = row.getValue("resolve_image") as string | null;
      if (!img)
        return h(
          "div",
          { class: "flex justify-center" },
          h("span", { class: "text-gray-400" }, "No Image")
        );
      const url = baseImageUrl + img;
      return h(
        "div",
        { class: "flex justify-center" },
        h("img", {
          src: url,
          class: "w-10 h-10 object-cover rounded cursor-zoom-in border",
          loading: "lazy",
          onClick: () => {
            modalImageUrl.value = url;
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
  {
    accessorKey: "electrician_id",
    header: "Assign to",
    cell: ({ row }) => {
      const electricianId = Number(row.original.electrician_id);
      const electrician = electricians.value.find(
        (e) => e.value === electricianId
      );
      return electrician?.label || "-";
    },
    meta: { class: { th: "text-center", td: "text-center" } },
  },
    {
      accessorKey: "resolved_status",
      header: "Resolved Status",
      cell: ({ row }) => {
        const beforeImg = row.original.image_path;
        const afterImg = row.original.resolve_image;
  	//   const created_at = row.getValue("created_at");
  	//   const resolve_date = row.getValue("resolve_date");
  	//   console.log("created_at",created_at)
  	//   console.log("resolve_date",resolve_date)
        const isResolved = beforeImg && afterImg;
        const label = isResolved ? "Resolved" : "Unresolved";
        const colorClass = isResolved
          ? "bg-emerald-50 text-emerald-600"
          : "bg-rose-50 text-rose-600";

        return h("span", {
          class: `px-2 py-1 rounded text-sm font-semibold ${colorClass}`,
          innerText: label,
        });
      },
      meta: { class: { th: "text-center", td: "text-center" } },
    },

//   {
//   accessorKey: "resolved_status",
//   header: "Resolved Status",
//   cell: ({ row }) => {
//     const beforeImg = row.original.image_path;
//     const afterImg = row.original.resolve_image;
//     const createdAt = row.original.created_at;
//     const resolvedAt = row.original.resolve_date;

//     const createdDate = new Date(createdAt);
//     const resolvedDate = resolvedAt ? new Date(resolvedAt) : null;
//     const endTime = resolvedDate || new Date();

//     // Difference in milliseconds
//     const diffMs = endTime - createdDate;

//     // Time breakdown
//     const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
//     const diffMonths = Math.floor(diffDays / 30); // approximate month
//     const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
//     const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

//     // Build readable duration
//     let durationText = "";
//     if (diffMonths > 0) {
//       durationText = `${diffMonths}m ${diffDays % 30}d ${diffHours}h ${diffMins}m`;
//     } else if (diffDays > 0) {
//       durationText = `${diffDays}d ${diffHours}h ${diffMins}m`;
//     } else if (diffHours > 0) {
//       durationText = `${diffHours}h ${diffMins}m`;
//     } else if (diffMins > 0) {
//       durationText = `${diffMins}m`;
//     } else {
//       durationText = "<1m";
//     }

//     // Determine status
//     const isResolved = beforeImg && afterImg;
//     const label = isResolved ? "Resolved" : "Unresolved";
//     const colorClass = isResolved
//       ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
//       : "bg-rose-100 text-rose-700 border border-rose-200";

//     // Tooltip for details
//     const tooltipText = isResolved
//       ? `Resolved at: ${resolvedDate.toLocaleString()}`
//       : `Created at: ${createdDate.toLocaleString()}`;

//     // Optional animated pulse for unresolved
//     const pulseClass = !isResolved ? "animate-pulse ring-2 ring-rose-200" : "";

//     // Build cell
//     return h("div", { class: "flex flex-col items-center gap-1" }, [
//       h(
//         "div",
//         {
//           class: `flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-semibold transition-all ${colorClass} ${pulseClass}`,
//           title: tooltipText,
//         },
//         [
//           h("span", { innerText: label }),
//           !isResolved &&
//             h("span", {
//               innerHTML: "🕒",
//               class: "text-xs opacity-80",
//             }),
//         ].filter(Boolean)
//       ),
//       h(
//         "small",
//         { class: "text-gray-500 text-xs italic" },
//         durationText
//       ),
//     ]);
//   },
//   meta: { class: { th: "text-center", td: "text-center" } },
// },


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
  // **Actions Column**
  {
    accessorKey: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const rowData = row.original;
      const isResolved = !!rowData.resolve_date; // true if resolved

      return h(
        "button",
        {
          class: [
            "px-2 py-1 text-xs rounded text-white",
            isResolved
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-teal-500 hover:bg-teal-600 cursor-pointer",
          ],
          onClick: () => {
            if (!isResolved) {
              editForm.value = {
                id: rowData.id,
                pole_no: rowData.pole_no,
                electrician: rowData.electrician_id || null,
              };
              showEditModal.value = true;
            }
          },
          disabled: isResolved, // disables button if resolved
        },
        "Assign"
      );
    },
    meta: { class: { th: "text-center", td: "text-center" } },
  },
];

function exportCSV() {
  const headers = [
    "ID",
    "Ward No",
    "Pole No",
    "Watt",
    "Latitude",
    "Longitude",
    "Light Status",
    "Message",
	"Mobile no",
	"Name",
    "Created At",
    "Resolved At",
    "Before Image URL",
    "After Image URL",
    "Electrician",
  ];

  // 👇 Base image URL you're using elsewhere
  const baseImgPath = "https://ayodhya.water.live/api/survey_img_act/";
  const rows = filteredData.value.map((item) => {
	// console.log("item",item)
    const createdAt = new Date(item.created_at).toLocaleString();
    const resolveAt = item.updated_at
      ? new Date(item.updated_at).toLocaleString()
      : "N/A";
    const electricianName =
      electricians.value.find((e) => e.value === item.electrician_id)?.label ||
      "-";

    return [
      item.id,
      item.ward_no,
      item.pole_no,
      item.watt,
      item.lat,
      item.lng,
      item.light_status,
      item.message || "-",
	  item.mobile_no,
	  item.name,
      createdAt,
      resolveAt,
      item.image_path ? baseImgPath + item.image_path : "",
      item.resolve_image ? baseImgPath + item.resolve_image : "",
      electricianName,
    ];
  });

  const csvContent =
    "data:text/csv;charset=utf-8," +
    [headers, ...rows]
      .map((row) =>
        row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

  const link = document.createElement("a");
  link.setAttribute("href", encodeURI(csvContent));
  link.setAttribute("download", "complaint_records.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Edit submit function
import { useToast } from "#imports";

const toast = useToast();

async function submitEdit() {
  try {
    await $fetch(
      "https://ayodhya.water.live/api/surveyNew.php?action=Update_ComplaintApp",
      {
        method: "POST",
        body: {
          accesskey,
          req_from: "web",
          complaint_id: editForm.value.id,
          poleNo: editForm.value.pole_no,
          electrician_id: editForm.value.electrician,
        },
      }
    );

    // Update local data
    const idx = data.value.findIndex((c) => c.id === editForm.value.id);
    if (idx !== -1) {
      data.value[idx].pole_no = editForm.value.pole_no;
      data.value[idx].user_id = editForm.value.electrician; // ensure consistent field
    }

    // ✅ Refresh complaints from API
    // await refresh();
    showEditModal.value = false;
    // ✅ Success toast
    toast.add({
      title: "Complaint Updated",
      description: `Pole #${editForm.value.pole_no} updated successfully.`,
      color: "green",
    });
    await refresh();
  } catch (err) {
    console.error(err);
    // ❌ Error toast
    toast.add({
      title: "Update Failed",
      description: "Something went wrong while updating the complaint.",
      color: "red",
    });
  }
}

// Filters options
const wardOptions = computed(() =>
  [...new Set(data.value.map((i) => i.ward_no))].sort()
);
const wattOptions = computed(() =>
  [...new Set(data.value.map((i) => i.watt))].sort()
);
</script>

<template>
  <div>
    <!-- Loading & Error States -->
    <div v-if="pending" class="flex justify-center items-center py-10">
      <div
        class="h-8 w-8 border-4 text-teal-600 border-t-transparent rounded-full animate-spin"
      ></div>
    </div>
    <div v-else-if="error" class="text-center py-10 text-red-500">
      Failed to load complaints.
    </div>
    <div v-else>
      <!-- Summary Cards (Total, Solved, Unsolved) -->
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4 light">
        <UCard
          class="rounded-lg shadow-sm flex flex-col justify-between h-full ring-2 border"
        >
          <div class="flex items-center justify-between">
            <Icon
              name="mdi:clipboard-text-outline"
              size="22"
              class="text-blue-500"
            />
            <div class="text-right">
              <div class="text-xs font-medium text-gray-500">
                Total Complaints
              </div>
              <div class="text-lg font-bold text-blue-700">
                {{ totalComplaints }}
              </div>
            </div>
          </div>
        </UCard>
        <UCard
          class="rounded-lg shadow-sm flex flex-col justify-between h-full ring-2 border"
        >
          <div class="flex items-center justify-between">
            <Icon
              name="mdi:check-circle-outline"
              size="22"
              class="text-emerald-600"
            />
            <div class="text-right">
              <div class="text-xs font-medium text-gray-500">ReSolved</div>
              <div class="text-lg font-bold text-emerald-700">
                <!-- {{ solvedComplaints }} -->
                {{ resolvedComplaints }}
              </div>
            </div>
          </div>
        </UCard>
        <UCard
          class="rounded-lg shadow-sm flex flex-col justify-between h-full ring-2 border"
        >
          <div class="flex items-center justify-between">
            <Icon
              name="mdi:alert-circle-outline"
              size="22"
              class="text-rose-600"
            />
            <div class="text-right">
              <div class="text-xs font-medium text-gray-500">Unsolved</div>
              <div class="text-lg font-bold text-rose-700">
                <!-- {{ unsolvedComplaints }} -->
                {{ unresolvedComplaints }}
              </div>
            </div>
          </div>
        </UCard>
      </div>
      <!-- Filters and Table go here (same as your template) -->
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

                  <!-- Watt -->
                  <!-- <div class="flex flex-col">
										<label class="text-xs font-medium text-gray-700 flex items-center gap-1 mb-1">
											<Icon name="mdi:flash-outline" size="16" class="text-amber-500" />
											Watt
										</label>
										<select
											v-model="wattFilter"
											class="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-1 focus:ring-amber-400 focus:border-amber-400"
										>
											<option value="">All</option>
											<option v-for="watt in wattOptions" :key="watt" :value="watt">
												{{ watt }}
											</option>
										</select>
									</div> -->

                  <!-- Resolution Status -->
                  <div class="flex flex-col">
                    <label
                      class="text-xs font-medium text-gray-700 flex items-center gap-1 mb-1"
                    >
                      <Icon
                        name="mdi:image-outline"
                        size="16"
                        class="text-indigo-500"
                      />
                      Resolved
                    </label>
                    <select
                      v-model="resolutionStatusFilter"
                      class="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400"
                    >
                      <option value="All">All</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Unresolved">Unresolved</option>
                    </select>
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
      <!-- Filters & Table -->
      <UCard class="w-full p-4 ring-2 mb-10 border shadow-sm light">
        <div class="flex justify-between items-center mb-2">
          <h3 class="text-sm font-medium text-gray-700">Complaints Records</h3>

          <!-- Export Buttons as Small Icons -->
          <div class="flex gap-2">
            <!-- Page Select -->
            <div
              class="flex items-center gap-2 text-sm text-gray-700 px-5 py-1"
            >
              <span>Show</span>
              <select
                v-model.number="pageSize"
                class="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400"
              >
                <option
                  v-for="size in pageSizeOptions"
                  :key="size"
                  :value="size"
                >
                  {{ size }}
                </option>
              </select>
              <span>entries</span>
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
        <UTable :data="paginatedData" :columns="columns" class="w-full" />

        <div class="flex items-center justify-between mt-3">
          <span class="text-xs text-gray-500">
            Showing <strong>{{ paginatedData.length }}</strong> of
            <strong>{{ filteredData.length }}</strong> records — Page
            <strong>{{ currentPage }}</strong> of
            <strong>{{ totalPages }}</strong>
          </span>
          <div class="custom-pagination">
            <UPagination
              v-model:page="currentPage"
              :total="filteredData.length"
              :items-per-page="pageSize"
            />
          </div>
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

            <USelect
              v-model="editForm.electrician"
              :items="electricians"
              label="Assign Electrician"
              placeholder="Select electrician"
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
