import ShowBarCO2 from "~/components/ShowBar/ShowBarCO2";
import ShowBarHumidity from "~/components/ShowBar/ShowBarHumidity";
// import ShowBarEfficienty from "~/components/ShowBar/ShowBarEfficienty";
import ShowBarTemperature from "~/components/ShowBar/ShowBarTemperature";
import ShowBarFan from "~/components/ShowBar/ShowBarFan";
import ShowBarGraphCO2 from "~/components/ShowBar/ShowBarGraphCO2";
import ShowBarGraphHumidity from "~/components/ShowBar/ShowBarGraphHumidity";

import useWebSocket from "~/hooks/useWebSocket";
import Indicator from "~/components/Indicator/Indicator";

export const StatisticsPage = () => {
	const { sensorData } = useWebSocket();

	return (
		<>
			<h1 className="header-primary mb-6">Показники</h1>
			<div className="space-y-5 px-2 pb-[8rem] w-full">
				<ShowBarCO2
					level={sensorData?.co2}
					description={<Indicator variant="co2" />}
				/>
				<ShowBarHumidity
					level={sensorData?.humidity}
					description={<Indicator variant="humidity" />}
				/>

				<ShowBarTemperature
					description="Зовнішня"
					level={sensorData?.tempOut}
				/>
				<ShowBarTemperature
					description="Внутрішня"
					level={sensorData?.tempIn}
				/>

				<ShowBarFan description="Вдування" level={sensorData?.fanInRPM} />
				<ShowBarFan description="Видування" level={sensorData?.fanOutRPM} />
				<ShowBarGraphCO2 />
				<ShowBarGraphHumidity />

				{/* <ShowBarEfficiency level={60} /> */}
			</div>
		</>
	);
};
export default StatisticsPage;
