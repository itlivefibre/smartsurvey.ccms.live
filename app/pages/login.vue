<template>
	<div class="min-h-screen flex items-center justify-center p-4">
		<UCard class="w-full max-w-md border border-slate-200 shadow-lg bg-white">
			<!-- Header -->
			<template #header>
				<div class="text-center space-y-2">
					<h2 class="text-2xl font-medium text-slate-700">Sign in to your account</h2>
					<p class="text-sm text-slate-500">Use your username and password to login.</p>
				</div>
			</template>

			<!-- Form -->
			<form @submit.prevent="onSubmit" class="space-y-6 light">
				<!-- Username Input -->
				<UInput
					v-model="form.username"
					type="text"
					label="Username"
					placeholder="Your username"
					icon="i-heroicons-user"
					:error="errors.username"
					color="teal"
					class="w-full"
				/>

				<!-- Password Input -->
				<UInput
					v-model="form.password"
					type="password"
					label="Password"
					placeholder="••••••••"
					icon="i-heroicons-lock-closed"
					:error="errors.password"
					color="teal"
					class="w-full"
				/>

				<!-- Remember me and Forgot password -->
				<!-- <div class="flex justify-between items-center text-sm text-slate-500 hidden">
					<label class="flex items-center gap-2">
						<input type="checkbox" class="rounded border-slate-300 accent-teal-500" />
						Remember me
					</label>
					<NuxtLink to="/forgot-password" class="text-teal-600 hover:underline"> Forgot password? </NuxtLink>
				</div> -->

				<!-- Submit Button -->
				<!-- <UButton
					:loading="loading"
					type="submit"
					class="w-full bg-teal-500 hover:bg-teal-600 text-white"
					color="teal"
					variant="solid"
					label="Sign In"
				/> -->
				<UButton
					:loading="loading"
					type="submit"
					class="w-full bg-teal-500 hover:bg-teal-600 text-white flex items-center justify-center gap-2"
					color="teal"
					variant="solid"
				>
					<!-- <span v-if="loading" class="animate-spin">⏳</span> -->
					<span>Sign In</span>
				</UButton>
			</form>

			<!-- Footer -->
			<!-- <template #footer>
				<p class="text-sm text-center text-slate-500 hidden">
					Don’t have an account?
					<NuxtLink to="/register" class="text-teal-600 hover:underline">Sign up</NuxtLink>
				</p>
			</template> -->
		</UCard>
	</div>
</template>

<script setup lang="ts">
import { z } from "zod";
import { useToast } from "#imports";
import { useRouter } from "vue-router";
import { setToken } from "../composables/useAuth";

// const config = useRuntimeConfig();
const toast = useToast();
const router = useRouter();

const loginSchema = z.object({
	username: z.string().min(1, "Username is required"),
	password: z.string().min(5, "Password must be at least 6 characters"),
});

const form = reactive({
	username: "",
	password: "",
});

const errors = reactive({
	username: "",
	password: "",
});

const loading = ref(false);

const onSubmit = async () => {
	errors.username = "";
	errors.password = "";

	const result = loginSchema.safeParse(form);
	if (!result.success) {
		for (const err of result.error.errors) {
			errors[err.path[0]] = err.message;
		}
		return;
	}

	loading.value = true;

	try {
		const { data, error } = await useFetch(`https://ayodhya.water.live/api/surveyNew.php?action=applogin`, {
			method: "POST",
			body: {
				userinfo: form.username,
				password: form.password,
			},
			headers: {
				"Content-Type": "application/json",
			},
		});
		// console.log("data",typeof(data.value.result.role))
		if (error.value || data.value?.error !== 0) {
			toast.add({
				title: "Login failed",
				description: data.value?.message || "Invalid credentials",
				color: "red",
				icon: "i-heroicons-x-circle",
			});
			return;
		}
		if(data.value?.result.role==="2" || data.value?.result.role=="5"){
				toast.add({
				title: "Go to Mobile App",
				description: "Login Failed",
				color: "red",
				icon: "i-heroicons-x-circle",
			});
			return;
		}

		// ✅ Save token
		// localStorage.setItem("access_token", data.value.result.access_key);

		// ✅ Optionally save user object
		// localStorage.setItem("user", JSON.stringify(data.value.result));
		// ✅ Save token and user reactively
		setToken(data.value.result.access_key, data.value.result);

		toast.add({
			title: "Login successful",
			description: `Welcome, ${data.value.result.username}!`,
			color: "green",
			icon: "i-heroicons-check-circle",
		});

		router.push("/dashboard"); // Navigate after login
	} catch (err) {
		toast.add({
			title: "Error",
			description: "Something went wrong. Please try again.",
			color: "red",
		});
	} finally {
		loading.value = false;
	}
};

definePageMeta({
	layout: "login",
});
</script>

<style scoped>
/* Form layout adjustments */
form {
	padding: 2rem;
}

/* Input field error styling */
.UInput input:invalid {
	border-color: #f87171;
}

/* Button color adjustments */
.UButton {
	transition: all 0.2s ease;
}

.UButton:hover {
	background-color: #16a34a; /* Darker teal on hover */
}

/* Toast notification transition */
.toast {
	transition: all 0.3s ease-in-out;
}
</style>
