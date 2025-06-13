import ShowBarBase from "./ShowBarBase";
import InputRange from "~/components/Input/InputRange";
import useWebSocket from "~/hooks/useWebSocket";

const ShowBarFanRangeInRange = () => {
	const { sensorData, fanInSpeed, sendMessage } = useWebSocket();
	return (
		<ShowBarBase
			title="Вдув повітря"
			description={`${sensorData?.fanInRPM ?? 0} rpm`}>
			<div className="flex flex-row justify-center">
				<InputRange
					setRangeValue={(value) => sendMessage("changeFanInSpd", value)}
					rangeValue={fanInSpeed}
				/>
			</div>
		</ShowBarBase>
	);
};

export default ShowBarFanRangeInRange;
