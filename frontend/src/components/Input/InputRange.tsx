import { useState, useCallback, useEffect } from "react";
import "./InputRange.scss";

interface InputRangeProps {
	setRangeValue: (value: number) => void;
	rangeValue: number;
	debounceMs?: number;
}

const InputRange = ({
	setRangeValue,
	rangeValue,
	debounceMs = 300,
}: InputRangeProps) => {
	const [localValue, setLocalValue] = useState(rangeValue);

	const debouncedSetRangeValue = useCallback(
		debounce((...args: unknown[]) => {
			const value = Number(args[0]);
			setRangeValue(value);
		}, debounceMs),
		[setRangeValue, debounceMs]
	);

	useEffect(() => {
		setLocalValue(rangeValue);
	}, [rangeValue]);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newValue = Number(e.target.value);
		setLocalValue(newValue);
		debouncedSetRangeValue(newValue);
	};

	return (
		<div className="input-range">
			<input
				id="fan-speed"
				type="range"
				min="0"
				max="100"
				value={localValue}
				onChange={handleChange}
				className="input-range__slider bg-white"
			/>
		</div>
	);
};

function debounce<T extends (...args: unknown[]) => unknown>(
	func: T,
	wait: number
): (...args: Parameters<T>) => void {
	let timeout: ReturnType<typeof setTimeout>;
	return (...args: Parameters<T>) => {
		clearTimeout(timeout);
		timeout = setTimeout(() => func(...args), wait);
	};
}

export default InputRange;
