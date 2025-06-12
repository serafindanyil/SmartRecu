import defaultTheme from "tailwindcss/defaultTheme";

/** @type {import('tailwindcss').Config} */
export default {
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
		container: {
			center: true,
			padding: {
				DEFAULT: "1.25rem", // 16px для мобільних (base)
				sm: "1rem", // 16px для sm >= 640px
				xl: "2rem", // 32px для xl >= 1280px
				"2xl": "4rem", // 64px для 2xl >= 1536px
			},
			screens: {
				...defaultTheme.screens, // щоб зберегти дефолтні брейкпоінти
				xl: "81.25rem", // 1300px
				"2xl": "96rem", // 1536px
			},
		},
		extend: {
			colors: {
				black: {
					500: "rgba(9, 10, 11, 1)",
					400: "rgba(33, 34, 39, 1)",
					300: "rgba(66, 68, 77, 1)",
				},
				gray: {
					500: "rgba(75, 87, 108, 1)",
					400: "rgba(100, 116, 144, 1)",
					100: "rgba(207, 212, 221, 1)",
				},
				blue: {
					100: "rgba(225, 236, 244, 1)",
					200: "rgba(166, 199, 221, 1)",
					400: "rgba(78, 142, 188, 1)",
					500: "rgba(56, 110, 148, 1)",
				},
				white: {
					100: "rgba(243, 244, 247, 1)",
				},
				red: {
					100: "rgba(254, 79, 45, 1)",
				},
				green: {
					100: "rgba(0, 153, 85, 1)",
				},
			},
		},
		boxShadow: {
			shapes: "2px 2px 25px rgba(0, 0, 0, 0.1)",
		},
		screens: {
			...defaultTheme.screens,
			tablet: "48rem", // 768px
		},
	},
	plugins: [],
};
