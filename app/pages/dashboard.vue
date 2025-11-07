<!-- <script setup lang="ts">
definePageMeta({
	ssr: false,
});

import { ref, onMounted } from "vue";
import { useToast } from "#imports";
import { useRouter } from "vue-router";

const router = useRouter();
const toast = useToast();

const totalSurveys = ref<number | null>(null);
const totalComplaints = ref<number | null>(null);
const loading = ref(true);

const accessForm = 1;

// Separate date filters
const surveyDate = ref("");
const complaintDate = ref("");

// Table data
const surveyUsers = ref<any[]>([]);
const complaintUsers = ref<any[]>([]);

async function fetchCards() {
	try {
		const token = process.client ? localStorage.getItem("access_token") : null;
		const accesskey = token;

		const [surveyRes, complaintRes] = await Promise.all([
			$fetch<{ error: number; total_count: number }>(
				"https://ayodhya.water.live/api/surveyNew.php?action=get_servey",
				{ method: "POST", body: { accesskey, accessForm } }
			),
			$fetch<{ error: number; total_count: number }>(
				"https://ayodhya.water.live/api/surveyNew.php?action=get_complaint",
				{ method: "POST", body: { accesskey, accessForm } }
			),
		]);
		// console.log("surv", surveyRes);

		if (surveyRes.error === 1 || complaintRes.error === 1) {
			localStorage.removeItem("access_token");
			toast.add({
				title: "Access Denied",
				description: "Your session has expired. Please login again.",
				color: "red",
			});
			router.push("/login").then(() => {
				window.location.reload();
			});
			return;
		}

		if (surveyRes.error === 0) totalSurveys.value = surveyRes.total_count;
		if (complaintRes.error === 0) totalComplaints.value = complaintRes.total_count;

		loading.value = false;
	} catch (err) {
		console.error("Fetch cards error:", err);
		toast.add({
			title: "Error",
			description: "Failed to load totals",
			color: "red",
		});
		loading.value = false;
	}
}

// Fetch Surveys
async function fetchSurveys() {
	try {
		const token = process.client ? localStorage.getItem("access_token") : null;
		const accesskey = token;

		const surveyRes = await $fetch<any>(
			"https://ayodhya.water.live/api/surveyNew.php?action=get_dashboard_survey",
			{
				method: "POST",
				body: { accesskey, accessForm, from_date: surveyDate.value },
			}
		);
		console.log("dashboard_survey", surveyRes.result);

		surveyUsers.value = surveyRes.error === 0 ? surveyRes.result?.survey_count_by_user ?? [] : [];
	} catch (err) {
		console.error("Fetch survey error:", err);
		toast.add({
			title: "Error",
			description: "Failed to load survey table",
			color: "red",
		});
	}
}

// Fetch Complaints
async function fetchComplaints() {
	try {
		const token = process.client ? localStorage.getItem("access_token") : null;
		const accesskey = token;

		const complaintRes = await $fetch<any>(
			"https://ayodhya.water.live/api/surveyNew.php?action=get_dashboard_complaints",
			{
				method: "POST",
				body: { accesskey, from_date: complaintDate.value },
			}
		);

		complaintUsers.value = complaintRes.error === 0 ? complaintRes.result?.complaint_count_by_user ?? [] : [];
	} catch (err) {
		console.error("Fetch complaints error:", err);
		toast.add({
			title: "Error",
			description: "Failed to load complaint table",
			color: "red",
		});
	}
}

function resetSurveyDate() {
	surveyDate.value = "";
	fetchSurveys();
}

function resetComplaintDate() {
	complaintDate.value = "";
	fetchComplaints();
}

onMounted(() => {
	fetchCards();
	fetchSurveys();
	fetchComplaints();
});
</script> -->

<script setup lang="ts">
definePageMeta({ ssr: false });

import { ref, onMounted } from "vue";
import { useToast } from "#imports";
import { useRouter } from "vue-router";

// // Sample data from your API
// const wattsData = ref([
// 	{ watt: "", count: 634 },
// 	{ watt: "0", count: 230 },
// 	{ watt: "110", count: 699 },
// 	{ watt: "120", count: 40 },
// 	{ watt: "140", count: 87 },
// 	{ watt: "18", count: 1224 },
// 	{ watt: "180", count: 5 },
// 	{ watt: "190", count: 2 },
// 	{ watt: "20", count: 3284 },
// 	{ watt: "200", count: 1 },
// 	{ watt: "35", count: 11307 },
// 	{ watt: "45", count: 1749 },
// 	{ watt: "60", count: 1293 },
// 	{ watt: "70", count: 7275 },
// 	{ watt: "90", count: 167 },
// ]);

// // Prepare data for ApexCharts
// const chartSeries = ref(wattsData.value.map((d) => d.count));
// const chartLabels = ref(wattsData.value.map((d) => d.watt || "N/A"));

// // ApexChart options
// const chartOptions = ref({
// 	chart: {
// 		type: "pie",
// 	},
// 	labels: chartLabels.value,
// 	legend: {
// 		position: "bottom",
// 		labels: {
// 			colors: "#374151", // Tailwind gray-700
// 		},
// 	},
// 	responsive: [
// 		{
// 			breakpoint: 640,
// 			options: {
// 				chart: { width: "100%" },
// 				legend: { position: "bottom" },
// 			},
// 		},
// 	],
// 	colors: [
// 		"#6366F1",
// 		"#8B5CF6",
// 		"#10B981",
// 		"#F59E0B",
// 		"#EF4444",
// 		"#3B82F6",
// 		"#14B8A6",
// 		"#A855F7",
// 		"#F43F5E",
// 		"#84CC16",
// 	],
// });

const router = useRouter();
const toast = useToast();

// Loading states
const loading = ref(true);
const loadingSurveys = ref(false);
const loadingComplaints = ref(false);
const refreshingSurveys = ref(false);
const refreshingComplaints = ref(false);

// Animated counters
const animatedSurveys = ref(0);
const animatedComplaints = ref(0);

// Total counts
const totalSurveys = ref<number>(0);
const totalComplaints = ref<number>(0);

// Filters
const surveyDate = ref("");
const complaintDate = ref("");

// Detailed survey stats
const surveyWorking = ref<number>(0);
const surveyNotWorking = ref<number>(0);
const surveyNA = ref<number>(0);

// Detailed complaint stats
const complaintWorking = ref(0);
const complaintNotWorking = ref(0);
const complaintNA = ref(0);

const animatedWorkingComplaints = ref(0);
const animatedNotWorkingComplaints = ref(0);
const animatedNAComplaints = ref(0);

const animatedWorking = ref(0);
const animatedNotWorking = ref(0);
const animatedNA = ref(0);
const today = new Date().toISOString().split("T")[0];

// Table data
interface UserSurvey {
	user_id: number;
	username: string;
	survey_count: number;
}
interface UserComplaint {
	user_id: number;
	username: string;
	complaint_count: number;
}

const surveyUsers = ref<UserSurvey[]>([]);
const complaintUsers = ref<UserComplaint[]>([]);

const accessForm = 1;

// Animate numbers
// function startCountUp(targetRef: typeof animatedSurveys, finalValue: number) {
// 	let current = 0;
// 	const increment = Math.ceil(finalValue / 40);
// 	const timer = setInterval(() => {
// 		current += increment;
// 		if (current >= finalValue) {
// 			current = finalValue;
// 			clearInterval(timer);
// 		}
// 		targetRef.value = current;
// 	}, 25);
// }
function startCountUp(targetRef: { value: number }, finalValue: number, duration = 1000) {
	const frameRate = 25; // ms per frame
	const totalFrames = Math.ceil(duration / frameRate);
	let currentFrame = 0;
	const increment = finalValue / totalFrames;

	const timer = setInterval(() => {
		currentFrame++;
		targetRef.value = Math.min(Math.round(increment * currentFrame), finalValue);

		if (currentFrame >= totalFrames) {
			clearInterval(timer);
			targetRef.value = finalValue; // ensure exact value at end
		}
	}, frameRate);
}

// 🔹 Fetch Surveys
async function fetchSurveys() {
	loadingSurveys.value = true;
	if (surveyDate.value && surveyDate.value > today) {
		toast.add({
			title: "Invalid Date",
			description: "Future dates are not allowed.",
			color: "red",
		});
		return;
	}
	try {
		const token = process.client ? localStorage.getItem("access_token") : "";
		const res = await $fetch<any>("https://ayodhya.water.live/api/surveyNew.php?action=get_dashboard_survey", {
			method: "POST",
			body: { accesskey: token, accessForm, from_date: surveyDate.value },
		});

		if (res.error === 1) {
			localStorage.removeItem("access_token");
			toast.add({ title: "Access Denied", description: "Session expired", color: "red" });
			router.push("/login").then(() => window.location.reload());
			return;
		}

		// totalSurveys.value = res.result?.survey_records_count?.total_surveys ?? 0;
		surveyUsers.value = res.result?.survey_count_by_user ?? [];
		totalSurveys.value = res.result?.survey_records_count?.total_surveys ?? 0;
		surveyWorking.value = Number(res.result?.survey_records_count?.working_count ?? 0);
		surveyNotWorking.value = Number(res.result?.survey_records_count?.not_working_count ?? 0);
		surveyNA.value = Number(res.result?.survey_records_count?.na_count ?? 0);

		startCountUp(animatedSurveys, totalSurveys.value);
		startCountUp(animatedWorking, surveyWorking.value);
		startCountUp(animatedNotWorking, surveyNotWorking.value);
		startCountUp(animatedNA, surveyNA.value);
	} catch (err) {
		console.error(err);
		toast.add({ title: "Error", description: "Failed to load surveys", color: "red" });
	} finally {
		loadingSurveys.value = false;
		loading.value = false;
	}
}

// 🔹 Fetch Complaints
async function fetchComplaints() {
	loadingComplaints.value = true;
	try {
		const token = process.client ? localStorage.getItem("access_token") : "";
		const res = await $fetch<any>("https://ayodhya.water.live/api/surveyNew.php?action=get_dashboard_complaints", {
			method: "POST",
			body: { accesskey: token, from_date: complaintDate.value },
		});

		if (res.error === 1) {
			localStorage.removeItem("access_token");
			toast.add({ title: "Access Denied", description: "Session expired", color: "red" });
			router.push("/login").then(() => window.location.reload());
			return;
		}

		totalComplaints.value = res.result?.complaint_records_count?.total_complaints ?? 0;

		complaintWorking.value = Number(res.result?.complaint_records_count?.working_count ?? 0);
		complaintNotWorking.value = Number(res.result?.complaint_records_count?.not_working_count ?? 0);
		complaintNA.value = Number(res.result?.complaint_records_count?.na_count ?? 0);

		complaintUsers.value = res.result?.complaint_count_by_user ?? [];

		// Animate counts
		startCountUp(animatedComplaints, totalComplaints.value);
		startCountUp(animatedWorkingComplaints, complaintWorking.value);
		startCountUp(animatedNotWorkingComplaints, complaintNotWorking.value);
		startCountUp(animatedNAComplaints, complaintNA.value);
	} catch (err) {
		console.error(err);
		toast.add({ title: "Error", description: "Failed to load complaints", color: "red" });
	} finally {
		loadingComplaints.value = false;
		loading.value = false;
	}
}

// Reset filters
function resetSurveyDate() {
	surveyDate.value = "";
	fetchSurveys();
}
function resetComplaintDate() {
	complaintDate.value = "";
	fetchComplaints();
}

// Refresh buttons
const refreshSurveys = async () => {
	refreshingSurveys.value = true;
	await fetchSurveys();
	setTimeout(() => (refreshingSurveys.value = false), 800);
};
const refreshComplaints = async () => {
	refreshingComplaints.value = true;
	await fetchComplaints();
	setTimeout(() => (refreshingComplaints.value = false), 800);
};

// Initial load
onMounted(() => {
	fetchSurveys();
	fetchComplaints();
});
</script>

<template>
	<div class="p-6 bg-slate-50 min-h-screen">
		<!-- <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
			<div class="bg-white shadow-xl rounded-2xl p-6 border border-gray-100 mb-6">
				<h2 class="text-lg font-semibold mb-4 text-indigo-700">⚡ Watt Distribution</h2>
				<apexchart
					width="100%"
					type="pie"
					height="250"
					:options="chartOptions"
					:series="chartSeries"
				></apexchart>
			</div>
			<div class="bg-white shadow-xl rounded-2xl p-6 border border-gray-100 mb-6">
				<h2 class="text-lg font-semibold mb-4">⚡ Watts Distribution</h2>
				<apexchart
					width="100%"
					type="pie"
					height="250"
					:options="chartOptions"
					:series="chartSeries"
				></apexchart>
			</div>
		</div> -->
		<!-- Cards row -->
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
			<!-- Total Surveys -->
			<!-- Total Surveys Card -->
			<NuxtLink to="/surveys" class="block">
				<div
					class="group bg-white border border-gray-100 shadow-lg rounded-2xl p-6 flex flex-col space-y-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
				>
					<div class="flex items-center space-x-4">
						<!-- Icon -->
						<div class="p-4 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-full text-2xl">📊</div>

						<!-- Text -->
						<div>
							<p class="text-3xl font-bold text-indigo-700">{{ animatedSurveys }}</p>
							<p class="text-gray-500">Total Surveys</p>
						</div>
					</div>

					<!-- Detailed counts -->
					<div class="grid grid-cols-3 gap-4 text-sm text-gray-700 mt-2">
						<div class="text-center bg-green-50 rounded-md p-2">
							<p class="font-semibold">{{ animatedWorking }}</p>
							<p class="text-gray-500">Working</p>
						</div>
						<div class="text-center bg-red-50 rounded-md p-2">
							<p class="font-semibold">{{ animatedNotWorking }}</p>
							<p class="text-gray-500">Not Working</p>
						</div>
						<div class="text-center bg-gray-100 rounded-md p-2">
							<p class="font-semibold">{{ animatedNA }}</p>
							<p class="text-gray-500">N/A</p>
						</div>
					</div>
				</div>
			</NuxtLink>

			<!-- Total Complaints -->
			<NuxtLink to="/complaints" class="block">
				<div
					class="group bg-white border border-gray-100 shadow-lg rounded-2xl p-6 flex flex-col space-y-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
				>
					<div class="flex items-center space-x-4">
						<!-- Icon -->
						<div
							class="p-4 bg-gradient-to-br from-rose-100 to-red-200 rounded-full text-2xl transition-all group-hover:from-rose-200 group-hover:to-red-300"
						>
							⚠️
						</div>

						<!-- Text -->
						<div>
							<template v-if="loading">
								<USkeleton class="h-8 w-24 bg-gray-200 mb-2" />
								<USkeleton class="h-4 w-32 bg-gray-200" />
							</template>

							<template v-else>
								<p class="text-3xl font-bold text-rose-700 transition-all duration-300">
									{{ animatedComplaints }}
								</p>
								<p class="text-gray-500">Total Complaints</p>
							</template>
						</div>
					</div>

					<!-- Detailed counts -->
					<div class="grid grid-cols-3 gap-4 text-sm text-gray-700 mt-2">
						<div class="text-center bg-green-50 rounded-md p-2">
							<p class="font-semibold">{{ animatedWorkingComplaints }}</p>
							<p class="text-gray-500">Working</p>
						</div>
						<div class="text-center bg-red-50 rounded-md p-2">
							<p class="font-semibold">{{ animatedNotWorkingComplaints }}</p>
							<p class="text-gray-500">Not Working</p>
						</div>
						<div class="text-center bg-gray-100 rounded-md p-2">
							<p class="font-semibold">{{ animatedNAComplaints }}</p>
							<p class="text-gray-500">N/A</p>
						</div>
					</div>
				</div>
			</NuxtLink>
		</div>

		<!-- Tables row -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
			<!-- Survey Table -->
			<div
				class="bg-white shadow-xl rounded-2xl p-6 border border-gray-100 transition-all duration-300 hover:shadow-2xl"
			>
				<div class="flex items-center flex-wrap gap-2 mb-4">
					<h2
						class="text-lg font-semibold bg-gradient-to-r from-teal-600 to-indigo-600 bg-clip-text text-transparent"
					>
						📋 Surveys by User
					</h2>

					<input
						type="date"
						:max="today"
						v-model="surveyDate"
						@change="fetchSurveys"
						class="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-teal-400 focus:outline-none"
					/>

					<button
						@click="resetSurveyDate"
						:disabled="!surveyDate"
						class="bg-gray-100 hover:bg-gray-200 text-sm px-3 py-1.5 rounded-md transition-all duration-200 transform hover:scale-105 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Reset
					</button>

					<!-- Animated Refresh -->
					<button
						@click="refreshSurveys"
						:class="refreshingSurveys ? 'animate-bounce-slow' : ''"
						class="bg-indigo-100 hover:bg-indigo-200 text-sm px-3 py-1.5 rounded-md flex items-center gap-2 transition-all duration-200"
					>
						🔄 <span>Refresh</span>
					</button>

					<span v-if="surveyDate" class="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full ml-2">
						Showing: {{ new Date(surveyDate).toLocaleDateString() }}
					</span>
				</div>

				<!-- Table -->
				<div class="max-h-96 overflow-y-auto rounded-md border border-gray-100">
					<table class="min-w-full border-collapse text-sm">
						<thead class="bg-gradient-to-r from-indigo-50 to-teal-50 sticky top-0 z-10">
							<tr>
								<th class="px-4 py-2 text-left border-b text-gray-600">Name</th>
								<th class="px-4 py-2 text-left border-b text-gray-600">Total Surveys</th>
							</tr>
						</thead>
						<tbody>
							<tr v-if="loadingSurveys">
								<td colspan="2" class="px-4 py-3 text-center text-gray-400 italic animate-pulse">
									Loading survey data...
								</td>
							</tr>

							<tr v-else-if="surveyUsers.length === 0">
								<td colspan="2" class="px-4 py-3 text-center text-gray-500">No survey data</td>
							</tr>

							<tr
								v-for="(u, index) in surveyUsers"
								:key="u.user_id"
								:class="[
									'hover:bg-teal-50 transition-all',
									index === 0 ? 'bg-yellow-50 font-semibold' : '',
								]"
							>
								<td class="px-4 py-2 border-b">{{ u.username }}</td>
								<td class="px-4 py-2 border-b">{{ u.survey_count }}</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>

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

					<input
						type="date"
						:max="today"
						v-model="complaintDate"
						@change="fetchComplaints"
						class="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-rose-400 focus:outline-none"
					/>

					<!-- <button
						@click="resetComplaintDate"
						:disabled="!complaintDate"
						class="bg-gray-100 hover:bg-gray-200 text-sm px-2 py-1 rounded-md transition"
					>
						Reset
					</button> -->
					<button
						@click="resetComplaintDate"
						:disabled="!complaintDate"
						class="bg-gray-100 hover:bg-gray-200 text-sm px-3 py-1.5 rounded-md transition-all duration-200 transform hover:scale-105 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Reset
					</button>

					<!-- <button
						@click="refreshComplaints"
						:class="{ 'animate-spin': refreshingComplaints }"
						class="bg-rose-100 hover:bg-rose-200 text-sm px-2 py-1 rounded-md flex items-center gap-1 transition"
					>
						🔄 <span>Refresh</span>
					</button> -->
					<button
						@click="refreshComplaints"
						:class="refreshingComplaints ? 'animate-bounce-slow' : ''"
						class="bg-indigo-100 hover:bg-indigo-200 text-sm px-3 py-1.5 rounded-md flex items-center gap-2 transition-all duration-200"
					>
						🔄 <span>Refresh</span>
					</button>

					<span v-if="complaintDate" class="text-xs bg-rose-50 text-rose-700 px-3 py-1 rounded-full ml-2">
						Showing: {{ new Date(complaintDate).toLocaleDateString() }}
					</span>
				</div>

				<div class="max-h-96 overflow-y-auto rounded-md border border-gray-100">
					<table class="min-w-full border-collapse text-sm">
						<thead class="bg-gradient-to-r from-rose-50 to-orange-50 sticky top-0 z-10">
							<tr>
								<th class="px-4 py-2 text-left border-b text-gray-600">Name</th>
								<th class="px-4 py-2 text-left border-b text-gray-600">Total Complaints</th>
							</tr>
						</thead>
						<tbody>
							<tr v-if="loadingComplaints">
								<td colspan="2" class="px-4 py-3 text-center text-gray-400 italic animate-pulse">
									Loading complaint data...
								</td>
							</tr>

							<tr v-else-if="complaintUsers.length === 0">
								<td colspan="2" class="px-4 py-3 text-center text-gray-500">No complaint data</td>
							</tr>

							<tr
								v-for="(u, index) in complaintUsers"
								:key="u.user_id"
								:class="[
									'hover:bg-rose-50 transition-all',
									index === 0 ? 'bg-yellow-50 font-semibold' : '',
								]"
							>
								<td class="px-4 py-2 border-b">{{ u.username }}</td>
								<td class="px-4 py-2 border-b">{{ u.complaint_count }}</td>
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
