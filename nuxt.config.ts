// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	components: [
		{
			path: "~/components",
			pathPrefix: false,
		},
	],
	compatibilityDate: "2025-09-04",
	modules: ["@nuxt/ui", "@nuxtjs/color-mode"],
	css: ["~/assets/css/main.css"],
	runtimeConfig: {
		// Server-side only variables
		// accessKey: process.env.ACCESS_KEY,

		// Public variables (available in browser)
		apiSecret: process.env.NUXT_API_SECRET,
		// public: {
		// 	apiBase: process.env.NUXT_PUBLIC_API_BASE,
		// },
		runtimeConfig: {
			public: {
				apiBase: process.env.NUXT_PUBLIC_API_BASE || "https://ayodhya.water.live/api",
			},
		},
	},
	colorMode: {
		preference: "light", // default
		fallback: "light", // fallback
		classSuffix: "", // adds `light` or `dark` class to <html>
	},
	devtools: { enabled: false },
	experimental: {
		payloadExtraction: true, // smaller HTML, faster load
	},

	ssr: false,
	nitro: {
		compressPublicAssets: true, // gzip assets
		// prerender: {
		// 	crawlLinks: false, // don’t try to auto-prerender
		// 	routes: [], // no prerender routes
		// },
	},
	plugins: ["~/plugins/apexcharts.client.ts"],
	build: {
    transpile: ['@nuxt/typescript-build'],
  },
//   typescript: {
//     // shim: false,
//     typeCheck: true,  // Type-checking during build
//   },
//   app: {
//     name: 'My Nuxt App',
//     version: '1.0.0'
//   }
  
});

// https://nuxt.com/docs/api/configuration/nuxt-config
// export default defineNuxtConfig({
// 	components: [
// 		{
// 			path: "~/components",
// 			pathPrefix: false,
// 		},
// 	],

// 	compatibilityDate: "2025-09-04",

// 	modules: ["@nuxt/ui", "@nuxtjs/color-mode"],

// 	css: ["~/assets/css/main.css"],

// 	runtimeConfig: {
// 		apiSecret: process.env.NUXT_API_SECRET,

// 		public: {
// 			apiBase: process.env.NUXT_PUBLIC_API_BASE || "https://ayodhya.water.live/api",
// 		},
// 	},

// 	colorMode: {
// 		preference: "light",
// 		fallback: "light",
// 		classSuffix: "",
// 	},

// 	devtools: { enabled: false },

// 	experimental: {
// 		payloadExtraction: true,
// 	},

// 	ssr: false,

// 	nitro: {
// 		compressPublicAssets: true,
// 	},

// 	plugins: ["~/plugins/apexcharts.client.ts"],

// 	// ✅ ICON CONFIGURATION
// 	icon: {
// 		// Load Heroicons locally (no network calls)
// 		collections: {
// 			heroicons: () => import("@iconify-json/heroicons/icons.json"),
// 		},
// 	},

// 	ui: {
// 		icons: ["heroicons"], // Enable Heroicons globally for @nuxt/ui
// 	},
// });
