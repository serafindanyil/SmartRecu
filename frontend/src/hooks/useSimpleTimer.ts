import { useState, useEffect, useCallback } from "react";

interface UseSimpleTimerProps {
	duration: number;
	onComplete?: () => void;
	autoStart?: boolean;
}

const useSimpleTimer = ({
	duration,
	onComplete,
	autoStart = false,
}: UseSimpleTimerProps) => {
	const [timeLeft, setTimeLeft] = useState(duration);
	const [isActive, setIsActive] = useState(autoStart);
	const [isCompleted, setIsCompleted] = useState(false);

	// Старт таймера
	const start = useCallback(() => {
		if (!isCompleted) {
			setIsActive(true);
		}
	}, [isCompleted]);

	// Стоп таймера
	const stop = useCallback(() => {
		setIsActive(false);
	}, []);

	// Перезапуск
	const reset = useCallback(() => {
		setTimeLeft(duration);
		setIsActive(false);
		setIsCompleted(false);
	}, [duration]);

	// Основна логіка
	useEffect(() => {
		if (!isActive || timeLeft <= 0) return;

		const interval = setInterval(() => {
			setTimeLeft((prev) => {
				if (prev <= 1) {
					setIsActive(false);
					setIsCompleted(true);
					onComplete?.();
					return 0;
				}
				return prev - 1;
			});
		}, 1000);

		return () => clearInterval(interval);
	}, [isActive, timeLeft, onComplete]);

	const formatTime = useCallback((seconds: number) => {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
			.toString()
			.padStart(2, "0")}`;
	}, []);

	const minutes = Math.floor(timeLeft / 60);
	const seconds = timeLeft % 60;
	const progress = ((duration - timeLeft) / duration) * 100;

	return {
		timeLeft,
		minutes,
		seconds,
		progress,
		formattedTime: formatTime(timeLeft),

		isActive,
		isCompleted,

		duration,

		start,
		stop,
		reset,
	};
};

export default useSimpleTimer;
