import ShowBarBase from "./ShowBarBase";
import type { TLevelIndicator } from "~/types/TIndicator";

const ShowBarFan = ({ level, ...props }: TLevelIndicator) => {
	return (
		<ShowBarBase title={"Вентилятор"} {...props}>
			<p className="header-indicator">{level} rpm</p>
		</ShowBarBase>
	);
};

export default ShowBarFan;
