<script setup lang="ts" async>
definePageMeta({ ssr: false });
import { ref, computed, h } from "vue";
import type { ColumnDef } from "@tanstack/vue-table";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { useRouter } from "vue-router";
import { useToast } from "#imports";

const toast = useToast();
const router = useRouter();

interface Survey {
	id: number;
	user_id: number;
	ward_no: string;
	pole_no: string;
	watt: string;
	image_path: string;
	lat: string;
	lng: string;
	light_status: "Working" | "Not Working" | "N/A";
	message: string | null;
	is_active: number;
	created_at: string;
	updated_at: string | null;
}

// Pagination
const currentPage = ref(1);
const pageSize = ref(10);
const pageSizeOptions = [5, 10, 20, 50, 100]; // Rows per page options

// Filters
const wardFilter = ref("");
const poleFilter = ref("");
const wattFilter = ref("");
const statusFilter = ref<"All" | "Working" | "Not Working" | "N/A">("All");
const dateFilter = ref("");

// Modal
const showModal = ref(false);
const modalImageUrl = ref("");
// const config = useRuntimeConfig();
const { value } = useCookie("access_token"); // cookie name

// const accesskey = value;
const token = process.client ? localStorage.getItem("access_token") : null;
const accesskey = token;
const accessForm = 1;
// console.log(token);

// Fetch surveys with useAsyncData
const {
	data: surveyData,
	pending,
	error,
} = await useAsyncData(
	"surveys",
	async () => {
		const res = await $fetch<{ error: number; result: any[]; message?: string }>(
			"https://ayodhya.water.live/api/surveyNew.php?action=get_servey",
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: { accesskey, accessForm },
			}
		);

		// ✅ Handle access denied
		if (res.error === 1) {
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

		return res;
	},
	{ lazy: true }
);

console.log(surveyData?.value?.result ?? []);
// const data = surveyData?.value?.result ?? [];

// Reactive main data array
const data = computed(() => surveyData?.value?.result ?? []);
// onMounted(() => {
//    fetchData(true);
//    const data

// });

// Filtered Data
const filteredData = computed(() => {
	currentPage.value = 1;
	let items = data.value;

	if (wardFilter.value.trim()) items = items.filter((i) => i.ward_no === wardFilter.value.trim());
	if (poleFilter.value.trim()) items = items.filter((i) => i.pole_no === poleFilter.value.trim());
	if (wattFilter.value.trim()) items = items.filter((i) => i.watt === wattFilter.value.trim());
	if (statusFilter.value !== "All") items = items.filter((i) => i.light_status === statusFilter.value);
	if (dateFilter.value) {
		items = items.filter((i) => new Date(i.created_at).toISOString().split("T")[0] === dateFilter.value);
	}

	return items;
});

// Summary cards
const totalSurveys = computed(() => filteredData.value.length);
const totalWorking = computed(() => filteredData.value.filter((i) => i.light_status === "Working").length);
const totalNotWorking = computed(() => filteredData.value.filter((i) => i.light_status === "Not Working").length);
const totalNA = computed(() => filteredData.value.filter((i) => i.light_status === "N/A").length);

// Pagination
const totalPages = computed(() =>
	filteredData.value.length ? Math.ceil(filteredData.value.length / pageSize.value) : 1
);

const paginatedData = computed(() => {
	let sorted = [...filteredData.value];

	if (sortBy.value) {
		sorted.sort((a, b) => {
			const aVal = a[sortBy.value!];
			const bVal = b[sortBy.value!];

			if (typeof aVal === "number" && typeof bVal === "number")
				return sortDir.value === "asc" ? aVal - bVal : bVal - aVal;
			if (typeof aVal === "string" && typeof bVal === "string")
				return sortDir.value === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
			return 0;
		});
	}

	const start = (currentPage.value - 1) * pageSize.value;
	return sorted.slice(start, start + pageSize.value);
});

// Sorting
const sortBy = ref<keyof Survey | null>(null);
const sortDir = ref<"asc" | "desc">("asc");

function renderSortableHeader(label: string, key: keyof Survey) {
	return h(
		"div",
		{
			class: "flex items-center justify-center gap-1 cursor-pointer select-none",
			onClick: () => {
				if (sortBy.value === key) sortDir.value = sortDir.value === "asc" ? "desc" : "asc";
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
		meta: { class: { th: "text-center cursor-pointer", td: "text-center" } },
	},
	{
		accessorKey: "ward_no",
		header: () => renderSortableHeader("Ward No", "ward_no"),
		meta: { class: { th: "text-center cursor-pointer", td: "text-center" } },
	},
	{
		accessorKey: "pole_no",
		header: () => renderSortableHeader("Pole No", "pole_no"),
		meta: { class: { th: "text-center cursor-pointer", td: "text-center" } },
	},
	{
		accessorKey: "watt",
		header: () => renderSortableHeader("Watt", "watt"),
		meta: { class: { th: "text-center cursor-pointer", td: "text-center" } },
	},
	{
		accessorKey: "image_path",
		header: "Image",
		cell: ({ row }) => {
			const imageFileName = row.getValue("image_path") as string;
			const imageUrl = baseImageUrl_thmb + imageFileName;
			const imageUrl_act = baseImageUrl + imageFileName;
			return h("img", {
				src: imageUrl,
				class: "w-10 h-10 object-cover rounded cursor-zoom-in border border-gray-200",
				loading: "lazy",
				onClick: () => {
					modalImageUrl.value = imageUrl_act;
					showModal.value = true;
				},
			});
		},
	},
	{
		accessorKey: "light_status",
		header: "Status",
		cell: ({ row }) => {
			const status = row.getValue("light_status") as string;
			const colorMap = {
				Working: "text-emerald-600 bg-emerald-50",
				"Not Working": "text-rose-600 bg-rose-50",
				"N/A": "text-gray-600 bg-gray-100",
			};
			return h(
				"span",
				{ class: `inline-block rounded px-2 py-1 text-sm font-semibold ${colorMap[status] || ""}` },
				status
			);
		},
	},
	{
		accessorKey: "created_at",
		header: () => renderSortableHeader("Created At", "created_at"),
		cell: ({ row }) => {
			const date = new Date(row.getValue("created_at"));
			return h(
				"span",
				{ class: "text-gray-600 text-sm" },
				date.toLocaleString("en-US", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
			);
		},
		meta: { class: { th: "text-center cursor-pointer", td: "text-center" } },
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
		"Mast",
		"Mast Quantity",
		"Department",
		"Created At",
		"Image Path",
	];

	// 👇 Base path from API response
	const baseImgPath = surveyData.value?.img_path || "";

	const rows = filteredData.value.map((item) => [
		item.id,
		item.ward_no,
		item.pole_no,
		item.watt,
		item.lat,
		item.lng,
		item.light_status,
		item.message || "-",
		item.mast || "-",
		item.mast_qty || "-",
		item.department || "-",
		new Date(item.created_at).toLocaleString(), // format date
		baseImgPath + item.image_path, // 👈 full image URL
	]);

	const csvContent =
		"data:text/csv;charset=utf-8," +
		[headers, ...rows]
			.map((row) =>
				row
					.map((field) => `"${String(field).replace(/"/g, '""')}"`) // 👈 escape commas & quotes
					.join(",")
			)
			.join("\n");

	const link = document.createElement("a");
	link.setAttribute("href", encodeURI(csvContent));
	link.setAttribute("download", "survey_records.csv");
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}

// Export PDF
// async function exportPDF() {
// 	if (!process.client) return;

// 	const { jsPDF } = await import("jspdf");
// 	const autoTable = (await import("jspdf-autotable")).default;

// 	const doc = new jsPDF("l", "pt", "a4"); // landscape A4

// 	doc.setFontSize(14);
// 	doc.text("Survey Records", 40, 30);

// 	const baseImgPath = surveyData.value?.img_path || ""; // 👈 from your API

// 	autoTable(doc, {
// 		head: [
// 			[
// 				"ID",
// 				"Ward No",
// 				"Pole No",
// 				"Watt",
// 				"Latitude",
// 				"Longitude",
// 				"Light Status",
// 				"Message",
// 				"Mast",
// 				"Mast Qty",
// 				"Department",
// 				"Created At",
// 				"Image Path",
// 			],
// 		],
// 		body: filteredData.value.map((item) => [
// 			item.id,
// 			item.ward_no,
// 			item.pole_no,
// 			item.watt,
// 			item.lat,
// 			item.lng,
// 			item.light_status,
// 			item.message || "-",
// 			item.mast || "-",
// 			item.mast_qty || "-",
// 			item.department || "-",
// 			new Date(item.created_at).toLocaleString(),
// 			baseImgPath + item.image_path, // 👈 full image URL
// 		]),
// 		startY: 50,
// 		styles: {
// 			fontSize: 8,
// 			cellPadding: 3,
// 			overflow: "linebreak", // wrap long URLs
// 		},
// 		headStyles: {
// 			fillColor: [22, 160, 133],
// 			textColor: 255,
// 			halign: "center",
// 		},
// 		columnStyles: {
// 			0: { halign: "center", cellWidth: 40 }, // ID
// 			1: { halign: "center", cellWidth: 50 }, // Ward
// 			2: { halign: "center", cellWidth: 50 }, // Pole
// 			3: { halign: "center", cellWidth: 40 }, // Watt
// 			4: { cellWidth: 60 }, // Latitude
// 			5: { cellWidth: 60 }, // Longitude
// 			6: { halign: "center", cellWidth: 70 }, // Light Status
// 			7: { cellWidth: 100 }, // Message
// 			8: { cellWidth: 50 }, // Mast
// 			9: { cellWidth: 60 }, // Mast Qty
// 			10: { cellWidth: 80 }, // Department
// 			11: { cellWidth: 80 }, // Created At
// 			12: { cellWidth: 160 }, // Image Path (make wider to fit URL)
// 		},
// 		didDrawPage: (data) => {
// 			doc.setFontSize(10);
// 			doc.text(
// 				`Page ${doc.internal.getNumberOfPages()}`,
// 				doc.internal.pageSize.getWidth() - 60,
// 				doc.internal.pageSize.getHeight() - 20
// 			);
// 		},
// 	});

// 	doc.save("survey_records.pdf");
// }

// Dropdown Options
const wardOptions = computed(() => [...new Set(data.value.map((i) => i.ward_no))].sort());
const wattOptions = computed(() => [...new Set(data.value.map((i) => i.watt))].sort());
</script>

<template>
	<!-- Loading State -->
	<div v-if="pending" class="flex justify-center items-center py-10">
		<div class="h-8 w-8 border-4 text-teal-600 border-t-transparent rounded-full animate-spin"></div>
	</div>

	<!-- Error State -->
	<div v-else-if="error" class="text-center py-10 text-red-500">Failed to load surveys.</div>

	<!-- Main Content -->
	<div v-else>
		<!-- Summary Cards  -->
		<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 light">
			<!-- Total Surveys -->
			<UCard class="rounded-lg shadow-sm flex flex-col justify-between h-full ring-2 border">
				<div class="flex items-center justify-between">
					<Icon name="mdi:clipboard-list-outline" size="22" class="text-emerald-500" />
					<div class="text-right">
						<div class="text-xs font-medium text-gray-500">Total Surveys</div>
						<div class="text-lg font-bold text-emerald-700">{{ totalSurveys }}</div>
					</div>
				</div>
			</UCard>

			<!-- Working -->
			<UCard class="rounded-lg shadow-sm flex flex-col justify-between h-full ring-2 border">
				<div class="flex items-center justify-between">
					<Icon name="mdi:check-circle-outline" size="22" class="text-emerald-600" />
					<div class="text-right">
						<div class="text-xs font-medium text-gray-500">Working</div>
						<div class="text-lg font-bold text-emerald-700">{{ totalWorking }}</div>
					</div>
				</div>
				<div>
					<div class="w-full bg-emerald-100 rounded-full h-1 mt-1">
						<div
							class="bg-emerald-500 h-1 rounded-full"
							:style="{ width: ((totalWorking / totalSurveys) * 100 || 0) + '%' }"
						></div>
					</div>
					<div class="text-[10px] text-emerald-600 mt-1 text-right">
						{{ ((totalWorking / totalSurveys) * 100).toFixed(1) || 0 }}%
					</div>
				</div>
			</UCard>

			<!-- Not Working -->
			<UCard class="rounded-lg shadow-sm flex flex-col justify-between h-full ring-2 border">
				<div class="flex items-center justify-between">
					<Icon name="mdi:close-circle-outline" size="22" class="text-rose-600" />
					<div class="text-right">
						<div class="text-xs font-medium text-gray-500">Not Working</div>
						<div class="text-lg font-bold text-rose-700">{{ totalNotWorking }}</div>
					</div>
				</div>
				<div>
					<div class="w-full bg-rose-100 rounded-full h-1 mt-1">
						<div
							class="bg-rose-500 h-1 rounded-full"
							:style="{ width: ((totalNotWorking / totalSurveys) * 100 || 0) + '%' }"
						></div>
					</div>
					<div class="text-[10px] text-rose-600 mt-1 text-right">
						{{ ((totalNotWorking / totalSurveys) * 100).toFixed(1) || 0 }}%
					</div>
				</div>
			</UCard>

			<!-- N/A -->
			<UCard class="rounded-lg shadow-sm flex flex-col justify-between h-full ring-2 border">
				<div class="flex items-center justify-between">
					<Icon name="mdi:help-circle-outline" size="22" class="text-gray-500" />
					<div class="text-right">
						<div class="text-xs font-medium text-gray-500">N/A</div>
						<div class="text-lg font-bold text-gray-700">{{ totalNA }}</div>
					</div>
				</div>
				<div>
					<div class="w-full bg-gray-200 rounded-full h-1 mt-1">
						<div
							class="bg-gray-500 h-1 rounded-full"
							:style="{ width: ((totalNA / totalSurveys) * 100 || 0) + '%' }"
						></div>
					</div>
					<div class="text-[10px] text-gray-600 mt-1 text-right">
						{{ ((totalNA / totalSurveys) * 100).toFixed(1) || 0 }}%
					</div>
				</div>
			</UCard>
		</div>

		<!-- Filters & Table -->
		<div>
			<!-- Filters and Table go here (same as your template) -->
			<div class="compact-accordion">
				<!-- Outer card (we keep it but remove its padding via deep selector) -->
				<UCard class="light ring-2 mb-4 border !p-0">
					<!-- Accordion: note we also put !p-0 here as a hint, but real override is in CSS below -->
					<UAccordion
						:items="[{ label: 'Filters', icon: 'mdi:filter-outline', slot: 'filters' }]"
						class="!p-0"
					>
						<template #filters>
							<!-- Inner card: remove its default padding and control spacing with grid's p-3 -->
							<UCard
								class="w-full bg-white border border-slate-200 shadow-sm mb-3 rounded-lg ring-0 !p-0"
							>
								<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-3 filters-grid">
									<!-- Ward -->
									<div class="flex flex-col">
										<label class="text-xs font-medium text-gray-700 flex items-center gap-1 mb-1">
											<Icon name="mdi:home-city-outline" size="16" class="text-emerald-600" />
											Ward
										</label>
										<select
											v-model="wardFilter"
											class="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400"
										>
											<option value="">All</option>
											<option v-for="ward in wardOptions" :key="ward" :value="ward">
												{{ ward }}
											</option>
										</select>
									</div>

									<!-- Pole -->
									<div class="flex flex-col">
										<label class="text-xs font-medium text-gray-700 flex items-center gap-1 mb-1">
											<Icon name="mdi:transmission-tower" size="16" class="text-blue-500" />
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
									<div class="flex flex-col">
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
									</div>

									<!-- Status -->
									<div class="flex flex-col">
										<label class="text-xs font-medium text-gray-700 flex items-center gap-1 mb-1">
											<Icon name="mdi:check-decagram-outline" size="16" class="text-purple-500" />
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
										<label class="text-xs font-medium text-gray-700 flex items-center gap-1 mb-1">
											<Icon name="mdi:calendar-month-outline" size="16" class="text-pink-500" />
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

			<!-- Table -->

			<UCard class="w-full bg-white p-4 ring-2 border shadow-sm light">
				<!-- Table Header with Export Icons -->
				<div class="flex justify-between items-center mb-2">
					<h3 class="text-sm font-medium text-gray-700">Survey Records</h3>

					<!-- Export Buttons as Small Icons -->
					<div class="flex gap-2">
						<!-- Page Select -->
						<div class="flex items-center gap-2 text-sm text-gray-700 px-5 py-1">
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
						<!-- <button
							@click="exportPDF"
							class="p-2 rounded-md bg-red-500 text-white hover:bg-red-600 transition"
							title="Export PDF"
						>
							<Icon name="mdi:file-pdf-box" size="16" />
						</button> -->
					</div>
				</div>

				<!-- Table -->
				<div class="relative w-full rounded shadow-sm overflow-hidden">
					<UTable :data="paginatedData" :columns="columns" class="w-full" />
				</div>

				<!-- Pagination -->
				<div class="flex items-center justify-between mt-3">
					<span class="text-xs text-gray-500">
						Showing <strong>{{ paginatedData.length }}</strong> of
						<strong>{{ filteredData.length }}</strong> records — Page <strong>{{ currentPage }}</strong> of
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
			<div
				v-if="showModal"
				class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
				@click.self="showModal = false"
			>
				<div class="bg-white p-4 rounded shadow-lg max-w-[90vw] max-h-[90vh] overflow-auto">
					<img :src="modalImageUrl" class="max-w-full max-h-[80vh] rounded" />
					<button
						class="mt-2 px-4 py-1 bg-red-600 text-white rounded hover:bg-red-700"
						@click="showModal = false"
					>
						Close
					</button>
				</div>
			</div>
		</div>
	</div>
</template>
<style>
/* .custom-pagination :deep(button),
.custom-pagination :deep(a),
.custom-pagination :deep(li) {
	cursor: pointer;
}
.compact-accordion :deep(.p-4),
.compact-accordion :deep(.px-4),
.compact-accordion :deep(.py-4) {
	padding-left: 5 !important;
	padding-right: 5 !important;
	padding-top: 0 !important;
	padding-bottom: 0 !important;
} */
</style>
