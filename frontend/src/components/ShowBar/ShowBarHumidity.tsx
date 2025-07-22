import ShowBarBase from "./ShowBarBase";
import type { TLevelIndicator } from "~/types/TIndicator";

const ShowBarHumidity = ({ level, ...props }: TLevelIndicator) => {
	return (
		<ShowBarBase title="Вологість" {...props}>
			<p className="header-indicator">{level ?? ": ("} %</p>
		</ShowBarBase>
	);
};

export default ShowBarHumidity;
