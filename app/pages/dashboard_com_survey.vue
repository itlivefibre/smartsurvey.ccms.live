<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
// import { useToast } from "#imports";
import DateRangePicker from "~/components/Complaint/DateRangePicker.vue";

// State Management
const activeTab = ref("projects");
// const fromDate = ref("");
const selectedType = ref("all");
const projects = ref([]);
const access_token = localStorage.getItem("access_token");
const hoveredStat = ref(""); // New state to track hovered stat

// Today's date in YYYY-MM-DD format
const today = new Date().toISOString().split("T")[0];
import { useToast } from "#imports";

const toast = useToast();

// Router Setup
const router = useRouter();

/* =========================================================
   DATE RANGE STATE
========================================================= */
const range = ref<{
  start: CalendarDate | null;
  end: CalendarDate | null;
}>({
  start: null,
  end: null,
});

/* =========================================================
   DATE FORMAT HELPERS
========================================================= */
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
    path: `/${status}`, // Dynamic path based on the status
    query: { projectId },
  });
};

// Tabs Setup
const tabs = [
  { label: "Projects", value: "projects" },
  { label: "Complaints", value: "complaints" },
  { label: "Surveys", value: "surveys" },
];

// Fetch API
onMounted(async () => {
  try {
    const data = await $fetch(
      "https://ayodhya.water.live/api/surveyNew.php?action=get_common_dashboard_survay",
      {
        method: "POST",
        body: {
          accesskey: access_token,
          // from_date: "",
          from_date: fromDate.value,
          to_date: toDate.value,
        }, // Empty date initially
      },
    );

    // projects.value = data.result.map((p) => ({
    //   ...p,
    //   project_type: p.project_type.toLowerCase(),
    // }));

    // Ensure data.result is an array before calling .map()
    if (Array.isArray(data.result)) {
      projects.value = data.result.map((p) => ({
        ...p,
        project_type: p.project_type.toLowerCase(),
      }));
    } else {
      console.error("API response did not return an array:", data.result);
      // Fallback: Set an empty array to avoid the map error
      projects.value = [];
    }

    // ✅ Handle access denied
    if (data.error === 1) {
      localStorage.removeItem("access_token");
      toast.add({
        title: "Access Denied",
        description: "Your session has expired. Please login again.",
        color: "red",
      });
      router.push("/login").then(() => {
        window.location.reload();
      });
      return { error: 1, result: [] }; // return empty data
    }

    return data;
  } catch (error) {
    console.error(error);
  }
});

// Dropdown Options
const projectTypes = computed(() => {
  const set = new Set(["all"]);
  projects.value.forEach((p) => set.add(p.project_type));
  return [...set].map((x) => ({ label: x.toUpperCase(), value: x }));
});

// Filter Logic
const filteredProjects = computed(() => {
  if (selectedType.value === "all") return projects.value;
  return projects.value.filter((p) => p.project_type === selectedType.value);
});

// Type Color Logic
const typeColor = (type) => {
  switch (type.toLowerCase()) {
    case "led":
      return "yellow"; // light pastel yellow
    case "ccms":
      return "blue"; // soft blue
    case "testing":
      return "purple"; // soft lavender
    default:
      return "gray";
  }
};

// Apply Date Filter
// Load Projects (Reusable function)
const loadProjects = async (date = "") => {
  try {
    const data = await $fetch(
      "https://ayodhya.water.live/api/surveyNew.php?action=get_common_dashboard_survay",
      {
        method: "POST",
        body: { accesskey: access_token, from_date: date },
      },
    );

    // projects.value = data.result.map((p) => ({
    //   ...p,
    //   project_type: p.project_type.toLowerCase(),
    // }));

    // Ensure data.result is an array before calling .map()
    if (Array.isArray(data.result)) {
      projects.value = data.result.map((p) => ({
        ...p,
        project_type: p.project_type.toLowerCase(),
      }));
    } else {
      console.error("API response did not return an array:", data.result);
      // Fallback: Set an empty array to avoid the map error
      projects.value = [];
    }
    // ✅ Handle access denied
    if (data.error === 1) {
      localStorage.removeItem("access_token");
      toast.add({
        title: "Access Denied",
        description: "Your session has expired. Please login again.",
        color: "red",
      });
      router.push("/login").then(() => {
        window.location.reload();
      });
      return { error: 1, result: [] }; // return empty data
    }
  } catch (error) {
    console.error(error);
  }
};

// Call API on mount
// onMounted(() => loadProjects());

// Fetch data on mount
onMounted(async () => {
  await loadProjects();

  // Set interval to call the main API every 5 minutes (300,000ms)
  const interval = setInterval(() => {
    loadProjects(); // Call the API
  }, 300000); // 5 minutes in milliseconds

  // Clear interval on unmount
  onBeforeUnmount(() => {
    clearInterval(interval); // Clean up when the component is destroyed
  });
});

// Apply date filter
// const applyDateFilter = () => {
//   loadProjects(fromDate.value);
// };
const applyDateFilter = () => {
  if (!fromDate.value || !toDate.value) {
    toast.add({
      title: "Invalid Date Range",
      description: "Please select both start and end dates.",
      color: "warning",
    });
    return;
  }
  loadProjects(fromDate.value); // Call with fromDate and toDate
};

// Reset date filter
// const resetDateFilter = () => {
//   fromDate.value = "";
//   loadProjects(""); // Load original list
// };
const resetDateFilter = () => {
  range.value = { start: null, end: null };
  loadProjects(""); // Reload without date filter
};
</script>

<template>
  <div class="p-6 max-w-7xl mx-auto space-y-8">
    <!-- Page Title -->
    <div class="flex justify-between items-center">
      <h1 class="text-3xl font-bold text-gray-800">Projects</h1>

      <!-- DATE FILTER -->
      <div class="flex gap-3 items-center">
        <!-- <UInput v-model="fromDate" type="date" class="w-40" :max="today" /> -->
        <DateRangePicker v-model="range" />

        <UButton :disabled="!fromDate" @click="applyDateFilter" color="primary">
          Apply
        </UButton>

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

    <!-- Tabs -->
    <UTabs v-model="activeTab" :tabs="tabs" />

    <!-- PROJECT TAB -->
    <div v-if="activeTab === 'projects'" class="space-y-5">
      <!-- Filter Row -->
      <div class="flex items-center gap-4">
        <div class="w-60">
          <USelect
            v-model="selectedType"
            :items="projectTypes"
            placeholder="Filter by project type"
          />
        </div>
      </div>

      <!-- Project Cards -->
      <div
        v-if="filteredProjects.length"
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6"
      >
        <UCard
          v-for="p in filteredProjects"
          :key="p.project_id"
          class="relative overflow-hidden border rounded-xl p-4 shadow-sm hover:shadow-md bg-white transition-all hover:scale-[1.02]"
        >
          <!-- LIGHT TOP BORDER -->
          <div
            class="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-sky-200 to-indigo-200"
          ></div>

          <div class="space-y-3 pt-2">
            <!-- Project Name -->
            <h3 class="text-lg font-semibold text-gray-900 leading-tight">
              {{ p.project_name }}
            </h3>

            <!-- Type Badge -->
            <UBadge
              :color="typeColor(p.project_type)"
              variant="soft"
              class="uppercase text-xs tracking-wide flex items-center gap-1"
            >
              {{ p.project_type }}
            </UBadge>

            <!-- Stats -->
            <div class="pt-2 text-sm space-y-2">
              <!-- Total Stat -->
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
                  @click="navigateToProjectDetails(p.project_id, 'survey-list')"
                >
                  Total
                </span>
                <b>{{ p.total_surveys }}</b>
              </div>

              <!-- Resolved Stat -->
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
                  @click="navigateToProjectDetails(p.project_id, 'survey-list')"
                >
                  Working
                </span>
                <b>{{ p.working_count }}</b>
              </div>

              <!-- Pending Stat -->
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
                  @click="navigateToProjectDetails(p.project_id, 'survey-list')"
                >
                  Not Working
                </span>
                <b>{{ p.not_working_count }}</b>
              </div>

              <!-- NA Stat -->
              <!-- <div class="flex justify-between">
                <span class="cursor-pointer transition-all duration-300">
                  N/A
                </span>
                <b>{{ p.na_count }}</b>
              </div> -->

              <!-- <div
                class="flex justify-between text-grey-500"
                @mouseover="hoveredStat = 'na'"
                @mouseleave="hoveredStat = ''"
              >
                <span
                  class="cursor-pointer transition-all duration-300"
                  :class="hoveredStat === 'na' ? 'text-grey-500 scale-110' : ''"
                  @click="navigateToProjectDetails(p.project_id, 'survey-list')"
                >
                  N/A
                </span>
                <b>{{ p.na_count }}</b>
              </div> -->
            </div>
          </div>
        </UCard>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center text-gray-400 py-10">
        No projects found for selected filter.
      </div>
    </div>

    <!-- Complaints -->
    <div v-if="activeTab === 'complaints'">
      <UAlert color="info">Complaints API not connected yet.</UAlert>
    </div>

    <!-- Surveys -->
    <div v-if="activeTab === 'surveys'">
      <UAlert color="info">Surveys API not connected yet.</UAlert>
    </div>
  </div>
</template>
