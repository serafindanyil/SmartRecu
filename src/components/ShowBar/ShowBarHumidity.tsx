import ShowBarBase from "./ShowBarBase";
import type { TLevelIndicator } from "~/types/TIndicator";

const ShowBarHumidity = ({ level }: TLevelIndicator) => {
	return (
		<ShowBarBase title="Вологість" description={"Дуже добре"}>
			<p className="header-indicator">{level} %</p>
		</ShowBarBase>
	);
};

export default ShowBarHumidity;
