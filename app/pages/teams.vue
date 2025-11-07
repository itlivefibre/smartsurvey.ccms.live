<template>
  <div class="w-full space-y-4 pb-4">
    <!-- Header -->
    <div class="flex justify-between items-center light">
      <h2 class="text-xl font-bold">Users</h2>
      <UButton
        icon="i-heroicons-plus"
        label="Add User"
        color="primary"
        variant="solid"
        class="transition-transform duration-200 hover:scale-105 cursor-pointer"
        @click="openModal()"
      />
    </div>

    <UCard class="border hover:shadow-md transition-shadow duration-200">
      <!-- Table Header with search + page size -->
      <div class="flex justify-between items-center mb-3 space-x-4">
        <!-- Search -->
        <div class="flex-1">
          <UInput
            v-model="searchTerm"
            icon="i-heroicons-magnifying-glass-20-solid"
            placeholder="Search by name, email, or username..."
            class="w-full"
          />
        </div>

        <!-- Role Filter -->
        <div class="flex-1">
          <UFormField class="w-full">
            <select
              v-model.number="roleFilter"
              class="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
            >
              <option :value="0">All Roles</option>
              <option
                v-for="role in roles"
                :key="role.value"
                :value="role.value"
              >
                {{ role.text }}
              </option>
            </select>
          </UFormField>
        </div>

        <!-- Page size select -->
        <div class="flex items-center gap-2 text-sm text-gray-700">
          <span>Show</span>
          <select
            v-model.number="pageSize"
            class="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400"
          >
            <option v-for="size in pageSizeOptions" :key="size" :value="size">
              {{ size }}
            </option>
          </select>
          <span>entries</span>
        </div>
      </div>

      <!-- Loader -->
      <div v-if="loading" class="flex justify-center items-center py-8">
        <div class="animate-pulse text-gray-500">Loading users...</div>
      </div>

      <!-- Empty state -->
      <div
        v-else-if="!filteredData.length"
        class="text-center py-8 text-gray-500"
      >
        👥 No users found. Click <strong>+ Add User</strong> to create one.
      </div>

      <!-- Table -->
      <UTable
        v-else
        :data="paginatedData"
        :columns="columns"
        class="flex-1 light"
      />

      <!-- Pagination -->
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

    <!-- Add/Edit Modal -->
    <Transition name="fade-zoom">
      <div>
        <UModal
          class="light"
          v-model:open="showModal"
          description="Fill in the user details below"
          :title="isAddMode ? 'Add User' : 'Edit User'"
        >
          <template #body>
            <div class="grid grid-cols-2 gap-x-6 gap-y-4">
              <!-- Name -->
              <UFormField
                label="Full Name"
                name="name"
                :error="errors.name"
                class="w-full"
              >
                <UInput
                  v-model="selectedUser.name"
                  placeholder="Full Name"
                  class="w-full"
                />
              </UFormField>

              <!-- Username -->
              <UFormField
                label="Username"
                name="username"
                :error="errors.username"
                class="w-full"
              >
                <UInput
                  v-model="selectedUser.username"
                  placeholder="Username"
                  class="w-full"
                />
              </UFormField>

              <!-- Email -->
              <UFormField
                label="Email"
                name="email"
                :error="errors.email"
                class="w-full"
              >
                <UInput
                  v-model="selectedUser.email"
                  type="email"
                  placeholder="Email"
                  class="w-full"
                />
              </UFormField>

              <!-- Mobile -->
              <UFormField
                label="Mobile Number"
                name="mobile_no"
                :error="errors.mobile_no"
                class="w-full"
              >
                <UInput
                  v-model="selectedUser.mobile_no"
                  type="text"
                  placeholder="Mobile No"
                  class="w-full"
                />
              </UFormField>

              <!-- Password -->
              <UFormField label="Password" name="password" class="w-full">
                <UInput
                  v-model="tempPassword"
                  type="password"
                  placeholder="Enter new password"
                  class="w-full"
                />
              </UFormField>

              <!-- Role -->
              <UFormField
                label="Role"
                name="role"
                :error="errors.role"
                class="w-full"
              >
                <!-- <select
                  v-model.number="selectedUser.role"
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer"
                > -->
                <select
                  v-model.number="selectedUser.role"
                  :disabled="!isAddMode"
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer"
                  :class="{
                    'bg-gray-100 text-gray-500 cursor-not-allowed': !isAddMode,
                  }"
                >
                  <option
                    v-for="role in roles"
                    :key="role.value"
                    :value="role.value"
                  >
                    {{ role.text }}
                  </option>
                </select>
              </UFormField>

              <UFormField
                label="Select Wards"
                class="w-full"
                v-if="selectedUser.role === 2"
              >
                <USelectMenu
                  v-model="selectedItems"
                  :items="availableOptions"
                  multiple
                  placeholder="Select wards..."
                  class="w-full cursor-pointer"
                />
              </UFormField>

              <UFormField
                v-if="selectedUser.role === 5"
                label="Select Supervisor"
                class="w-full"
              >
                <USelect
                  v-model="selectedUser.supervisor_id"
                  :items="supervisorOptions"
                  placeholder="Select Supervisor"
                  class="w-48"
                />
              </UFormField>

              <!-- Status -->
              <UFormField
                label="Status"
                name="status"
                :error="errors.status"
                class="w-full"
              >
                <select
                  v-model.number="selectedUser.status"
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer"
                >
                  <option :value="1">Active</option>
                  <option :value="0">Inactive</option>
                </select>
              </UFormField>
            </div>
          </template>

          <template #footer>
            <div class="flex justify-end gap-2 mt-4">
              <UButton variant="outline" @click="showModal = false"
                >Cancel</UButton
              >
              <UButton color="primary" @click="saveUser">
                {{ isAddMode ? "Save" : "Update" }}
              </UButton>
            </div>
          </template>
        </UModal>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ ssr: false });
import { ref, onMounted, computed, h, reactive, watch } from "vue";
import { useToast } from "#imports";
const toast = useToast();

// --- State ---
const showModal = ref(false);
const isAddMode = ref(true);
const tempPassword = ref(""); // For entering password when adding or updating user
const loading = ref(true);
const searchTerm = ref("");
const pageSizeOptions = [5, 10, 20, 50, 100];

const accesskey = localStorage.getItem("access_token") || "20250929133158";
// const availableOptions = Array.from({ length: 201 }, (_, index) => ({
//   value: index + 1,
//   label: `Ward ${index + 1}`,
// })); // Available wards as objects for USelectMenu
const availableOptions = Array.from({ length: 201 }, (_, index) => index);
const selectedItems = ref<number[]>([]);

// Selected user for editing or adding
const selectedUser = ref<any>({
  id: "",
  name: "",
  username: "",
  email: "",
  password: "",
  mobile_no: "",
  role: 1,
  status: 1,
  accesskey,
});

// Validation errors for fields
const errors = reactive<any>({
  name: null,
  username: null,
  email: null,
  mobile_no: null,
  role: null,
  status: null,
  supervisor: null,
});

// Reset form when modal closes or user submits
watch(showModal, (open) => {
  if (!open) {
    // Clear selected items, password, and validation errors on modal close
    selectedItems.value = [];
    tempPassword.value = "";
    Object.keys(errors).forEach((key) => (errors[key] = null));

    // Reset selectedUser for next use
    selectedUser.value = {
      id: "",
      name: "",
      username: "",
      email: "",
      password: "",
      mobile_no: "",
      role: 1,
      status: 1,
      accesskey,
    };
  }
});

// Table data
type User = {
  id: number;
  name: string;
  username: string;
  email: string;
  mobile_no: string;
  role: number;
  status: number;
  wards?: string | any[];
  supervisor_id?: number | string;
};
const data = ref<User[]>([]);
const roles = ref<{ text: string; value: number }[]>([]);

const supervisors = ref<any[]>([]);
const supervisorMap = ref<Record<string | number, string>>({});

// Pagination logic
const currentPage = ref(1);
const pageSize = ref(10);
const roleFilter = ref<number | 0>(0); // 0 → All roles
const filteredData = computed(() => {
  let result = data.value.slice();

  // Filter by search term if available
  if (searchTerm.value.trim()) {
    result = result.filter((user) =>
      ["name", "email", "username"].some((key) =>
        String(user[key] || "")
          .toLowerCase()
          .includes(searchTerm.value.toLowerCase())
      )
    );
  }

  // Filter by role if selected (>0)
  if (roleFilter.value && roleFilter.value !== 0) {
    result = result.filter(
      (user) => Number(user.role) === Number(roleFilter.value)
    );
  }

  return result;
});

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredData.value.length / pageSize.value))
);
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredData.value.slice(start, start + pageSize.value);
});

// Table columns (including actions column)
const columns: any[] = [
  {
    accessorKey: "id",
    header: "#",
    cell: ({ row }: any) => `#${row.getValue("id")}`,
  },
  {
    accessorKey: "username",
    header: "Username",
    cell: ({ row }: any) => {
      const username = row.getValue("username");
      const wards = row.original.wards;
      const supervisor_id = row.original.supervisor_id;
      const supervisorName = supervisorMap.value[supervisor_id] || "N/A";

      let wardsList: any[] = [];
      if (Array.isArray(wards)) wardsList = wards;
      else if (typeof wards === "string" && wards) {
        try {
          wardsList = JSON.parse(wards);
        } catch (e) {
          console.error("Error parsing wards:", e);
        }
      }

      return h("div", { class: "space-y-1" }, [
        // Username
        h("div", { class: "font-medium text-gray-800" }, username),

        // Ward chips
        wardsList && wardsList.length > 0
          ? h(
              "div",
              { class: "flex flex-wrap gap-1 mt-1" },
              wardsList.map((ward: any) =>
                h(
                  "span",
                  {
                    class:
                      "bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full border border-emerald-200",
                  },
                  String(ward)
                )
              )
            )
          : null,

        // Supervisor name (if available)
        supervisor_id
          ? h(
              "div",
              { class: "text-xs text-gray-500 mt-1 italic" },
              `Supervisor: ${supervisorName}`
            )
          : null,
      ]);
    },
  },

  { accessorKey: "name", header: "Name" },
  { accessorKey: "email", header: "Email" },
  { accessorKey: "mobile_no", header: "Mobile No" },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }: any) => {
      const role = roles.value.find(
        (r) => r.value === Number(row.original.role)
      );
      return role ? role.text : String(row.original.role);
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }: any) =>
      row.original.status === 1
        ? h("span", { class: "text-green-600 font-medium" }, "Active")
        : h("span", { class: "text-red-600 font-medium" }, "Inactive"),
  },
  {
    accessorKey: "actions",
    header: "Actions",
    cell: ({ row }: any) => {
      return h("div", { class: "flex gap-2" }, [
        h(
          "button",
          {
            class: "text-blue-500 cursor-pointer hover:underline",
            onClick: () => openModal(row.original),
          },
          "Edit"
        ),
        h(
          "button",
          {
            class: "text-red-500 cursor-pointer hover:underline",
            onClick: () => deleteUser(row.original.id),
          },
          "Delete"
        ),
      ]);
    },
  },
];

watch([searchTerm, roleFilter, pageSize], () => {
  currentPage.value = 1;
});

watch(
  () => selectedUser.value.role,
  (newRole) => {
    // ensure role is a number
    const r = Number(newRole);
    if (r === 5) {
      // Role 5 → requires supervisor
      if (!selectedUser.value.supervisor_id)
        selectedUser.value.supervisor_id = "";
      // remove wards if previously set
      delete selectedUser.value.wards;
      selectedItems.value = [];
    } else if (r === 2) {
      // Role 2 → requires wards
      if (!selectedUser.value.wards) selectedUser.value.wards = [];
      // remove supervisor if previously set
      delete selectedUser.value.supervisor_id;
    } else {
      // Other roles → clear both
      delete selectedUser.value.supervisor_id;
      delete selectedUser.value.wards;
      selectedItems.value = [];
    }
  }
);

// Computed for USelect items in { value, label } format
const supervisorOptions = computed(() =>
  supervisors.value.map((sup) => ({
    value: sup.id,
    label: sup.name || sup.username,
  }))
);

const fetchUsers = async () => {
  try {
    loading.value = true;

    const [usersRes, supervisorsRes] = await Promise.all([
      $fetch("https://ayodhya.water.live/api/surveyNew.php?action=users", {
        method: "POST",
        body: { accesskey },
      }),
      $fetch(
        "https://ayodhya.water.live/api/surveyNew.php?action=get_supervisors",
        {
          method: "POST",
          body: { accesskey },
        }
      ),
    ]);

    if (usersRes && usersRes.result) {
      data.value = usersRes.result.users || [];
      roles.value = usersRes.result.roles || [];
    }

    if (supervisorsRes && supervisorsRes.result) {
      supervisors.value = supervisorsRes.result.users || [];

      const map: Record<string | number, string> = {};
      supervisors.value.forEach((sup: any) => {
        map[sup.id] = sup.name || sup.username;
      });
      supervisorMap.value = map;
    }
  } catch (error) {
    console.error("Failed to fetch data:", error);
  } finally {
    loading.value = false;
  }
};

onMounted(fetchUsers);

async function openModal(user: any | null = null) {
  if (user) {
    selectedUser.value = {
      ...user,
      accesskey,
      supervisor_id: user.supervisor_id ?? "",
      role: Number(user.role ?? 1),
      status: Number(user.status ?? 1),
    };

    // Normalize wards into number[] for the select
    if (Array.isArray(user.wards)) {
      selectedItems.value = user.wards.map((w: any) => Number(w));
    } else if (typeof user.wards === "string" && user.wards) {
      try {
        const parsed = JSON.parse(user.wards);
        selectedItems.value = Array.isArray(parsed)
          ? parsed.map((p: any) => Number(p))
          : [];
      } catch (e) {
        console.error("Failed to parse wards on openModal:", e);
        selectedItems.value = [];
      }
    } else selectedItems.value = [];

    isAddMode.value = false;
    tempPassword.value = ""; // Do not prefill password
  } else {
    isAddMode.value = true;
    // reset handled by watcher when modal closes; but ensure form cleared before open
    selectedUser.value = {
      id: "",
      name: "",
      username: "",
      email: "",
      password: "",
      mobile_no: "",
      role: 1,
      status: 1,
      accesskey,
    };
    selectedItems.value = [];
    tempPassword.value = "";
  }
  showModal.value = true;
}

// Form validation
function validateUserForm() {
  let valid = true;
  const rules: any = {
    name: {
      required: "Name is required",
      regex: /^[A-Za-z\s]+$/,
      message: "Name cannot contain numbers or special characters",
    },
    email: {
      required: "Email is required",
      regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: "Enter a valid email",
    },
    mobile_no: {
      required: "Mobile number is required",
      regex: /^[6-9]\d{9}$/,
      message: "Enter a valid 10-digit number",
    },
  };

  for (const field in rules) {
    const { required, regex, message } = rules[field];
    const value = String(selectedUser.value[field] ?? "").trim();
    if (!value) {
      errors[field] = required;
      valid = false;
    } else if (regex && !regex.test(value)) {
      errors[field] = message;
      valid = false;
    } else {
      errors[field] = null;
    }
  }
  return valid;
}

// Save user function (Add/Update)
async function saveUser() {
  if (!validateUserForm()) {
    toast.add({
      title: "Please fix validation errors before saving.",
      color: "red",
    });
    return;
  }

  try {
    const payload: any = { ...selectedUser.value };

    // Ensure role/status are numbers
    payload.role = Number(payload.role);
    payload.status = Number(payload.status);

    // Handle wards based on role
    // if (payload.role === 2) {
    //   // payload.wards = JSON.stringify(selectedItems.value);
    //    payload.wards = `[${selectedItems.value.join(",")}]`;
    // } else {
    //   payload.wards = "";
    // }
    if (payload.role === 2) {
      // Extract only the numeric values
      const wardIds = selectedItems.value.map((item: any) =>
        typeof item === "object" ? item.value : item
      );
      // Convert to required string format
      payload.wards = `[${wardIds.join(",")}]`;
    } else {
      payload.wards = "";
    }

    // Handle supervisor_id for electricians (role = 5)
    if (payload.role === 5) {
      payload.supervisor_id = payload.supervisor_id ?? "";
    } else {
      payload.supervisor_id = "";
    }

    // Handle password
    if (isAddMode.value) {
      if (!tempPassword.value.trim()) {
        toast.add({
          title: "Please enter a password for new user.",
          color: "red",
        });
        return;
      }
      payload.password = tempPassword.value;
    } else if (tempPassword.value.trim()) {
      payload.password = tempPassword.value;
    } else {
      delete payload.password;
    }

    const action = isAddMode.value ? "user-insert" : "user-update";

    await $fetch(
      `https://ayodhya.water.live/api/surveyNew.php?action=${action}`,
      {
        method: "POST",
        body: payload,
      }
    );

    toast.add({
      title: isAddMode.value
        ? "User added successfully"
        : "User updated successfully",
      color: "green",
    });

    // ✅ Refresh list from backend so we get correct IDs and data
    await fetchUsers();
    // Update local data
    if (isAddMode.value) {
      // const newId = Date.now();
      data.value.push({
        ...payload,
        // id: newId,
      });
    } else {
      const index = data.value.findIndex(
        (user) => Number(user.id) === Number(payload.id)
      );
      if (index !== -1) {
        data.value[index] = {
          ...data.value[index],
          ...payload,
        };
      }
    }

    showModal.value = false;
  } catch (error) {
    console.error("Failed to save user:", error);
    toast.add({
      title: "Something went wrong. Please try again.",
      color: "red",
    });
  }
}

// Delete user
async function deleteUser(userId: number) {
  const confirmed = confirm("Are you sure you want to delete this user?");
  if (!confirmed) return;

  try {
    await $fetch(
      "https://ayodhya.water.live/api/surveyNew.php?action=user-delete",
      {
        method: "POST",
        body: { accesskey, id: userId },
      }
    );
    await fetchUsers(); // Refresh list after deletion
    toast.add({ title: "User deleted successfully.", color: "green" });
  } catch (error) {
    console.error(error);
    toast.add({
      title: "Failed to delete user. Please try again.",
      color: "red",
    });
  }
}
</script>

<style scoped>
/* Scoped styling for modal fade effect */
.fade-zoom-enter-active,
.fade-zoom-leave-active {
  transition: all 0.25s ease;
}
.fade-zoom-enter-from,
.fade-zoom-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
/* Scoped deep styling */
::v-deep .username-container {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

::v-deep .username-text {
  /* font-weight: 600; */
}

::v-deep .wards-text,
::v-deep .supervisor-text {
  font-weight: 350;
  color: #6b7280;
  font-style: italic;
  margin-left: 4px;
}
</style>
