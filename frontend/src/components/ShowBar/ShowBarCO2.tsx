import ShowBarBase from "./ShowBarBase";
import type { TLevelIndicator } from "~/types/TIndicator";

const ShowBarCO2 = ({ level, ...props }: TLevelIndicator) => {
	return (
		<ShowBarBase title="Рівень CO₂" {...props}>
			<p className="header-indicator">{level ?? ": ("} ppm</p>
		</ShowBarBase>
	);
};

export default ShowBarCO2;
