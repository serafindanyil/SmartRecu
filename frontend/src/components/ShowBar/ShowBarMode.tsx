import ShowBarBase from "./ShowBarBase";
import { useState } from "react";

import SliderWrapper from "../Slider/SliderWrapper";
import SliderButton from "../Slider/SliderButton";

type Mode = "manual" | "auto" | "turbo";

const ShowBarMode = () => {
	const [mode, setMode] = useState<Mode>("auto");

	const modeMapping = {
		manual: "Ручний",
		auto: "Авто",
		turbo: "Турбо",
	};

	const isActive = (currentMode: Mode) => {
		return mode === currentMode ? "active" : "disabled";
	};

	const activeIndex = Object.keys(modeMapping).indexOf(mode);

	return (
		<ShowBarBase title="Режим" description={modeMapping[mode]}>
			<div className="flex flex-row justify-center">
				<SliderWrapper activeIndex={activeIndex}>
					<SliderButton
						variant={isActive("manual")}
						onClick={() => setMode("manual")}>
						Ручний
					</SliderButton>
					<SliderButton
						variant={isActive("auto")}
						onClick={() => setMode("auto")}>
						Авто
					</SliderButton>
					<SliderButton
						variant={isActive("turbo")}
						onClick={() => setMode("turbo")}>
						Турбо
					</SliderButton>
				</SliderWrapper>
			</div>
		</ShowBarBase>
	);
};

export default ShowBarMode;
