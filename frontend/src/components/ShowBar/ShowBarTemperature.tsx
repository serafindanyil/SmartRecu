import ShowBarBase from "./ShowBarBase";
import type { TLevelIndicator } from "~/types/TIndicator";

const ShowBarTemperature = ({ level, ...props }: TLevelIndicator) => {
	return (
		<ShowBarBase title="Температура" {...props}>
			<p className="header-indicator">{level} °C</p>
		</ShowBarBase>
	);
};

export default ShowBarTemperature;
