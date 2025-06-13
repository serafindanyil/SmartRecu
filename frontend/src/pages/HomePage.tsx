import ShowBarState from "../components/ShowBar/ShowBarState";
import ShowBarMode from "../components/ShowBar/ShowBarMode";
import ShowBarFanInRange from "../components/ShowBar/ShowBarFanInRange";
import ShowBarFanOutRange from "../components/ShowBar/ShowBarFanOutRange";
import ShowBarTurbo from "../components/ShowBar/ShowBarTurbo";
import useWebSocket from "~/hooks/useWebSocket";

const manualMode = (
	<>
		<ShowBarFanInRange />
		<ShowBarFanOutRange />
		<ShowBarState />
	</>
);
const turboMode = (
	<>
		<ShowBarTurbo />
	</>
);
const autoMode = (
	<>
		<ShowBarState />
	</>
);

const HomePage = () => {
	const { changeMode } = useWebSocket();

	const modeMapping: Record<string, React.ReactNode> = {
		manual: manualMode,
		auto: autoMode,
		turbo: turboMode,
	};

	return (
		<>
			<h1 className="header-primary mb-6">Керування</h1>
			<div className="space-y-5 px-2">
				<ShowBarMode />
				{modeMapping[changeMode]}
			</div>
		</>
	);
};

export default HomePage;
