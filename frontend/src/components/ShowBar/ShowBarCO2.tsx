import ShowBarBase from "./ShowBarBase";
import type { TLevelIndicator } from "~/types/TIndicator";

const ShowBarCO2 = ({ level }: TLevelIndicator) => {
	return (
		<ShowBarBase title="Рівень CO₂" description={"Дуже добре"}>
			<p className="header-indicator">{level} ppm</p>
		</ShowBarBase>
	);
};

export default ShowBarCO2;
