import React, {
	createContext,
	useContext,
	useState,
	useRef,
	useEffect,
	useCallback,
} from "react";

interface TimerData {
	timeLeft: number;
	minutes: number;
	seconds: number;
	formattedTime: string;
	progress: number;
	isActive: boolean;
	isCompleted: boolean;
}

interface TimerContextType {
	TURBO_DURATION: number;
	turboTimer: TimerData;
	startTurboTimer: () => void;
	resetTurboTimer: () => void;
	isTimerActive: boolean;
	onComplete: (callback: () => void) => void; // Простий колбек
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

const TURBO_DURATION = 20;

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [timeLeft, setTimeLeft] = useState(TURBO_DURATION);
	const [isActive, setIsActive] = useState(false);
	const [isCompleted, setIsCompleted] = useState(false);
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const callbackRef = useRef<(() => void) | null>(null);

	const formatTime = (seconds: number) => {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
			.toString()
			.padStart(2, "0")}`;
	};

	// Простий колбек - просто зберігаємо функцію
	const onComplete = useCallback((callback: () => void) => {
		callbackRef.current = callback;
	}, []);

	const startTurboTimer = useCallback(() => {
		if (!isCompleted) {
			setIsActive(true);
		}
	}, [isCompleted]);

	// Перезапуск таймера
	const resetTurboTimer = useCallback(() => {
		setTimeLeft(TURBO_DURATION);
		setIsActive(false);
		setIsCompleted(false);
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
			setTimeLeft((prev) => {
				if (prev <= 1) {
					setIsActive(false);
					setIsCompleted(true);

					// Викликаємо колбек якщо є
					if (callbackRef.current) {
						callbackRef.current();
					}

					// Автоматичний ресет через 2 секунди
					setTimeout(() => {
						setTimeLeft(TURBO_DURATION);
						setIsActive(false);
						setIsCompleted(false);
						callbackRef.current = null; // Очищуємо колбек
						console.log("Таймер автоматично скинуто");
					}, 2000);

					return 0;
				}
				return prev - 1;
			});
		}, 1000);

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
		};
	}, [isActive, timeLeft, isCompleted]);

	// Cleanup при unmount
	useEffect(() => {
		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
		};
	}, []);

	// Обчислюємо значення
	const minutes = Math.floor(timeLeft / 60);
	const seconds = timeLeft % 60;
	const progress = ((TURBO_DURATION - timeLeft) / TURBO_DURATION) * 100;

	const turboTimer: TimerData = {
		timeLeft,
		minutes,
		seconds,
		formattedTime: formatTime(timeLeft),
		progress,
		isActive,
		isCompleted,
	};

	const value: TimerContextType = {
		TURBO_DURATION,
		turboTimer,
		startTurboTimer,
		resetTurboTimer,
		isTimerActive: isActive,
		onComplete, // Простий колбек
	};

	return React.createElement(TimerContext.Provider, { value }, children);
};

export const useTimer = (): TimerContextType => {
	const context = useContext(TimerContext);
	if (!context) {
		throw new Error("useTimer must be used within a TimerProvider");
	}
	return context;
};
