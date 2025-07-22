import ShowBarBase from "./ShowBarBase";
import { useTimer } from "~/context/TimerProvider";
import useWebSocket from "~/hooks/useWebSocket";

const ShowBarTurbo = () => {
	const { turboTimer, TURBO_DURATION, onComplete } = useTimer();
	const { sendMessage } = useWebSocket();

	// Передаємо функцію в колбек
	onComplete(() => {
		console.log("Таймер завершився!");
		sendMessage("changeMode", "auto");
	});

	return (
		<ShowBarBase title="Турбо режим">
			<div className="flex flex-col items-center space-y-3">
				<span
					className={`text-[3.5rem] font-bold transition-colors duration-300 ${
						turboTimer.seconds > (TURBO_DURATION * 2) / 3
							? "text-blue-500"
							: turboTimer.seconds > TURBO_DURATION / 3
							? "text-yellow-500"
							: "text-red-500"
					}`}>
					{turboTimer.formattedTime}
				</span>

				<div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
					<div
						className="h-3 rounded-full transition-all duration-1000 ease-linear bg-blue-400"
						style={{ width: `${turboTimer.progress}%` }}
					/>
				</div>
			</div>
		</ShowBarBase>
	);
};

export default ShowBarTurbo;
