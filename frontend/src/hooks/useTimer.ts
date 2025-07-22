import { useState, useEffect, useCallback, useRef } from "react";

interface UseTimerProps {
	duration: number; // в секундах
	onComplete?: () => void;
	autoStart?: boolean;
}

const useTimer = ({
	duration,
	onComplete,
	autoStart = false,
}: UseTimerProps) => {
	const [timeLeft, setTimeLeft] = useState(duration);
	const [isActive, setIsActive] = useState(autoStart);
	const [isCompleted, setIsCompleted] = useState(false);
	const intervalRef = useRef<number | null>(null);

	// Запуск таймера
	const start = useCallback(() => {
		if (!isCompleted) {
			setIsActive(true);
		}
	}, [isCompleted]);

	// Пауза таймера
	const pause = useCallback(() => {
		setIsActive(false);
	}, []);

	// Перезапуск таймера
	const reset = useCallback(() => {
		setTimeLeft(duration);
		setIsActive(false);
		setIsCompleted(false);
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}
	}, [duration]);

	// Повна зупинка таймера
	const stop = useCallback(() => {
		setIsActive(false);
		setIsCompleted(true);
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}
	}, []);

	// Основна логіка таймера
	useEffect(() => {
		if (!isActive || timeLeft <= 0 || isCompleted) {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
			return;
		}

		intervalRef.current = setInterval(() => {
			setTimeLeft((prevTime) => {
				if (prevTime <= 1) {
					setIsActive(false);
					setIsCompleted(true);
					onComplete?.();
					return 0;
				}
				return prevTime - 1;
			});
		}, 1000);

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
		};
	}, [isActive, timeLeft, isCompleted, onComplete]);

	// Cleanup при unmount
	useEffect(() => {
		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
		};
	}, []);

	// Обчислення прогресу в відсотках
	const progress = ((duration - timeLeft) / duration) * 100;

	// Форматування часу
	const formatTime = useCallback((seconds: number) => {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
			.toString()
			.padStart(2, "0")}`;
	}, []);

	return {
		timeLeft,
		isActive,
		isCompleted,
		progress,
		formattedTime: formatTime(timeLeft),
		start,
		pause,
		reset,
		stop,
	};
};

export default useTimer;
