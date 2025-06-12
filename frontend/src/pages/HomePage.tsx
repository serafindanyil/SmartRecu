import ShowBarState from "../components/ShowBar/ShowBarState";
import ShowBarMode from "../components/ShowBar/ShowBarMode";
import ShowBarFanInRange from "../components/ShowBar/ShowBarFanInRange";
import ShowBarFanOutRange from "../components/ShowBar/ShowBarFanOutRange";

const HomePage = () => {
	return (
		<>
			<h1 className="header-primary mb-6">Керування</h1>
			<div className="space-y-5 px-2">
				<ShowBarMode />
				<ShowBarFanInRange />
				<ShowBarFanOutRange />
				<ShowBarState />
			</div>
		</>
	);
};

export default HomePage;
