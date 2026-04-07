<template>
  <div class="h-screen flex text-gray-800 overflow-hidden">
    <!-- Sidebar -->
    <aside
      :class="[
        'bg-teal-600 text-white flex flex-col justify-between shadow-md transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-20' : 'w-64',
      ]"
    >
      <div>
        <!-- Header -->
        <div class="flex items-center justify-between px-4 h-16 bg-teal-500">
          <!-- Transition & Trimmed Project Name -->
          <Transition name="fade">
            <span
              v-if="!isCollapsed"
              class="text-xl font-bold tracking-tight"
              :title="project.project_name"
            >
              {{ trimmedProjectName }}
            </span>
          </Transition>
          <UButton
            class="text-white hover:bg-teal-700 transition"
            :icon="
              isCollapsed
                ? 'i-heroicons-chevron-double-right'
                : 'i-heroicons-chevron-double-left'
            "
            @click="toggleSidebar"
            size="sm"
            color="white"
            variant="ghost"
          />
        </div>

        <!-- Navigation -->
        <nav class="mt-4 px-2 flex flex-col gap-1">
          <!-- Main nav items -->
          <UButton
            v-for="item in navItems.filter((i) => i.show !== false)"
            :key="item.label"
            :icon="item.icon"
            :label="!isCollapsed ? item.label : ''"
            :to="item.to"
            variant="ghost"
            color="gray"
            class="justify-start rounded-md transition-all duration-200 ease-in-out"
            :class="[
              route.path === item.to
                ? 'bg-teal-700 text-white font-semibold'
                : 'hover:bg-teal-700 hover:text-white',
            ]"
          />

          <!-- Complaints Dropdown -->
          <div class="flex flex-col" v-show="Number(role) !== 3">
            <UButton
              icon="i-heroicons-exclamation-circle"
              :label="!isCollapsed ? 'Complaints' : ''"
              variant="ghost"
              color="gray"
              class="justify-between rounded-md transition-all duration-200 ease-in-out"
              :class="[
                isComplaintsRoute
                  ? 'bg-teal-700 text-white font-semibold'
                  : 'hover:bg-teal-700 hover:text-white',
              ]"
              @click="toggleComplaints"
            >
              <span v-if="!isCollapsed">Complaints</span>
              <span v-if="!isCollapsed" class="ml-auto text-xs">
                {{ isComplaintsOpen ? "▲" : "▼" }}
              </span>
            </UButton>

            <!-- Dropdown submenu -->
            <Transition name="slide-fade">
              <div
                v-if="isComplaintsOpen && !isCollapsed"
                class="ml-6 mt-1 flex flex-col gap-1"
              >
                <UButton
                  v-for="sub in complaintItems"
                  :key="sub.label"
                  :icon="sub.icon"
                  :label="sub.label"
                  :to="sub.to"
                  variant="ghost"
                  color="gray"
                  class="justify-start rounded-md text-sm transition-all"
                  :class="[
                    route.path === sub.to
                      ? 'bg-teal-700 text-white font-semibold'
                      : 'hover:bg-teal-700 hover:text-white',
                  ]"
                />
              </div>
            </Transition>
          </div>
        </nav>
      </div>

      <!-- Bottom Settings -->
      <!-- <div
        class="px-2 py-4 border-t border-teal-500 bg-teal-500/80 hover:bg-teal-700"
      >
        <UButton
          icon="i-heroicons-cog-6-tooth"
          :label="!isCollapsed ? 'Settings' : ''"
          variant="ghost"
          color="gray"
          class="justify-start rounded-md transition-all"
        />
      </div> -->
    </aside>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col overflow-hidden bg-gray-50">
      <!-- Header -->
      <header
        class="h-16 bg-white px-4 flex items-center justify-between shadow-sm shrink-0"
      >
        <h1 class="text-xl font-semibold text-teal-600">Dashboard</h1>

        <!-- <UButton
          class="text-teal-600 hover:bg-teal-100 border border-teal-300"
          variant="ghost"
          icon="i-heroicons-arrow-right-on-rectangle"
          @click="logout"
        >
          Logout
        </UButton> -->
        <UDropdownMenu
          :items="items"
          :ui="{
            content: 'w-48',
          }"
        >
          <UButton icon="i-lucide-menu" color="neutral" variant="outline" />
        </UDropdownMenu>
      </header>

      <!-- Scrollable Page Content -->
      <main class="flex-1 overflow-auto p-6">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useToast } from "#imports";

const isCollapsed = ref(false);
const isComplaintsOpen = ref(false);
const router = useRouter();
const toast = useToast();
const route = useRoute();
// Initialize `project` with a default safe structure
const project = ref<{ project_name?: string }>({ project_name: "" });
const user = JSON.parse(localStorage.getItem("user"));
const username = user?.username;
const role = user?.role;
// console.log(role);

const items = ref([
  [
    {
      label: username,
      avatar: {
        src: `https://api.dicebear.com/9.x/initials/svg?seed=${username}&radius=50`,
      },
      type: "sumit",
    },
  ],
  // [
  //   {
  //     label: "Profile",
  //     icon: "i-lucide-user",
  //   },
  //   {
  //     label: "Billing",
  //     icon: "i-lucide-credit-card",
  //   },
  //   {
  //     label: "Settings",
  //     icon: "i-lucide-cog",
  //     kbds: [","],
  //   },
  //   {
  //     label: "Keyboard shortcuts",
  //     icon: "i-lucide-monitor",
  //   },
  // ],
  // [
  //   {
  //     label: "Team",
  //     icon: "i-lucide-users",
  //   },
  //   {
  //     label: "Invite users",
  //     icon: "i-lucide-user-plus",
  //     children: [
  //       [
  //         {
  //           label: "Email",
  //           icon: "i-lucide-mail",
  //         },
  //         {
  //           label: "Message",
  //           icon: "i-lucide-message-square",
  //         },
  //       ],
  //       [
  //         {
  //           label: "More",
  //           icon: "i-lucide-circle-plus",
  //         },
  //       ],
  //     ],
  //   },
  //   {
  //     label: "New team",
  //     icon: "i-lucide-plus",
  //     kbds: ["meta", "n"],
  //   },
  // ],
  // [
  //   {
  //     label: "GitHub",
  //     icon: "i-simple-icons-github",
  //     to: "https://github.com/nuxt/ui",
  //     target: "_blank",
  //   },
  //   {
  //     label: "Support",
  //     icon: "i-lucide-life-buoy",
  //     to: "/docs/components/dropdown-menu",
  //   },
  //   {
  //     label: "API",
  //     icon: "i-lucide-cloud",
  //     disabled: true,
  //   },
  // ],
  [
    {
      label: "Logout",
      icon: "i-lucide-log-out",
      kbds: ["shift", "meta", "q"],
      onClick: logout,
    },
  ],
]);

// Load from localStorage on mount
onMounted(() => {
  const projectNameString = localStorage.getItem("user");

  if (projectNameString) {
    try {
      const parsedProject = JSON.parse(projectNameString);
      project.value = parsedProject;
    } catch (error) {
      console.error("Error parsing user data from localStorage:", error);
    }
  } else {
    console.log("No user data found in localStorage");
  }
});

// Computed: trim long names
const trimmedProjectName = computed(() => {
  const name = project.value.project_name || "";
  return name.length > 15 ? name.slice(0, 15) + "..." : name;
});

const dashboard_url = localStorage.getItem("dashboard_url");
const survey_url = localStorage.getItem("survey_url");
const home = JSON.parse(dashboard_url);
const survey = JSON.parse(survey_url);

// Sidebar items
// const navItems = [
//   {
//     label: "Home",
//     icon: "i-heroicons-home",
//     to: home,
//   },
//   {
//     label: "Surveys",
//     icon: "i-heroicons-clipboard-document-check",
//     to: survey,
//   },
//   { label: "Manage User", icon: "i-heroicons-users", to: "/teams" },
//   {
//     label: "Complaint Report",
//     icon: "i-heroicons-users",
//     to: "/complaint-report",
//   },
// ];

const navItems = computed(() => {
  const items = [
    {
      label:
        // "Home"
        `${role === "3" ? "Complaint" : "Home"}`,
      icon: "i-heroicons-home",
      to: home,
    },
    {
      label: "Surveys",
      icon: "i-heroicons-clipboard-document-check",
      to: survey,
    },
    {
      label: "Manage User",
      icon: "i-heroicons-users",
      to: "/teams",
    },
    {
      label: "Complaint Report",
      icon: "heroicons-outline:clipboard-list",
      to: "/complaint-report",
      showFor: ["3"],
    },
    {
      label: "Repairing",
      icon: "heroicons-outline:cog",
      to: "/repairing",
      showFor: ["3", "1"],
    },
  ];
  // https://icon-sets.iconify.design/heroicons-outline/page-2.html?keyword=u

  return items.filter((item) => {
    if (!item.showFor) return true;
    return item.showFor.includes(role);
  });
});

const complaintItems = [
  {
    label: "Open Complaints",
    icon: "i-heroicons-exclamation-triangle",
    to: "/complaints",
  },
  {
    label: "Add Complaints",
    icon: "i-heroicons-plus-circle",
    to: "/add-complaints",
  },
];

// All complaint routes
const complaintsRoutes = complaintItems.map((i) => i.to);
const isComplaintsRoute = computed(() => complaintsRoutes.includes(route.path));

// Auto open dropdown on active route
watch(
  () => route.path,
  (newPath) => {
    isComplaintsOpen.value =
      complaintsRoutes.includes(newPath) && !isCollapsed.value;
  },
  { immediate: true },
);

// Toggle sidebar
function toggleSidebar() {
  isCollapsed.value = !isCollapsed.value;
  if (isCollapsed.value) isComplaintsOpen.value = false;
}

// Toggle dropdown
function toggleComplaints() {
  isComplaintsOpen.value = !isComplaintsOpen.value;
}

// Logout function
function logout() {
  localStorage.clear();

  toast.add({
    title: "Signed out",
    description: "You have been logged out.",
    color: "gray",
    icon: "i-heroicons-check-circle",
  });
  router.push("/login").then(() => window.location.reload());
}

// Auto-collapse sidebar on small screens
onMounted(() => {
  if (window.innerWidth < 1024) isCollapsed.value = true;
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-fade-enter-active {
  transition: all 0.25s ease-out;
}
.slide-fade-leave-active {
  transition: all 0.2s ease-in;
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}
</style>
