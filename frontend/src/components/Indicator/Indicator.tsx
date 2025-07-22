import useWebSocket from "~/hooks/useWebSocket";

type QualityLevel = "poor" | "bad" | "good" | "well";

type Variants = "co2" | "humidity";

const colorMap: Record<QualityLevel, string> = {
	well: "text-green-500",
	good: "text-blue-500",
	bad: "text-orange-500",
	poor: "text-red-500",
};

const textMap: Record<QualityLevel, string> = {
	well: "Добре",
	good: "Нормально",
	bad: "Погано",
	poor: "Жахливо",
};

const parseRange = (
	rangeStr: string
): { min: number; max: number } | { min: number; max: number }[] => {
	if (rangeStr.includes("|")) {
		return rangeStr.split("|").map((range) => parseRange(range)) as {
			min: number;
			max: number;
		}[];
	}
	if (rangeStr.includes("+")) {
		const min = parseInt(rangeStr.replace("+", ""));
		return { min, max: Infinity };
	}
	if (rangeStr.includes("-")) {
		const [min, max] = rangeStr.split("-").map((num) => parseInt(num));
		return { min, max };
	}

	const value = parseInt(rangeStr);
	return { min: value, max: value };
};

const isInRange = (
	value: number,
	range: { min: number; max: number } | { min: number; max: number }[]
): boolean => {
	if (Array.isArray(range)) {
		return range.some((r) => value >= r.min && value <= r.max);
	}
	return value >= range.min && value <= range.max;
};

const getQualityLevel = (
	value: number,
	config: Record<string, string>
): QualityLevel => {
	const levels: QualityLevel[] = ["well", "good", "bad", "poor"];

	for (const level of levels) {
		if (config[level]) {
			const range = parseRange(config[level]);
			if (isInRange(value, range)) {
				return level;
			}
		}
	}

	return "poor";
};

const Indicator = ({ variant }: { variant: Variants }) => {
	const { indicatorConfig, sensorData } = useWebSocket();

	if (!indicatorConfig || !sensorData) {
		return <div>Завантаження...</div>;
	}

	const config = indicatorConfig[variant];
	if (!config) {
		return <div>Конфігурація не знайдена</div>;
	}

	const currentValue = sensorData[variant];
	const qualityLevel = getQualityLevel(currentValue, config);

	return (
		<div className="flex flex-col items-center">
			<div className={`font-bold text-4 ${colorMap[qualityLevel]}`}>
				{textMap[qualityLevel]}
			</div>
		</div>
	);
};

export default Indicator;
