import ShowBarBase from "./ShowBarBase";
import SliderWrapper from "../Slider/SliderWrapper";
import SliderButton from "../Slider/SliderButton";

import type { TChangeMode } from "~/types/TChangeMode";
import useWebSocket from "~/hooks/useWebSocket";

const ShowBarMode = () => {
	const { changeMode, sendMessage } = useWebSocket();

	const modeMapping = {
		manual: "Ручний",
		auto: "Авто",
		turbo: "Турбо",
	};

	const isActive = (currentMode: TChangeMode) => {
		return changeMode === currentMode ? "active" : "disabled";
	};

	const activeIndex = Object.keys(modeMapping).indexOf(changeMode);

	return (
		<ShowBarBase title="Режим" description={modeMapping[changeMode]}>
			<div className="flex flex-row justify-center">
				<SliderWrapper activeIndex={activeIndex}>
					<SliderButton
						variant={isActive("manual")}
						onClick={() => sendMessage("changeMode", "manual")}>
						Ручний
					</SliderButton>
					<SliderButton
						variant={isActive("auto")}
						onClick={() => sendMessage("changeMode", "auto")}>
						Авто
					</SliderButton>
					<SliderButton
						variant={isActive("turbo")}
						onClick={() => sendMessage("changeMode", "turbo")}>
						Турбо
					</SliderButton>
				</SliderWrapper>
			</div>
		</ShowBarBase>
	);
};

export default ShowBarMode;
