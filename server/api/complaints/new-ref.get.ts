import { defineEventHandler } from "h3";

export default defineEventHandler(async (event) => {
	try {
		// You can replace this logic with a database call to get the last ref number
		const timestamp = Date.now();
		const random = Math.floor(Math.random() * 1000);
		const newRef = `CMP-${timestamp}-${random}`;

		return { refNo: newRef };
	} catch (err) {
		console.error("Error generating new ref:", err);
		return { refNo: `TEMP-${Date.now()}` };
	}
});
