"use client";

interface ScoreRingProps {
	score: number;
	size?: "sm" | "md" | "lg";
	showLabel?: boolean;
}

const sizeMap = {
	sm: { ring: 60, stroke: 4, text: "text-lg", radius: 24 },
	md: { ring: 100, stroke: 6, text: "text-2xl", radius: 40 },
	lg: { ring: 140, stroke: 8, text: "text-4xl", radius: 56 },
};

export function ScoreRing({ score, size = "md", showLabel = true }: ScoreRingProps) {
	const { ring, stroke, text, radius } = sizeMap[size];
	const center = ring / 2;
	const percentage = (score / 10) * 100;
	const circumference = 2 * Math.PI * radius;
	const offset = circumference - (percentage / 100) * circumference;

	const getScoreColor = (s: number) => {
		if (s >= 8.5) return "oklch(0.75 0.18 145)";
		if (s >= 7) return "oklch(0.8 0.15 85)";
		return "oklch(0.65 0.2 25)";
	};

	const color = getScoreColor(score);

	return (
		<div className="relative" style={{ width: ring, height: ring }}>
			<svg
				className="transform -rotate-90"
				style={{ width: ring, height: ring }}
				role="img"
				aria-label={`Score: ${score.toFixed(1)} out of 10`}
			>
				<circle
					cx={center}
					cy={center}
					r={radius}
					stroke="currentColor"
					strokeWidth={stroke}
					fill="none"
					className="text-muted"
				/>
				<circle
					cx={center}
					cy={center}
					r={radius}
					stroke={color}
					strokeWidth={stroke}
					fill="none"
					strokeLinecap="round"
					strokeDasharray={circumference}
					strokeDashoffset={offset}
					className="transition-all duration-1000 ease-out"
				/>
			</svg>
			<div className="absolute inset-0 flex flex-col items-center justify-center">
				<span className={`font-bold ${text}`} style={{ color }}>
					{score.toFixed(1)}
				</span>
				{showLabel && <span className="text-xs text-muted-foreground">/ 10</span>}
			</div>
		</div>
	);
}
