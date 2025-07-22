import ShowBarBase from "./ShowBarBase";
import type { TLevelIndicator } from "~/types/TIndicator";

const ShowBarEfficienty = ({ level }: TLevelIndicator) => {
	return (
		<ShowBarBase title="ККД рекуператора">
			<p className="header-indicator">{level ?? ": ("} %</p>
		</ShowBarBase>
	);
};

export default ShowBarEfficienty;
