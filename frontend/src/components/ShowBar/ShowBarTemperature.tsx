import ShowBarBase from "./ShowBarBase";
import type { TLevelIndicator } from "~/types/TIndicator";

const ShowBarTemperature = ({
	level,
	description,
	...props
}: TLevelIndicator & { description: string }) => {
	return (
		<ShowBarBase title="Температура" description={description} {...props}>
			<p className="header-indicator">{level} °C</p>
		</ShowBarBase>
	);
};

export default ShowBarTemperature;
