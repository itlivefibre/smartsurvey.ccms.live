<template>
	<!-- Full screen layout with no body scroll -->
	<div class="h-screen flex bg-slate-50 text-slate-800 overflow-hidden">
		<!-- Sidebar -->
		<aside
			:class="[
				'transition-all duration-300 ease-in-out',
				isCollapsed ? 'w-20' : 'w-64',
				'bg-gradient-to-b from-white to-slate-100 border-r border-slate-200 flex flex-col justify-between shadow-sm',
			]"
		>
			<div>
				<!-- Sidebar header -->
				<div class="flex items-center justify-between px-4 h-16 border-b border-slate-200">
					<span v-if="!isCollapsed" class="text-lg font-bold text-indigo-600">Reports</span>
					<UButton
						class="cursor-pointer"
						:icon="isCollapsed ? 'i-heroicons-chevron-double-right' : 'i-heroicons-chevron-double-left'"
						@click="isCollapsed = !isCollapsed"
						size="sm"
						color="gray"
						variant="ghost"
					/>
				</div>

				<!-- Top menu -->
				<nav class="mt-4 px-2 flex flex-col gap-1">
					<UButton
						v-for="item in topMenu"
						:key="item.label"
						:icon="item.icon"
						:label="!isCollapsed ? item.label : ''"
						:to="item.to"
						variant="ghost"
						color="gray"
						class="justify-start rounded-md hover:bg-indigo-50 transition-all duration-200"
					/>
				</nav>
			</div>

			<!-- Bottom menu -->
			<div class="px-2 py-4 border-t border-slate-200">
				<UButton
					v-for="item in bottomMenu"
					:key="item.label"
					:icon="item.icon"
					:label="!isCollapsed ? item.label : ''"
					variant="ghost"
					color="gray"
					class="justify-start hover:bg-indigo-50 rounded-md transition-all duration-200"
				/>
			</div>
		</aside>

		<!-- Main content with scroll behavior -->
		<div class="flex-1 flex flex-col overflow-hidden">
			<!-- Fixed header -->
			<header
				class="h-16 bg-white border-b border-slate-200 px-4 flex items-center justify-between shadow-sm shrink-0"
			>
				<div class="text-lg font-semibold text-slate-700">
					<slot name="title">Dashboard</slot>
				</div>

				<UButton
					class="cursor-pointer"
					color="red"
					variant="soft"
					icon="i-heroicons-arrow-right-on-rectangle"
					@click="logout"
				>
					Logout
				</UButton>
			</header>

			<!-- Scrollable content only -->
			<main class="flex-1 overflow-auto p-6">
				<slot />
			</main>
		</div>
	</div>
</template>

<script setup lang="ts">
const isCollapsed = ref(false);
const router = useRouter();
const toast = useToast();

const topMenu = [
	{ label: "Home", icon: "i-heroicons-home", to: "/dashboard" },
	{ label: "Survey Reports", icon: "i-heroicons-clipboard-document-list", to: "/surveys-reports" },
	{ label: "Complaints Reports", icon: "i-heroicons-exclamation-triangle", to: "/complaints-reports" },
];

const bottomMenu = [{ label: "Settings", icon: "i-heroicons-cog-6-tooth", to: "/settings" }];

const profileDropdown = [
	[
		{
			label: "Profile",
			icon: "i-heroicons-user",
			click: () => navigateTo("/profile"),
		},
		{
			label: "Sign out",
			icon: "i-heroicons-arrow-right-on-rectangle",
			click: () => console.log("Signing out..."),
		},
	],
];
// Logout Function
function logout() {
	const auth = useCookie("auth-token");
	auth.value = null; // Clear cookie

	toast.add({
		title: "Signed out",
		description: "You have been logged out.",
		color: "gray",
		icon: "i-heroicons-check-circle",
	});

	router.push("/login"); // Redirect to login
}
</script>
