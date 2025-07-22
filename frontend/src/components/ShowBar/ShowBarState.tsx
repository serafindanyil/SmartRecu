import ShowBarBase from "./ShowBarBase";
import ButtonToggle from "../Button/ButtonToggle";
import useWebSocket from "~/hooks/useWebSocket";

const ShowBarState = () => {
	const { switchState, sendMessage } = useWebSocket();

	const handleToggleState = () => {
		sendMessage("switchState", !switchState);
	};

	return (
		<ShowBarBase
			title="Стан"
			description={switchState ? "Увімкнено" : "Вимкнено"}>
			<div className="flex flex-row justify-end">
				<ButtonToggle isEnabled={switchState} onClick={handleToggleState} />
			</div>
		</ShowBarBase>
	);
};

export default ShowBarState;
