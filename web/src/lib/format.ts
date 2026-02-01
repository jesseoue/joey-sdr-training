const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
	month: "short",
	day: "numeric",
	hour: "2-digit",
	minute: "2-digit",
});

const fullDateFormatter = new Intl.DateTimeFormat("en-US", {
	month: "short",
	day: "numeric",
	year: "numeric",
	hour: "2-digit",
	minute: "2-digit",
});

export function formatDateTime(timestamp: number): string {
	return dateTimeFormatter.format(timestamp);
}

export function formatFullDate(timestamp: number): string {
	return fullDateFormatter.format(timestamp);
}

export function formatDuration(startedAt: number, endedAt?: number): string {
	const end = endedAt || Date.now();
	const seconds = Math.floor((end - startedAt) / 1000);
	const mins = Math.floor(seconds / 60);
	const secs = seconds % 60;
	return `${mins}:${secs.toString().padStart(2, "0")}`;
}
