// export const useAuth = () => {
// 	const user = useState("user", () => null);
// 	const token = useCookie("access_token", {
// 		path: "/",
// 		maxAge: 60 * 60 * 24 * 1, // 1 days
// 		sameSite: "None", // Important for cross-origin requests
// 		secure: true, // Ensures cookies are only sent over HTTPS
// 	});

// 	const setUser = (data: any) => {
// 		user.value = {
// 			username: data.username,
// 			email: data.email,
// 			userId: data.user_id,
// 			role: data.role,
// 			permissions: data.permission,
// 		};
// 		token.value = data.access_key;
// 		console.log(token.value);
// 	};

// 	const clearAuth = () => {
// 		user.value = null;
// 		token.value = null;
// 	};

// 	const isLoggedIn = computed(() => !!token.value);

// 	return {
// 		user,
// 		token,
// 		isLoggedIn,
// 		setUser,
// 		clearAuth,
// 	};
// };

import { ref } from "vue";

export const accessToken = ref<string | null>(null);
export const currentUser = ref<any>(null);

export function setToken(token: string, user: any) {
	accessToken.value = token;
	currentUser.value = user;
	localStorage.setItem("access_token", token);
	localStorage.setItem("user", JSON.stringify(user));
}

export function clearToken() {
	accessToken.value = null;
	currentUser.value = null;
	localStorage.removeItem("access_token");
	localStorage.removeItem("user");
}
