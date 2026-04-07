<template>
  <div class="max-w-8xl mx-auto">
    <div class="bg-white shadow-lg rounded-xl p-8 border">
      <h1 class="text-2xl font-bold text-gray-800 mb-8 text-center">
        Add Complaint
      </h1>

      <!-- Toggle between manual form and Excel upload -->
      <div class="flex justify-end gap-4 mb-8">
        <UButton
          :variant="mode === 'form' ? 'solid' : 'outline'"
          @click="mode = 'form'"
          class="cursor-pointer"
          >Manual Form</UButton
        >
        <UButton
          :variant="mode === 'excel' ? 'solid' : 'outline'"
          @click="mode = 'excel'"
          class="cursor-pointer"
          >Upload Excel</UButton
        >
      </div>

      <!-- Manual Form -->
      <UForm
        v-if="mode === 'form'"
        :state="form"
        @submit="handleSubmit"
        class="space-y-8"
      >
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Full Name -->
          <UFormField label="Full Name" name="name" :error="errors.name">
            <UInput
              v-model="form.name"
              placeholder="Enter full name"
              class="w-full rounded-md text-sm text-gray-900 focus:ring-1 focus:ring-teal-500"
            />
          </UFormField>

          <!-- Mobile Number -->
          <UFormField
            label="Mobile Number"
            name="mobile"
            :error="errors.mobile"
          >
            <UInput
              v-model="form.mobile"
              type="tel"
              placeholder="Enter mobile number"
              class="w-full rounded-md text-sm text-gray-900 focus:ring-1 focus:ring-teal-500"
            />
          </UFormField>

          <!-- Ward Number -->
          <UFormField label="Ward Number" name="wardNo" :error="errors.wardNo">
            <UInput
              v-model="form.wardNo"
              type="number"
              placeholder="Ward no."
              class="w-full rounded-md text-sm text-gray-900 focus:ring-1 focus:ring-teal-500"
            />
          </UFormField>

          <!-- Pole No -->
          <UFormField label="Pole No." name="poleNo" :error="errors.poleNo">
            <UInput
              v-model="form.poleNo"
              placeholder="Enter pole no."
              class="w-full rounded-md text-sm text-gray-900 focus:ring-1 focus:ring-teal-500"
            />
          </UFormField>

          <!-- Reference By -->
          <UFormField label="Reference By" name="referenceBy">
            <UInput
              v-model="form.referenceBy"
              placeholder="Enter reference person name"
              class="w-full rounded-md text-sm text-gray-900 focus:ring-1 focus:ring-teal-500"
            />
          </UFormField>

          <!-- Complaint Date -->
          <UFormField label="Complaint Date" name="complaintDate">
            <UInput
              v-model="form.complaintDate"
              type="date"
              class="w-full rounded-md text-sm text-gray-900 focus:ring-1 focus:ring-teal-500"
            />
          </UFormField>

          <!-- Assign Electrician -->
          <UFormField label="Assign Electrician" name="electrician">
            <USelect
              v-model="form.electrician"
              :items="electricians"
              value-key="value"
              option-attribute="label"
              placeholder="Select electrician"
              class="w-full rounded-md text-sm focus:ring-1 focus:ring-teal-500"
            />
            <div v-if="!electricians.length" class="text-sm text-gray-500 mt-1">
              Loading electricians…
            </div>
          </UFormField>
        </div>

        <!-- Address -->
        <UFormField label="Address" name="address" :error="errors.address">
          <UTextarea
            v-model="form.address"
            placeholder="Enter full address"
            rows="3"
            class="w-full rounded-md text-sm text-gray-900 focus:ring-1 focus:ring-teal-500"
          />
        </UFormField>

        <!-- Actions -->
        <div class="flex justify-end gap-4 py-5">
          <UButton
            color="gray"
            variant="ghost"
            class="px-6 py-2 cursor-pointer"
            @click="resetForm"
          >
            Reset
          </UButton>
          <UButton
            type="submit"
            color="teal"
            class="px-6 py-2 text-white bg-teal-500 cursor-pointer"
          >
            Submit Complaint
          </UButton>
        </div>
      </UForm>

      <!-- Excel Upload -->
      <div v-else>
        <!-- Download Sample Format -->
        <div class="flex justify-end mb-4">
          <UButton
            color="gray"
            variant="outline"
            class="px-4 py-2 cursor-pointer"
            @click="downloadSample"
          >
            📥 Download Sample Format
          </UButton>
        </div>
        <UFormGroup label="Upload Excel File">
          <div
            class="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-teal-400 hover:bg-teal-50 transition"
            @click="fileInput.click()"
          >
            <div
              class="flex items-center justify-center w-12 h-12 rounded-full bg-teal-100 mb-3"
            >
              <UIcon
                name="i-heroicons-document-arrow-up"
                class="w-6 h-6 text-teal-600"
              />
            </div>
            <p class="text-gray-700 font-medium">Click to upload Excel file</p>
            <p class="text-xs text-gray-500 mt-1">
              Supports .xlsx and .xls (Max 5MB)
            </p>
            <input
              type="file"
              ref="fileInput"
              accept=".xlsx,.xls"
              class="hidden"
              @change="handleFileUpload"
            />
          </div>
        </UFormGroup>

        <div v-if="uploadedData.length" class="mt-6">
          <!-- Section Heading -->
          <h2
            class="text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-3"
          >
            Preview Complaints from Excel
            <UBadge color="gray" variant="soft" v-if="uploadedFileName">
              {{ uploadedFileName }}
            </UBadge>
          </h2>

          <!-- Display total, valid, and invalid counts -->
          <div class="flex justify-between mb-4 text-gray-600">
            <div class="text-sm font-medium">
              Total Complaints: {{ totalCount }}
            </div>
            <div class="text-sm font-medium">
              Valid Complaints: {{ validCount }}
            </div>
            <div class="text-sm font-medium">
              Invalid Complaints: {{ invalidCount }}
            </div>
          </div>

          <!-- Validation Results Table -->
          <div
            v-if="uploadedData.length"
            class="overflow-x-auto bg-white shadow-md rounded-lg"
          >
            <!-- Table -->
            <table
              class="min-w-full table-auto border-collapse border border-gray-300"
            >
              <thead class="bg-teal-500 text-white">
                <tr>
                  <th class="px-4 py-2 text-left">Ref No</th>
                  <th class="px-4 py-2 text-left">Name</th>
                  <th class="px-4 py-2 text-left">Reference By</th>
                  <th class="px-4 py-2 text-left">Mobile No</th>
                  <th class="px-4 py-2 text-left">Ward No</th>
                  <th class="px-4 py-2 text-left">Address</th>
                  <th class="px-4 py-2 text-left">Electrician</th>
                  <th class="px-4 py-2 text-left">Pole No</th>
                  <th class="px-4 py-2 text-left">Complaint At</th>
                  <th class="px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, index) in uploadedData"
                  :key="index"
                  class="hover:bg-gray-100"
                >
                  <td class="px-4 py-2">{{ row.ref_no }}</td>
                  <td class="px-4 py-2">{{ row.name }}</td>
                  <td class="px-4 py-2">{{ row.reference_by }}</td>
                  <td class="px-4 py-2">{{ row.mobile_no }}</td>
                  <td class="px-4 py-2">{{ row.ward_no }}</td>
                  <td class="px-4 py-2">{{ row.address }}</td>
                  <td class="px-4 py-2">{{ row.electrician }}</td>
                  <td class="px-4 py-2">{{ row.pole_no }}</td>
                  <td class="px-4 py-2">{{ row.complaint_at }}</td>
                  <td
                    class="px-4 py-2"
                    :class="{
                      'text-green-500': row.isValid,
                      'text-red-500': !row.isValid,
                    }"
                  >
                    {{
                      row.isValid ? "✅ Valid" : "❌ " + row.validationReason
                    }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Submit Button -->
          <div class="flex justify-end mt-6">
            <u-button
              @click="submitExcel"
              color="teal"
              class="px-6 py-2 text-white bg-teal-500 hover:bg-teal-600 cursor-pointer transition-colors"
              :disabled="!validData.length"
            >
              Submit Excel Complaints
            </u-button>
          </div>
        </div>
        <div v-if="insertedComplaints.length" class="mt-6">
          <!-- Inserted Complaints Section -->
          <p class="text-sm text-gray-600 mb-2 font-medium">
            Successfully Inserted Complaints:
          </p>

          <!-- Inserted Complaints Table -->
          <div class="overflow-x-auto bg-white shadow-md rounded-lg">
            <u-table
              :data="insertedComplaints"
              :columns="excelColumns"
              class="w-full"
            />
          </div>
        </div>

        <div v-if="skippedComplaints.length" class="mt-6">
          <!-- Skipped Complaints Section -->
          <p class="text-sm text-gray-600 mb-2 font-medium">
            Skipped / Failed Complaints:
          </p>

          <!-- Skipped Complaints Table -->
          <div class="overflow-x-auto bg-white shadow-md rounded-lg">
            <u-table
              :data="skippedComplaints"
              :columns="excelColumns"
              class="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, render } from "vue";
import { useToast } from "#imports";
import * as XLSX from "xlsx";

const toast = useToast();
const access_key = localStorage.getItem("access_token");

const mode = ref<"form" | "excel">("form");
const fileInput = ref<HTMLInputElement | null>(null);
const insertedComplaints = ref<any[]>([]);
const skippedComplaints = ref<any[]>([]);
const uploadedData = ref([]);
const validData = ref([]);
const errorMessage = ref(null);
const uploadedFileName = ref<string | null>(null);
// Add these computed properties to calculate total, valid, and invalid counts
const totalCount = computed(() => uploadedData.value.length);
const validCount = computed(
  () => uploadedData.value.filter((row) => row.isValid).length
);
const invalidCount = computed(
  () => uploadedData.value.filter((row) => !row.isValid).length
);

// ---------------- Manual Form ----------------
const form = ref({
  name: "",
  mobile: "",
  wardNo: "",
  poleNo: "",
  address: "",
  electrician: null,

  // ✅ NEW FIELDS
  referenceBy: "",
  complaintDate: "",
});

const errors = reactive({
  name: null,
  mobile: null,
  wardNo: null,
  poleNo: null,
  address: null,
  electrician: null,
});

const excelColumns: ColumnDef<any>[] = [
  { accessorKey: "ref_no", header: "Ref No" },
  { accessorKey: "name", header: "Name" },
  { accessorKey: "mobile_no", header: "Mobile No" },
  { accessorKey: "ward_no", header: "Ward No" },
  { accessorKey: "pole_no", header: "Pole No" },
  { accessorKey: "address", header: "Address" },
  { accessorKey: "electrician", header: "Electrician" },
  { accessorKey: "status", header: "Status" },
  { accessorKey: "error_message", header: "Error Message" },
];

const electricians = ref<{ label: string; value: number }[]>([]);

onMounted(async () => {
  try {
    const res = await $fetch(
      "https://ayodhya.water.live/api/surveyNew.php?action=get_electrician",
      {
        method: "POST",
        body: { accesskey: access_key },
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
    toast.add({
      title: "Error",
      description: "Failed to load electricians list.",
      color: "red",
    });
  }
});

function resetForm() {
  form.value = {
    ...form.value,
    name: "",
    mobile: "",
    wardNo: "",
    poleNo: "",
    address: "",
    electrician: null,
    referenceBy: "",
    complaintDate: "",
  };
  Object.keys(errors).forEach((key) => (errors[key] = null));
}

function validate() {
  let valid = true;

  // Regex patterns
  const patterns = {
    name: {
      required: "Full name is required",
      regex: /^[A-Za-z\s]+$/,
      message: "Name cannot contain numbers or special characters",
    },
    mobile: {
      required: "Mobile number is required",
      regex: /^[6-9]\d{9}$/,
      message: "Enter a valid mobile number",
    },
    wardNo: {
      required: "Ward number is required",
      regex: /^[0-9]+$/,
      message: "Ward number must be digits only",
    },
    // poleNo: {
    // 	required: "Pole No. is required",
    // 	regex: /^[0-9]+$/,
    // 	message: "Pole number must be digits only",
    // },
    address: {
      required: "Address is required",
    },
    // electrician: {
    // 	required: "Please select an electrician",
    // },
  };

  // Validate each field dynamically
  for (const field in patterns) {
    const value = form.value[field];
    const { required, regex, message } = patterns[field];

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

async function handleSubmit() {
  if (!validate()) return;

  const payload = {
    accesskey: access_key,
    complaints: [
      {
        name: form.value.name,
        mobile_no: form.value.mobile,
        ward_no: form.value.wardNo,
        address: form.value.address,
        electrician: form.value.electrician,
        pole_no: form.value.poleNo,

        // ✅ NEW FIELDS
        reference_by: form.value.referenceBy,
        complaint_date: form.value.complaintDate,
      },
    ],
  };

  try {
    await $fetch(
      "https://ayodhya.water.live/api/surveyNew.php?action=ImportComplaint",
      {
        method: "POST",
        body: payload,
      }
    );
    toast.add({
      title: "Complaint Added",
      description: `Complaint for ${form.value.name} submitted successfully.`,
      color: "green",
    });
    resetForm();
  } catch (err) {
    console.error(err);
    toast.add({
      title: "Error",
      description: "Failed to submit complaint.",
      color: "red",
    });
  }
}

// Handle file upload
const handleFileUpload = async (event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  uploadedFileName.value = file.name; // ✅ Save file name

  if (file.size > 5 * 1024 * 1024) {
    toast.add({
      title: "Error",
      description: "File exceeds 5MB limit.",
      color: "red",
    });
    return;
  }

  if (file && file.name.endsWith(".xlsx")) {
    try {
      const data = await readExcelFile(file);
      const validated = validateData(data);
      uploadedData.value = validated; // full list including invalid rows
      validData.value = validated.filter((r) => r.isValid); // only valid rows
      errorMessage.value = null;
    } catch (error) {
      console.error(error);
      errorMessage.value = "Error reading or validating the file";
    }
  } else {
    errorMessage.value = "Please upload a valid Excel (.xlsx) file";
  }
};

// Read Excel file
const readExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const ab = e.target.result;
      const wb = XLSX.read(ab, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(sheet);
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as string[][];

      if (!rows.length) {
        toast.add({
          title: "Error",
          description: "Excel is empty.",
          color: "red",
        });
        return;
      }

      // Expected columns
      const expectedColumns = [
        "ref_no",
        "name",
        "reference_by",
        "mobile_no",
        "ward_no",
        "address",
        "electrician",
        "pole_no",
        "complaint_at",
      ];
      const headers = rows[0].map((h) => h.toString().trim().toLowerCase());

      const isValid = expectedColumns.every((col) => headers.includes(col));
      if (!isValid) {
        toast.add({
          title: "Error",
          description: `Invalid Excel format. Columns must include: ${expectedColumns.join(
            ", "
          )}`,
          color: "red",
        });
        return;
      }

      resolve(data);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

// Validate Data
const validateData = (data) => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD
  const mobileRegex = /^\d{10}$/; // 10 digits

  return data.map((row) => {
    let validationReason = "";
    let formattedDate = row.complaint_at;

    // Convert Excel numeric date to valid date string (if it's a number)
    if (row.complaint_at && !dateRegex.test(row.complaint_at)) {
      // Check if it's a number (Excel date format as serial number)
      if (!isNaN(row.complaint_at)) {
        formattedDate = XLSX.SSF.format("yyyy-mm-dd", row.complaint_at); // Converts serial number to date string
      }
    }

    // Validate fields
    const validMobile = row.mobile_no ? mobileRegex.test(row.mobile_no) : true;
    const validElectrician = row.electrician
      ? !isNaN(Number(row.electrician))
      : true;
    const validDate = row.complaint_at ? dateRegex.test(formattedDate) : true;

    if (row.mobile_no && !validMobile) {
      validationReason = "Invalid mobile number";
    } else if (row.complaint_at && !validDate) {
      validationReason = "Invalid date format";
    } else if (row.electrician && !validElectrician) {
      validationReason = "Electrician number should be numeric";
    }

    // Set final validity
    const isValid = !validationReason;
    const rowStatus = validationReason || "Valid";

    return {
      ...row,
      complaint_at: formattedDate,
      isValid,
      validationReason: rowStatus,
    };
  });
};

// Submit Data to API
const submitExcel = async () => {
  if (validData.value.length === 0) {
    alert("No data to submit.");
    return;
  }

  const payload = {
    accesskey: access_key,
    complaints: validData.value.map((row) => ({
      ref_no: row.ref_no,
      name: row.name,
      reference_by: row.reference_by,
      mobile_no: row.mobile_no,
      ward_no: row.ward_no,
      address: row.address,
      electrician: row.electrician,
      pole_no: row.pole_no,
      complaint_at: row.complaint_at,
      // Including validation info
      is_valid: row.isValid,
      validation_reason: row.validationReason,
    })),
  };

  try {
    const response = await fetch(
      "https://ayodhya.water.live/api/surveyNew.php?action=ImportComplaint",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );
    const result = await response.json();
    // alert(result.message || "Data submitted successfully!");

    // Split inserted and skipped
    insertedComplaints.value = result.inserted || [];
    skippedComplaints.value = result.skipped || [];

    toast.add({
      title: "Process Completed",
      description: `${insertedComplaints.value.length} inserted, ${skippedComplaints.value.length} skipped`,
      color: "green",
    });
    //     // Clear Excel preview
    validData.value = [];
  } catch (error) {
    console.error(err);
    toast.add({
      title: "Error",
      description: "Failed to submit Excel complaints.",
      color: "red",
    });
  }
};

const downloadSample = () => {
  // Headers
  const headers = [
    "ref_no",
    "name",
    "reference_by",
    "mobile_no",
    "ward_no",
    "address",
    "electrician",
    "pole_no",
    "complaint_at",
  ];

  // Sample data
  const sampleData = [
    [
      "REF001",
      "Name A",
      "Reference Name A",
      "9876543210",
      "1",
      "123 Main Street",
      1,
      "101",
      "2025-11-06",
    ],
    [
      "REF002",
      "Name B",
      "Reference Name B",
      "9123456789",
      "2",
      "456 Elm Street",
      2,
      "102",
      "2025-11-06",
    ],
    [
      "REF003",
      "Name C",
      "Reference Name A",
      "9988776655",
      "3",
      "789 Oak Avenue",
      3,
      "103",
      "2025-11-06",
    ],
  ];

  // Combine headers and data
  const worksheetData = [headers, ...sampleData];
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sample");
  XLSX.writeFile(workbook, "sample_complaints.xlsx");
};

</script>
