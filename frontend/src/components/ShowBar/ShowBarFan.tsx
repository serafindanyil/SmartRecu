import ShowBarBase from "./ShowBarBase";
import type { TLevelIndicator } from "~/types/TIndicator";

const ShowBarFan = ({
	level,
	description,
	...props
}: TLevelIndicator & { description: string }) => {
	return (
		<ShowBarBase title={"Вентилятор"} description={description} {...props}>
			<p className="header-indicator">{level} rpm</p>
		</ShowBarBase>
	);
};

export default ShowBarFan;
