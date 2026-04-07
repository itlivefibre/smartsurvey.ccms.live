<script setup lang="ts">
definePageMeta({ ssr: false });

import { ref, onMounted, computed, watch } from "vue";
import { useToast } from "#imports";
import { useRouter } from "vue-router";
import {
  CalendarDate,
  DateFormatter,
  getLocalTimeZone,
} from "@internationalized/date";

const df = new DateFormatter("en-US", {
  dateStyle: "medium",
});

const modelValue = ref<{
  start: CalendarDate | null;
  end: CalendarDate | null;
}>({
  start: null,
  end: null,
});

const todayCalendar = new CalendarDate(
  new Date().getFullYear(),
  new Date().getMonth() + 1,
  new Date().getDate(),
);

function formatCalendarDate(date: CalendarDate) {
  return `${date.year}-${String(date.month).padStart(2, "0")}-${String(
    date.day,
  ).padStart(2, "0")}`;
}

const fromDate = computed(() => {
  if (!modelValue.value.start) return "";
  return formatCalendarDate(modelValue.value.start);
});

const toDate = computed(() => {
  if (!modelValue.value.end) return "";
  return formatCalendarDate(modelValue.value.end);
});

const router = useRouter();
const route = useRoute();
const projectId = route.query.projectId;
// console.log(projectId);
const toast = useToast();

// Loading states
const loading = ref(true);
const loadingComplaints = ref(false);
const refreshingComplaints = ref(false);

// Animated counters
const animatedComplaints = ref(0);

// Total counts
const totalComplaints = ref<number>(0);
const dashboardData = ref<number>(0);

// Detailed complaint stats
const complaintWorking = ref(0);
const complaintNotWorking = ref(0);

const animatedWorkingComplaints = ref(0);
const animatedNotWorkingComplaints = ref(0);

const today = new Date().toISOString().split("T")[0];

const showTable = ref(false); // ❗ default = false → show chart

// Table data
interface UserComplaint {
  user_id: number;
  name: string;
  raised_count: string; // ← string
  resolved_count: string; // ← string
}

const complaintUsers = ref<UserComplaint[]>([]);

const complaintSeries = computed(() => [
  {
    name: "Total Complaint",
    data: complaintUsers.value.map((u) => Number(u.raised_count || 0)),
  },
  {
    name: "Resolved",
    data: complaintUsers.value.map((u) => Number(u.resolved_count || 0)),
  },
]);

function startCountUp(
  targetRef: { value: number },
  finalValue: number,
  duration = 1000,
) {
  const frameRate = 25; // ms per frame
  const totalFrames = Math.ceil(duration / frameRate);
  let currentFrame = 0;
  const increment = finalValue / totalFrames;

  const timer = setInterval(() => {
    currentFrame++;
    targetRef.value = Math.min(
      Math.round(increment * currentFrame),
      finalValue,
    );

    if (currentFrame >= totalFrames) {
      clearInterval(timer);
      targetRef.value = finalValue; // ensure exact value at end
    }
  }, frameRate);
}

// 🔹 Fetch Complaints
async function fetchComplaints() {
  loadingComplaints.value = true;
  try {
    const token = process.client ? localStorage.getItem("access_token") : "";
    const res = await $fetch<any>(
      "https://ayodhya.water.live/api/surveyNew.php?action=get_dashboard_complaints",
      {
        method: "POST",
        body: {
          accesskey: token,
          project_id: projectId,
          from_date: fromDate.value,
          to_date: toDate.value,
        },
      },
    );

    if (res.error === 1) {
      localStorage.removeItem("access_token");
      toast.add({
        title: "Access Denied",
        description: "Session expired",
        color: "red",
      });
      router.push("/login").then(() => window.location.reload());
      return;
    }
    // console.log(res.result.complaint_count_by_user);

    dashboardData.value = res.result.complaint_count_by_user;
    totalComplaints.value =
      res.result?.complaint_status_counts[0]?.total_complaint ?? 0;

    complaintWorking.value = Number(
      res.result?.complaint_status_counts[0]?.resolve ?? 0,
    );
    complaintNotWorking.value = Number(
      res.result?.complaint_status_counts[0]?.unresolve ?? 0,
    );
    // complaintUsers.value = complaintDate.value
    //   ? res.result?.complaint_count_by_user_new ?? []
    //   : res.result?.complaint_count_by_user ?? [];

    // res.result.complaint_count_by_user.forEach((element) => {
    //   if (element.raised_count > 0 || element.resolved_count > 0) {
    //     complaintUsers.value.push(element);
    //   }
    // });
    complaintUsers.value =
      res.result?.complaint_count_by_user?.filter(
        (e) => Number(e.raised_count) > 0 || Number(e.resolved_count) > 0,
      ) ?? [];

    // complaintUsers.value = res.result?.complaint_count_by_user ?? [];

    // Animate counts
    startCountUp(animatedComplaints, totalComplaints.value);
    startCountUp(animatedWorkingComplaints, complaintWorking.value);
    startCountUp(animatedNotWorkingComplaints, complaintNotWorking.value);
  } catch (err) {
    console.error(err);
    toast.add({
      title: "Error",
      description: "Failed to load complaints",
      color: "red",
    });
  } finally {
    loadingComplaints.value = false;
    loading.value = false;
  }
}

function resetComplaintDate() {
  modelValue.value = { start: null, end: null };
  fetchComplaints();
}

const refreshComplaints = async () => {
  refreshingComplaints.value = true;
  await fetchComplaints();
  setTimeout(() => (refreshingComplaints.value = false), 800);
};

// Initial load
onMounted(() => {
  fetchComplaints();
});

// const new_data = computed(() => {
//   return complaintUsers.value.map((ele) => ele.name);
// });

const COLORS = {
  primary: "#E11D48", // rose-600
  light: "#F43F5E", // rose-500
  soft: "#FDA4AF", // rose-300
  grid: "#F1F5F9", // slate-100
  text: "#475569", // slate-600
};

const chartOptions = computed(() => ({
  chart: {
    type: "bar",
    stacked: true,
    height: 400,
    toolbar: { show: false },
    fontFamily: "Inter, sans-serif",
    events: {
      dataPointSelection: (_, __, config) => {
        const user = complaintUsers.value[config.dataPointIndex];
        if (!user) return;

        router.push({
          path: `/complaints`,
          query: { projectId: projectId, user: user.user_id },
        });
      },
    },
  },

  colors: ["#ab5c72", "#a2ebb8"],

  legend: {
    position: "top",
    labels: {
      colors: COLORS.text,
    },
  },

  xaxis: {
    categories: complaintUsers.value.map((u) => u.name),
    labels: {
      rotate: -45,
      style: {
        colors: COLORS.text,
        fontSize: "12px",
      },
    },
  },
}));

watch(
  [() => modelValue.value.start, () => modelValue.value.end],
  ([start, end]) => {
    if (start && end) fetchComplaints();
  },
);

const handleButtonClick = () => {
  router.push({
    path: `/complaints`,
    query: { projectId: projectId },
  });
};

const projectNameList = JSON.parse(localStorage.getItem("user"));

var projectName = "";
if (projectNameList["project_list"]) {
  projectName = projectNameList["project_list"][projectId]["project_name"];
} else {
  projectName = projectNameList.project_name;
}
// console.log(projectName);

/* ───────────── CSV EXPORT (CORRECT) ───────────── */
function exportCSV() {
  if (!dashboardData.value.length) return;

  const headers = [
    "User ID",
    "User Name",
    "Total Complaints",
    "Resolved Complaints",
    // "Pending Complaints",
  ];

  const rows = dashboardData.value.map((item) => {
    const raised = Number(item.raised_count);
    const resolved = Number(item.resolved_count);
    // const pending = raised - resolved;

    return [item.user_id, item.name, raised, resolved];
  });

  const csvContent =
    "data:text/csv;charset=utf-8," +
    [headers, ...rows]
      .map((row) =>
        row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");

  const link = document.createElement("a");
  link.setAttribute("href", encodeURI(csvContent));
  link.setAttribute("download", `${projectName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
</script>

<template>
  <div class="p-6 bg-slate-50 min-h-screen">
    <!-- Cards row -->
    <div class="flex items-center justify-between mb-6">
      <div class="text-xl font-semibold text-gray-800">
        {{ projectNameList["project_list"] ? projectName : "" }}
        <!-- {{ projectName }} -->
      </div>

      <div class="grid grid-cols">
        <UButton
          class="cursor-pointer justify-end"
          color="blue"
          size="lg"
          variant="solid"
          icon="i-heroicons-arrow-right-circle"
          @click="handleButtonClick"
        >
          Go to Complaints
        </UButton>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-1 gap-6">
      <!-- Total Complaints -->
      <div
        class="group bg-white border border-gray-100 shadow-lg rounded-2xl p-6 flex flex-col space-y-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
      >
        <NuxtLink
          :to="{ path: '/complaints', query: projectId ? { projectId } : {} }"
          class="block"
        >
          <div class="flex items-center space-x-4">
            <!-- Icon -->
            <div
              class="p-4 bg-gradient-to-br from-rose-100 to-red-200 rounded-full text-2xl transition-all group-hover:from-rose-200 group-hover:to-red-300"
            >
              ⚠️
            </div>

            <div>
              <template v-if="loading">
                <USkeleton class="h-8 w-24 bg-gray-200 mb-2" />
                <USkeleton class="h-4 w-32 bg-gray-200" />
              </template>

              <template v-else>
                <p
                  class="text-3xl font-bold text-rose-700 transition-all duration-300"
                >
                  {{ animatedComplaints }}
                </p>
                <p class="text-gray-500">Total Complaints</p>
              </template>
            </div>
          </div>
        </NuxtLink>
        <!-- Detailed counts -->
        <div class="grid grid-cols-2 gap-4 text-sm text-gray-700 mt-2">
          <NuxtLink
            :to="{
              path: '/complaints/resolved',
              query: projectId ? { projectId } : {},
            }"
            class="block"
          >
            <div
              class="text-center bg-green-50 rounded-md p-2 cursor-pointer transition-all duration-200 hover:bg-green-100 hover:scale-105"
            >
              <p class="font-semibold">{{ animatedWorkingComplaints }}</p>
              <p class="text-gray-500">Resolved</p>
            </div>
          </NuxtLink>
          <NuxtLink
            :to="{
              path: '/complaints/pending',
              query: projectId ? { projectId } : {},
            }"
            class="block"
          >
            <div
              class="text-center bg-red-50 rounded-md p-2 cursor-pointer transition-all duration-200 hover:bg-red-100 hover:scale-105"
            >
              <p class="font-semibold">{{ animatedNotWorkingComplaints }}</p>
              <p class="text-gray-500">Pending</p>
            </div>
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Tables row -->
    <div class="grid grid-cols-1 md:grid-cols-1 gap-6 mt-8">
      <!-- Complaint Table -->
      <div
        class="bg-white shadow-xl rounded-2xl p-6 border border-gray-100 transition-all duration-300 hover:shadow-2xl"
      >
        <div class="flex items-center flex-wrap gap-2 mb-4">
          <h2
            class="text-lg font-semibold bg-gradient-to-r from-rose-600 to-orange-500 bg-clip-text text-transparent"
          >
            ⚠️ Complaints by User
          </h2>

          <UPopover>
            <UButton color="neutral" variant="subtle" icon="i-lucide-calendar">
              <template v-if="modelValue.start">
                <template v-if="modelValue.end">
                  {{ df.format(modelValue.start.toDate(getLocalTimeZone())) }} -
                  {{ df.format(modelValue.end.toDate(getLocalTimeZone())) }}
                </template>

                <template v-else>
                  {{ df.format(modelValue.start.toDate(getLocalTimeZone())) }}
                </template>
              </template>
              <template v-else> Pick a date </template>
            </UButton>

            <template #content>
              <UCalendar
                v-model="modelValue"
                class="p-2"
                :number-of-months="1"
                range
                :max-value="todayCalendar"
              />
            </template>
          </UPopover>

          <button
            @click="resetComplaintDate"
            :disabled="!modelValue.start"
            class="bg-gray-100 hover:bg-gray-200 text-sm px-3 py-1.5 rounded-md transition-all disabled:opacity-50"
          >
            Reset
          </button>

          <button
            @click="refreshComplaints"
            :class="refreshingComplaints ? 'animate-bounce-slow' : ''"
            class="bg-indigo-100 hover:bg-indigo-200 text-sm px-3 py-1.5 rounded-md flex items-center gap-2 transition-all duration-200"
          >
            🔄 <span>Refresh</span>
          </button>

          <span
            v-if="fromDate"
            class="text-xs bg-rose-50 text-rose-700 px-3 py-1 rounded-full ml-2"
          >
            Showing: {{ fromDate }} → {{ toDate }}
          </span>

          <button
            @click="showTable = !showTable"
            class="ml-auto bg-rose-100 hover:bg-rose-200 text-sm px-3 py-1.5 rounded-md transition-all cursor-pointer"
          >
            {{ showTable ? "Show Chart" : "Show Table" }}
          </button>
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

        <!-- Chart -->
        <!-- <div v-if="!showTable">
          <div id="chart">
            <apexchart
              type="bar"
              height="350"
              :options="chartOptions"
              :series="complaintSeries"
            />
          </div>
        </div> -->
        <!-- Chart Section -->
        <div
          v-if="!showTable"
          class="chart-container"
          :class="{ collapsed: showTable }"
        >
          <apexchart
            type="bar"
            height="350"
            :options="chartOptions"
            :series="complaintSeries"
          />
        </div>

        <div
          v-else
          class="max-h-96 overflow-y-auto rounded-md border border-gray-100"
        >
          <table class="min-w-full border-collapse text-sm">
            <thead
              class="bg-gradient-to-r from-rose-50 to-orange-50 sticky top-0 z-10"
            >
              <tr>
                <th class="px-4 py-2 text-left border-b text-gray-600">Name</th>
                <th class="px-4 py-2 text-left border-b text-gray-600">
                  Total Complaint
                </th>
                <th class="px-4 py-2 text-left border-b text-gray-600">
                  Total Resolved
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loadingComplaints">
                <td
                  colspan="2"
                  class="px-4 py-3 text-center text-gray-400 italic animate-pulse"
                >
                  Loading complaint data...
                </td>
              </tr>

              <tr v-else-if="complaintUsers.length === 0">
                <td colspan="2" class="px-4 py-3 text-center text-gray-500">
                  No complaint data
                </td>
              </tr>

              <tr
                v-for="(u, index) in complaintUsers"
                :key="u.user_id"
                :class="[
                  'hover:bg-rose-50 transition-all',
                  index === 0 ? 'bg-yellow-50 font-semibold' : '',
                ]"
              >
                <td class="px-4 py-2 border-b">
                  {{ u.name }}
                </td>
                <td class="px-4 py-2 border-b">
                  {{ u.raised_count }}
                </td>
                <td class="px-4 py-2 border-b">
                  {{ u.resolved_count }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
@keyframes bounce-slow {
  0%,
  100% {
    transform: translateY(0);
    opacity: 1;
  }
  50% {
    transform: translateY(-3px);
    opacity: 0.8;
  }
}

.animate-bounce-slow {
  animation: bounce-slow 0.6s ease-in-out infinite;
}
</style>
