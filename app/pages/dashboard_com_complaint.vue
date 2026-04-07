<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { useToast } from "#imports";
import DateRangePicker from "~/components/Complaint/DateRangePicker.vue";
import { CalendarDate } from "@internationalized/date";
const config = useRuntimeConfig();

const activeTab = ref("projects");
const selectedType = ref("all");
const projects = ref([]);
const report = ref({
  led: { "24_hours": 0, "7_Days": 0, "30_Days": 0 },
  ccms: { "24_hours": 0, "7_Days": 0, "30_Days": 0 },
});

const access_token = localStorage.getItem("access_token");
const hoveredStat = ref("");
const toast = useToast();
const router = useRouter();

const range = ref<{
  start: CalendarDate | null;
  end: CalendarDate | null;
}>({
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

const navigateToProjectDetails = (projectId, status) => {
  router.push({
    path: `/${status}`,
    query: { projectId },
  });
};

// Tabs
const tabs = [
  { label: "Projects", value: "projects" },
  { label: "Complaints", value: "complaints" },
  { label: "Surveys", value: "surveys" },
];

// Load Projects API
const loadProjects = async (date = "") => {
  try {
    const data = await $fetch(
      `${config.public.apiBase}/surveyNew.php?action=get_common_dashboard_complains`,
      {
        method: "POST",
        body: {
          accesskey: access_token,
          from_date: fromDate.value,
          to_date: toDate.value,
        },
      },
    );

    projects.value = data.result.complaint_comon_list;
    report.value = data.result.complaint_common_report;

    if (data.error === 1) {
      localStorage.removeItem("access_token");
      toast.add({
        title: "Access Denied",
        description: "Your session has expired. Please login again.",
        color: "red",
      });
      router.push("/login").then(() => window.location.reload());
      return;
    }
  } catch (error) {
    console.error(error);
  }
};

onMounted(async () => {
  await loadProjects();
  const interval = setInterval(() => loadProjects(), 300000);
  onBeforeUnmount(() => clearInterval(interval));
});

// Filters
const projectTypes = computed(() => {
  const set = new Set(["all"]);
  projects.value.forEach((p) => set.add(p.project_type));
  return [...set].map((x) => ({ label: x.toUpperCase(), value: x }));
});

const filteredProjects = computed(() => {
  if (selectedType.value === "all") return projects.value;
  return projects.value.filter((p) => p.project_type === selectedType.value);
});

// Colors
const typeColor = (type) => {
  switch (type.toLowerCase()) {
    case "led":
      return "yellow";
    case "ccms":
      return "blue";
    case "testing":
      return "purple";
    default:
      return "gray";
  }
};

// const applyDateFilter = () => {
//   if (!fromDate.value || !toDate.value) {
//     toast.add({
//       title: "Invalid Date Range",
//       description: "Please select both start and end dates.",
//       color: "warning",
//     });
//     return;
//   }
//   loadProjects(fromDate.value);
// };

const resetDateFilter = () => {
  range.value = { start: null, end: null };
  loadProjects("");
};

function viewProjectDetails(projectId) {
  router.push({
    path: `/dashboard`,
    query: { projectId },
  });
}
watch(
  () => range.value,
  (newRange) => {
    if (newRange.start || newRange.end) {
      loadProjects();
    }
  },
  { deep: true },
);
</script>

<template>
  <div class="p-6 max-w-7xl mx-auto space-y-8">
    <div class="w-full space-y-6">
      <div
        class="bg-white/90 backdrop-blur shadow-xl rounded-2xl p-6 border border-gray-100 w-full transition-all hover:shadow-2xl"
      >
        <div class="mb-6">
          <h2
            class="text-lg font-semibold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent flex items-center gap-2"
          >
            🚦 Pending Complaints Summary
          </h2>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
          <div
            class="relative overflow-hidden border rounded-xl p-5 bg-gradient-to-br from-yellow-50 to-orange-50 shadow-sm hover:shadow-md transition-all"
          >
            <div
              class="absolute -top-6 -right-6 w-32 h-32 bg-yellow-200 rounded-full blur-3xl opacity-40"
            ></div>

            <h3
              class="font-bold text-yellow-700 text-md mb-4 flex items-center gap-2"
            >
              💡 Pending LED Complaints
            </h3>

            <div
              class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm"
            >
              <div
                class="bg-white rounded-lg p-3 shadow-sm hover:scale-105 transition"
              >
                <p class="text-gray-500 text-xs">24 Hours</p>
                <p class="text-xl font-bold text-gray-800">
                  {{ report.led["24_hours"] }}
                </p>
              </div>

              <div
                class="bg-white rounded-lg p-3 shadow-sm hover:scale-105 transition"
              >
                <p class="text-gray-500 text-xs">24H – 7 Days</p>
                <p class="text-xl font-bold text-gray-800">
                  {{ report.led["7_Days"] }}
                </p>
              </div>

              <div
                class="bg-white rounded-lg p-3 shadow-sm hover:scale-105 transition"
              >
                <p class="text-gray-500 text-xs">7 – 30 Days</p>
                <p class="text-xl font-bold text-gray-800">
                  {{ report.led["30_Days"] }}
                </p>
              </div>

              <div
                class="bg-white rounded-lg p-3 shadow-sm hover:scale-105 transition"
              >
                <p class="text-gray-500 text-xs">30+ Days</p>
                <p class="text-xl font-bold text-red-600">
                  {{ report.led["above30_Days"] }}
                </p>
              </div>
            </div>
          </div>

          <div
            class="relative overflow-hidden border rounded-xl p-5 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-sm hover:shadow-md transition-all"
          >
            <div
              class="absolute -top-6 -right-6 w-32 h-32 bg-blue-200 rounded-full blur-3xl opacity-40"
            ></div>

            <h3
              class="font-bold text-blue-700 text-md mb-4 flex items-center gap-2"
            >
              🖥️ Pending CCMS Complaints
            </h3>

            <div
              class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm"
            >
              <div
                class="bg-white rounded-lg p-3 shadow-sm hover:scale-105 transition"
              >
                <p class="text-gray-500 text-xs">24 Hours</p>
                <p class="text-xl font-bold text-gray-800">
                  {{ report.ccms["24_hours"] }}
                </p>
              </div>

              <div
                class="bg-white rounded-lg p-3 shadow-sm hover:scale-105 transition"
              >
                <p class="text-gray-500 text-xs">24H – 7 Days</p>
                <p class="text-xl font-bold text-gray-800">
                  {{ report.ccms["7_Days"] }}
                </p>
              </div>

              <div
                class="bg-white rounded-lg p-3 shadow-sm hover:scale-105 transition"
              >
                <p class="text-gray-500 text-xs">7 – 30 Days</p>
                <p class="text-xl font-bold text-gray-800">
                  {{ report.ccms["30_Days"] }}
                </p>
              </div>

              <div
                class="bg-white rounded-lg p-3 shadow-sm hover:scale-105 transition"
              >
                <p class="text-gray-500 text-xs">30+ Days</p>
                <p class="text-xl font-bold text-red-600">
                  {{ report.ccms["above30_Days"] }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <UTabs v-model="activeTab" :tabs="tabs" />

    <div v-if="activeTab === 'projects'" class="space-y-5">
      <div class="flex items-center gap-4">
        <div class="w-60">
          <USelect
            v-model="selectedType"
            :items="projectTypes"
            placeholder="Filter by project type"
          />
        </div>

        <div class="flex gap-3 items-center justify-end w-full">
          <DateRangePicker v-model="range" />

          <!-- <UButton
            :disabled="!fromDate"
            @click="applyDateFilter"
            color="primary"
          >
            Apply
          </UButton> -->

          <UButton
            v-if="fromDate"
            color="red"
            variant="soft"
            @click="resetDateFilter"
          >
            Reset
          </UButton>
        </div>
      </div>

      <div
        v-if="filteredProjects.length"
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6"
      >
        <UCard
          v-for="p in filteredProjects"
          :key="p.project_id"
          class="relative overflow-hidden border rounded-xl p-4 shadow-sm hover:shadow-md bg-white transition-all hover:scale-[1.02]"
        >
          <div
            class="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-sky-200 to-indigo-200"
          ></div>

          <div class="space-y-3 pt-2">
            <h3 class="text-base font-semibold text-gray-900 leading-tight">
              {{ p.project_name }}
            </h3>
            <UBadge
              :color="typeColor(p.project_type)"
              variant="soft"
              class="uppercase text-xs tracking-wide flex items-center gap-1"
            >
              {{ p.project_type }} • {{ Number(p.total_led).toLocaleString() }}
            </UBadge>
            <div class="pt-2 text-sm space-y-2">
              <div
                class="flex justify-between border-b pb-1 text-gray-700"
                @mouseover="hoveredStat = 'total'"
                @mouseleave="hoveredStat = ''"
              >
                <span
                  class="cursor-pointer transition-all duration-300"
                  :class="
                    hoveredStat === 'total' ? 'text-blue-500 scale-110' : ''
                  "
                  @click="navigateToProjectDetails(p.project_id, 'complaints')"
                >
                  Total
                </span>
                <b>{{ p.total }}</b>
              </div>
              <div
                class="flex justify-between border-b pb-1 text-green-600"
                @mouseover="hoveredStat = 'resolved'"
                @mouseleave="hoveredStat = ''"
              >
                <span
                  class="cursor-pointer transition-all duration-300"
                  :class="
                    hoveredStat === 'resolved' ? 'text-green-500 scale-110' : ''
                  "
                  @click="
                    navigateToProjectDetails(
                      p.project_id,
                      'complaints/resolved',
                    )
                  "
                >
                  Resolved
                </span>
                <b>{{ p.resolve }}</b>
              </div>

              <div
                class="flex justify-between text-red-500"
                @mouseover="hoveredStat = 'pending'"
                @mouseleave="hoveredStat = ''"
              >
                <span
                  class="cursor-pointer transition-all duration-300"
                  :class="
                    hoveredStat === 'pending' ? 'text-red-500 scale-110' : ''
                  "
                  @click="
                    navigateToProjectDetails(p.project_id, 'complaints/pending')
                  "
                >
                  Pending
                </span>
                <b>{{ p.unresolve }}</b>
              </div>
            </div>
            <div class="pt-4 text-center">
              <UButton
                color="primary"
                size="sm"
                @click="viewProjectDetails(p.project_id)"
              >
                More Details
              </UButton>
            </div>
          </div>
        </UCard>
      </div>
      <div v-else class="text-center text-gray-400 py-10">
        No projects found for selected filter.
      </div>
    </div>
    <div v-if="activeTab === 'complaints'">
      <UAlert color="info">Complaints API not connected yet.</UAlert>
    </div>
    <div v-if="activeTab === 'surveys'">
      <UAlert color="info">Surveys API not connected yet.</UAlert>
    </div>
  </div>
</template>
