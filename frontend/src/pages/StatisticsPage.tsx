import ShowBarCO2 from "~/components/ShowBar/ShowBarCO2";
import ShowBarHumidity from "~/components/ShowBar/ShowBarHumidity";
import ShowBarEfficienty from "~/components/ShowBar/ShowBarEfficienty";
import ShowBarTemperature from "~/components/ShowBar/ShowBarTemperature";
import ShowBarFan from "~/components/ShowBar/ShowBarFan";

export const StatisticsPage = () => {
	return (
		<>
			<h1 className="header-primary mb-6">Показники</h1>
			<div className="space-y-5 px-2 pb-[8rem] w-full">
				<ShowBarCO2 level={400} />
				<ShowBarHumidity level={60} />

				<ShowBarTemperature description="Зовнішня" level={24} />
				<ShowBarTemperature description="Внутрішня" level={27} />

				<ShowBarFan description="Вдування" level={2900} />
				<ShowBarFan description="Видування" level={800} />

				<ShowBarEfficienty level={60} />
			</div>
		</>
	);
};
export default StatisticsPage;
