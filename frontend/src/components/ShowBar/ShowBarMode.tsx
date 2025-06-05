import ShowBarBase from "./ShowBarBase";
import { useState } from "react";

import SliderWrapper from "../Slider/SliderWrapper";
import SliderButton from "../Slider/SliderWrapper";

const ShowBarMode = () => {
	const [isEnabled, setIsEnabled] = useState(false);

	const toggleSwitch = () => {
		setIsEnabled((prev) => !prev);
	};

	return (
		<ShowBarBase
			title="Режим"
			description={isEnabled ? "Увімкнено" : "Вимкнено"}>
			<div className="flex flex-row justify-center">
				<SliderWrapper>
					<SliderButton>Ручний</SliderButton>
					<SliderButton>Авто</SliderButton>
					<SliderButton>Турбо</SliderButton>
				</SliderWrapper>
			</div>
		</ShowBarBase>
	);
};

export default ShowBarMode;
