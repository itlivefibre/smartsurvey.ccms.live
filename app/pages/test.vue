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

        <div v-if="excelComplaints.length" class="mt-4">
          <p class="text-sm text-gray-600 mb-2">
            Preview complaints from Excel:
          </p>
          <ul
            class="list-disc list-inside text-sm text-gray-700 max-h-40 overflow-y-auto"
          >
            <li v-for="(c, i) in excelComplaints" :key="i">
              {{ c.ref_no }} — Complaint Name {{ c.name }} — Mobile No.
              {{ c.mobile_no }} — Ward {{ c.ward_no }} — Electrician
              {{ c.electrician }} Pole No — {{ c.pole_no }}
            </li>
          </ul>
          <UButton
            @click="submitExcel"
            color="teal"
            class="mt-4 px-6 py-2 text-white bg-teal-500 cursor-pointer"
          >
            Submit Excel Complaints
          </UButton>
        </div>
        <div v-if="insertedComplaints.length" class="mt-6">
          <p class="text-sm text-gray-600 mb-2 font-medium">
            Successfully Inserted Complaints:
          </p>
          <UTable
            :data="insertedComplaints"
            :columns="excelColumns"
            class="w-full"
          />
        </div>

        <div v-if="skippedComplaints.length" class="mt-6">
          <p class="text-sm text-gray-600 mb-2 font-medium">
            Skipped / Failed Complaints:
          </p>
          <UTable
            :data="skippedComplaints"
            :columns="excelColumns"
            class="w-full"
          />
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
const excelComplaints = ref<any[]>([]);
const fileInput = ref<HTMLInputElement | null>(null);
const insertedComplaints = ref<any[]>([]);
const skippedComplaints = ref<any[]>([]);
// console.log("excelcomplaint",excelComplaints)

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

// const excelColumns: ColumnDef<any>[] = [
//   { accessorKey: "ref_no", header: "Ref No" },
//   { accessorKey: "name", header: "Name" },
//   { accessorKey: "mobile_no", header: "Mobile No" },
//   { accessorKey: "ward_no", header: "Ward No" },
//   { accessorKey: "pole_no", header: "Pole No" },
//   { accessorKey: "address", header: "Address" },
//   { accessorKey: "electrician", header: "Electrician" },
//   { accessorKey: "status", header: "Status" },
//   { accessorKey: "error_message", header: "Error Message" },
// ];

const excelColumns: ColumnDef<any>[] = [
  { accessorKey: "ref_no", header: "Ref No" },
  { accessorKey: "name", header: "Name" },
  { accessorKey: "mobile_no", header: "Mobile No" },
  { accessorKey: "ward_no", header: "Ward No" },
  { accessorKey: "pole_no", header: "Pole No" },
  { accessorKey: "address", header: "Address" },
  { accessorKey: "electrician", header: "Electrician" },

  // ✅ NEW PREVIEW COLUMNS
  { accessorKey: "reference_by", header: "Reference By" },
  { accessorKey: "complaint_date", header: "Complaint Date" },

  { accessorKey: "status", header: "Status" },
  { accessorKey: "error_message", header: "Error Message" },
];

const electricians = ref<{ label: string; value: number }[]>([]);

onMounted(async () => {
  // try {
  // 	const res = await $fetch("/api/complaints/new-ref");
  // 	form.value.refNo = res.refNo || `TEMP-${Date.now()}`;
  // } catch {
  // 	form.value.refNo = `TEMP-${Date.now()}`;
  // }

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
  //   console.log(validate());
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

// ---------------- Excel Upload ----------------
// function handleFileUpload(e: Event) {
// 	const file = (e.target as HTMLInputElement).files?.[0];
// 	if (!file) return;

// 	if (file.size > 5 * 1024 * 1024) {
// 		toast.add({ title: "Error", description: "File exceeds 5MB limit.", color: "red" });
// 		return;
// 	}

// 	const reader = new FileReader();
// 	reader.onload = (evt) => {
// 		const data = new Uint8Array(evt.target?.result as ArrayBuffer);
// 		const workbook = XLSX.read(data, { type: "array" });
// 		const sheet = workbook.Sheets[workbook.SheetNames[0]];
// 		const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as string[][];

// 		if (!rows.length) {
// 			toast.add({ title: "Error", description: "Excel is empty.", color: "red" });
// 			return;
// 		}

// 		// ✅ Expected columns
// 		const expectedColumns = ["ref_no", "name", "mobile_no", "ward_no", "address", "electrician", "pole_no"];

// 		const headers = rows[0].map((h) => h.toString().trim().toLowerCase());
// 		const isValid = expectedColumns.every((col) => headers.includes(col));

// 		if (!isValid) {
// 			toast.add({
// 				title: "Error",
// 				description: `Invalid Excel format. Columns must include: ${expectedColumns.join(", ")}`,
// 				color: "red",
// 			});
// 			return;
// 		}

// 		// Map rows (skip header)
// 		const dataRows = rows.slice(1);
// 		excelComplaints.value = dataRows.map((row) => ({
// 			ref_no: row[headers.indexOf("ref_no")] || "",
// 			name: row[headers.indexOf("name")] || "",
// 			mobile_no: row[headers.indexOf("mobile_no")] || "",
// 			ward_no: row[headers.indexOf("ward_no")] || "",
// 			address: row[headers.indexOf("address")] || "",
// 			electrician: row[headers.indexOf("electrician")] || null,
// 			pole_no: row[headers.indexOf("pole_no")] || "",
// 		}));

// 		toast.add({
// 			title: "Excel Loaded",
// 			description: `${excelComplaints.value.length} complaints loaded.`,
// 			color: "green",
// 		});
// 	};
// 	reader.readAsArrayBuffer(file);
// }

function handleFileUpload(e: Event) {
  console.log("e", e);
  const file = (e.target as HTMLInputElement).files?.[0];
  console.log("file", file);
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    toast.add({
      title: "Error",
      description: "File exceeds 5MB limit.",
      color: "red",
    });
    return;
  }

  const reader = new FileReader();

  reader.onload = (evt) => {
    const data = new Uint8Array(evt.target?.result as ArrayBuffer);
    const workbook = XLSX.read(data, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
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
    // const expectedColumns = [
    //   "ref_no",
    //   "name",
    //   "mobile_no",
    //   "ward_no",
    //   "address",
    //   "electrician",
    //   "pole_no",
    // ];
    const expectedColumns = [
      "ref_no",
      "name",
      "mobile_no",
      "ward_no",
      "address",
      "electrician",
      "pole_no",
      "reference_by",
      "complaint_date",
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

    // Process rows with validation
    const dataRows = rows.slice(1);
    // excelComplaints.value = dataRows.map((row, index) => {
    //   const mobile = row[headers.indexOf("mobile_no")]?.toString().trim() || "";
    //   const mobilePattern = /^[6-9]\d{9}$/;

    //   return {
    //     ref_no: row[headers.indexOf("ref_no")] || "",
    //     name: row[headers.indexOf("name")] || "",
    //     mobile_no: mobile,
    //     ward_no: row[headers.indexOf("ward_no")] || "",
    //     address: row[headers.indexOf("address")] || "",
    //     electrician: row[headers.indexOf("electrician")] || null,
    //     pole_no: row[headers.indexOf("pole_no")] || "",
    //     status: mobilePattern.test(mobile) ? "Valid" : "Invalid",
    //     error_message: mobilePattern.test(mobile)
    //       ? ""
    //       : "Invalid mobile number",
    //   };
    // });

    excelComplaints.value = dataRows.map((row, index) => {
      const mobile = row[headers.indexOf("mobile_no")]?.toString().trim() || "";
      const mobilePattern = /^[6-9]\d{9}$/;

      return {
        ref_no: row[headers.indexOf("ref_no")] || "",
        name: row[headers.indexOf("name")] || "",
        mobile_no: mobile,
        ward_no: row[headers.indexOf("ward_no")] || "",
        address: row[headers.indexOf("address")] || "",
        electrician: row[headers.indexOf("electrician")] || null,
        pole_no: row[headers.indexOf("pole_no")] || "",

        // ✅ NEW FIELDS
        reference_by: row[headers.indexOf("reference_by")] || "",
        complaint_date: row[headers.indexOf("complaint_date")] || "",

        status: mobilePattern.test(mobile) ? "Valid" : "Invalid",
        error_message: mobilePattern.test(mobile)
          ? ""
          : "Invalid mobile number",
      };
    });

    const invalidCount = excelComplaints.value.filter(
      (r) => r.status === "Invalid"
    ).length;

    if (invalidCount > 0) {
      toast.add({
        title: "Validation Error",
        description: `${invalidCount} row(s) have invalid mobile numbers.`,
        color: "red",
      });
    } else {
      toast.add({
        title: "Excel Loaded",
        description: `${excelComplaints.value.length} complaints loaded.`,
        color: "green",
      });
    }
  };

  reader.readAsArrayBuffer(file);
}

async function submitExcel() {
  if (!excelComplaints.value.length) {
    toast.add({
      title: "Error",
      description: "No complaints loaded from Excel.",
      color: "red",
    });
    return;
  }

  // const payload = { accesskey: access_key, complaints: excelComplaints.value };
  // console.log("import_payload",payload)

  const payload = {
    accesskey: access_key,
    complaints: excelComplaints.value.map((c) => ({
      ...c,

      // ✅ ensure keys match API naming
      reference_by: c.reference_by,
      complaint_date: c.complaint_date,
    })),
    
  };

  try {
    const res = await $fetch(
      "https://ayodhya.water.live/api/surveyNew.php?action=ImportComplaint",
      {
        method: "POST",
        body: payload,
      }
    );

    // Split inserted and skipped
    insertedComplaints.value = res.inserted || [];
    skippedComplaints.value = res.skipped || [];

    toast.add({
      title: "Process Completed",
      description: `${insertedComplaints.value.length} inserted, ${skippedComplaints.value.length} skipped`,
      color: "green",
    });

    // Clear Excel preview
    excelComplaints.value = [];
  } catch (err) {
    console.error(err);
    toast.add({
      title: "Error",
      description: "Failed to submit Excel complaints.",
      color: "red",
    });
  }
}
const downloadSample = () => {
  // Headers
  // const headers = [
  //   "ref_no",
  //   "name",
  //   "mobile_no",
  //   "ward_no",
  //   "address",
  //   "electrician",
  //   "pole_no",
  // ];

  const headers = [
    "ref_no",
    "name",
    "mobile_no",
    "ward_no",
    "address",
    "electrician",
    "pole_no",

    // ✅ NEW HEADERS
    "reference_by",
    "complaint_date",
  ];

  // Sample data
  // const sampleData = [
  //   [
  //     "REF001",
  //     "Name A",
  //     "9876543210",
  //     "1",
  //     "123 Main Street",
  //     "Electrician A",
  //     "101",
  //   ],
  //   [
  //     "REF002",
  //     "Name B",
  //     "9123456789",
  //     "2",
  //     "456 Elm Street",
  //     "Electrician B",
  //     "102",
  //   ],
  //   [
  //     "REF003",
  //     "Name C",
  //     "9988776655",
  //     "3",
  //     "789 Oak Avenue",
  //     "Electrician C",
  //     "103",
  //   ],
  // ];
  const sampleData = [
    [
      "REF001",
      "Name A",
      "9876543210",
      "1",
      "123 Main Street",
      "1",
      "101",
      "Person A",
      "2025-01-01",
    ],
    [
      "REF002",
      "Name B",
      "9123456789",
      "2",
      "456 Elm Street",
      "2",
      "102",
      "Person B",
      "2025-01-02",
    ],
    [
      "REF003",
      "Name C",
      "9988776655",
      "3",
      "789 Oak Avenue",
      "3",
      "103",
      "Person C",
      "2025-01-03",
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
