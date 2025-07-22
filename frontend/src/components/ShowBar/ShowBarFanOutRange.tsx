import ShowBarBase from "./ShowBarBase";
import InputRange from "~/components/Input/InputRange";
import useWebSocket from "~/hooks/useWebSocket";

const ShowBarFanOutRange = () => {
	const { sensorData, fanOutSpeed, sendMessage } = useWebSocket();

	return (
		<ShowBarBase
			title="Видув повітря"
			description={`${sensorData?.fanOutRPM ?? 0} rpm`}>
			<div className="flex flex-row justify-center">
				<InputRange
					setRangeValue={(value) => sendMessage("changeFanOutSpd", value)}
					rangeValue={fanOutSpeed}
				/>
			</div>
		</ShowBarBase>
	);
};

export default ShowBarFanOutRange;
