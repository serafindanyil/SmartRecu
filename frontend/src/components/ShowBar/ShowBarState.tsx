import ShowBarBase from "./ShowBarBase";
import { useState } from "react";
import ButtonToggle from "../Button/ButtonToggle";

const ShowBarState = () => {
	const [isEnabled, setIsEnabled] = useState(false);

	const toggleSwitch = () => {
		setIsEnabled((prev) => !prev);
	};

	return (
		<ShowBarBase
			title="Стан"
			description={isEnabled ? "Увімкнено" : "Вимкнено"}>
			<div className="flex flex-row justify-end">
				<ButtonToggle isEnabled={isEnabled} onClick={toggleSwitch} />
			</div>
		</ShowBarBase>
	);
};

export default ShowBarState;
