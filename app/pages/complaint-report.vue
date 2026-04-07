<script setup lang="ts">
import { ref, computed, watch, h } from "vue";
import { useToast } from "#imports";
import DateRangePicker from "~/components/Complaint/DateRangePicker.vue";
import { CalendarDate } from "@internationalized/date";

const toast = useToast();
const router = useRouter();

const currentPage = ref(1);
const pageSize = ref(10);
const pageSizeOptions = [5, 10, 20, 50, 100];

const selectedType = ref("all");
const projects = ref<any[]>([]);
const isLoading = ref(false);

const access_token = localStorage.getItem("access_token");

/* ------------------ Date Range ------------------ */
const range = ref<{ start: CalendarDate | null; end: CalendarDate | null }>({
  start: null,
  end: null,
});

function formatCalendarDate(date: CalendarDate) {
  return `${date.year}-${String(date.month).padStart(2, "0")}-${String(
    date.day,
  ).padStart(2, "0")}`;
}

const fromDate = computed(() =>
  range.value.start ? formatCalendarDate(range.value.start) : null,
);
const toDate = computed(() =>
  range.value.end ? formatCalendarDate(range.value.end) : null,
);

const isDateSelected = computed(() => !!(fromDate.value && toDate.value));

/* ------------------ API ------------------ */
const loadProjects = async () => {
  try {
    isLoading.value = true;

    const data: any = await $fetch(
      "https://ayodhya.water.live/api/surveyNew.php?action=get_common_dashboard_complains_report",
      {
        method: "POST",
        body: {
          accesskey: access_token,
          from_date: fromDate.value,
          to_date: toDate.value,
        },
      },
    );

    if (data.error === 1) {
      localStorage.removeItem("access_token");
      toast.add({
        title: "Access Denied",
        description: "Session expired. Please login again.",
        color: "red",
      });
      router.push("/login").then(() => location.reload());
      return;
    }

    projects.value = data.result.complaint_comon_list || [];
  } catch (err) {
    console.error(err);
  } finally {
    isLoading.value = false;
  }
};

/* ------------------ Watch Date ------------------ */
watch(
  () => range.value,
  (val) => {
    if (val.start && val.end) loadProjects();
  },
  { deep: true },
);

const resetDateFilter = () => {
  range.value = { start: null, end: null };
  projects.value = [];
};

/* ------------------ Filters ------------------ */
const projectTypes = computed(() => {
  const set = new Set(["all"]);
  projects.value.forEach((p) => set.add(p.project_type));
  return [...set].map((x) => ({ label: x.toUpperCase(), value: x }));
});

const filteredProjects = computed(() => {
  currentPage.value = 1;
  if (selectedType.value === "all") return projects.value;
  return projects.value.filter((p) => p.project_type === selectedType.value);
});

/* ------------------ Pagination ------------------ */
const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredProjects.value.length / pageSize.value)),
);

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredProjects.value.slice(start, start + pageSize.value);
});

/* ------------------ Columns ------------------ */
const columns = [
  //   { accessorKey: "id", header: "ID" },
  // { accessorKey: "ref_no", header: "Ref No" },
  { accessorKey: "project_type", header: "Project Type" },
  { accessorKey: "project_name", header: "Project Name" },
  { accessorKey: "electrician_name", header: "Electrician Name" },
  { accessorKey: "status", header: "Status" },
  {
    accessorKey: "time_taken_minutes",
    header: "Time Taken",
    cell: ({ row }) => {
      const minutes = Number(row.getValue("time_taken_minutes"));

      if (minutes === null || minutes === undefined || minutes === "") {
        return "Awaiting";
      }

      if (isNaN(minutes)) return "Invalid";

      const hrs = Math.floor(minutes / 60);
      const mins = Math.floor(minutes % 60);

      if (hrs === 0) return `${mins} min`;
      if (mins === 0) return `${hrs} hr`;
      return `${hrs} hr ${mins} min`;
    },
    meta: { class: { th: "text-center", td: "text-center" } },
  },

  { accessorKey: "created_type", header: "Created Type" },
  { accessorKey: "created_at", header: "Created At" },
  { accessorKey: "resolve_date", header: "Resolve Date" },
  { accessorKey: "problem", header: "Problem" },
  { accessorKey: "ward_no", header: "Ward No" },
  { accessorKey: "pole_no", header: "Pole No" },
  { accessorKey: "watt", header: "Watt" },
  { accessorKey: "light_status", header: "Light Status" },
  { accessorKey: "name", header: "Name" },
  { accessorKey: "mobile_no", header: "Mobile No" },
  { accessorKey: "address", header: "Address" },
  { accessorKey: "reference_by", header: "Reference By" },
];

console.log(columns);
/* ───────────── CSV EXPORT (CORRECT) ───────────── */

function exportCSV() {
  if (!filteredProjects.value.length) return;

  const baseImageUrl = "https://ayodhya.water.live/api/survey_img_act/";

  const headers = [
    "ref_no",
    "project_type",
    "project_name",
    "electrician_name",
    "status",
    "time_taken_minutes",
    "created_type",
    "created_at",
    "first_image_date",
    "department",
    "resolve_date",
    "problem",
    "ward_no",
    "pole_no",
    "watt",
    "image_path",
    "resolve_image",
    "lat",
    "lng",
    "resolve_lat",
    "resolve_lng",
    "light_status",
    "name",
    "mobile_no",
    "address",
    "reference_by",
  ];

  const rows = filteredProjects.value.map((item) =>
    headers.map((key) => {
      // ⭐️ Convert minutes into readable format
      if (key === "time_taken_minutes") {
        const minutes = Number(item[key]);

        if (minutes === null || minutes === undefined || minutes === "") {
          return "Awaiting";
        }

        if (isNaN(minutes)) return "Invalid";

        const hrs = Math.floor(minutes / 60);
        const mins = Math.floor(minutes % 60);

        if (hrs === 0) return `${mins} min`;
        if (mins === 0) return `${hrs} hr`;
        return `${hrs} hr ${mins} min`;
      }

      // ⭐️ Add base URL to image fields
      if (key === "image_path" || key === "resolve_image") {
        const img = item[key];
        if (!img) return "";

        // If already a full URL, return as is
        if (String(img).startsWith("http")) return String(img);

        return `${baseImageUrl}${String(img)}`;
      }

      const value = item[key];
      if (value === null || value === undefined) return "";

      return String(value).replace(/"/g, '""');
    }),
  );

  const csvContent =
    "data:text/csv;charset=utf-8," +
    [headers, ...rows]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");

  const link = document.createElement("a");
  link.href = encodeURI(csvContent);
  link.download = `complaint_report.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
</script>

<template>
  <div class="p-6 max-w-7xl mx-auto space-y-6">
    <!-- Header -->
    <div>
      <h2 class="text-lg font-semibold text-gray-800">Complaint Reports</h2>
      <p class="text-sm text-gray-400">
        Filter and analyze complaints using date range and project type
      </p>
    </div>

    <!-- Filters -->
    <div class="flex items-center gap-4">
      <USelect
        v-model="selectedType"
        :items="projectTypes"
        class="w-60"
        :disabled="isLoading || !isDateSelected"
        placeholder="Project type"
      />

      <div class="flex gap-3 items-center justify-end w-full">
        <DateRangePicker v-model="range" :disabled="isLoading" />
        <UButton
          v-if="isDateSelected"
          size="sm"
          variant="ghost"
          color="red"
          @click="resetDateFilter"
        >
          Reset dates
        </UButton>
        <UButton
          color="emerald"
          variant="solid"
          size="sm"
          class="flex items-center gap-2 px-3 py-1.5 cursor-pointer bg-teal-500"
          @click="exportCSV"
          title="Export CSV"
          :disabled="isLoading || !isDateSelected"
        >
          <Icon name="mdi:file-delimited-outline" size="18" />
          Export CSV
        </UButton>
      </div>
    </div>

    <!-- Card -->
    <UCard class="border shadow-sm">
      <!-- Empty -->
      <div
        v-if="!isDateSelected"
        class="flex flex-col items-center justify-center py-20 text-center"
      >
        <div
          class="w-14 h-14 flex items-center justify-center rounded-full bg-primary-50 text-primary-500 mb-4"
        >
          <Icon name="mdi:calendar-range" size="28" />
        </div>
        <h3 class="font-semibold text-gray-700">Select a Date Range</h3>
        <p class="text-sm text-gray-400 mt-1 max-w-xs">
          Choose a start and end date to view complaint reports.
        </p>
      </div>

      <!-- Loading -->
      <div v-else-if="isLoading" class="relative min-h-[300px]">
        <div
          class="absolute inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm"
        >
          <ULoader size="lg" />
          <p class="text-sm text-gray-500 mt-2">Loading reports…</p>
        </div>
      </div>

      <!-- Table -->
      <div v-else class="animate-fade-in">
        <UTable :data="paginatedData" :columns="columns" />

        <div
          v-if="filteredProjects.length"
          class="flex justify-between items-center mt-4"
        >
          <span class="text-xs text-gray-500">
            Showing {{ paginatedData.length }} of
            {{ filteredProjects.length }} records — Page {{ currentPage }} of
            {{ totalPages }}
          </span>

          <UPagination
            v-model:page="currentPage"
            :total="filteredProjects.length"
            :items-per-page="pageSize"
          />
        </div>
      </div>
    </UCard>
  </div>
</template>

<style>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fade-in {
  animation: fadeIn 0.25s ease-out;
}
</style>
