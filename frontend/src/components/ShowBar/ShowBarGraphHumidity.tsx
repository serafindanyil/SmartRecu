import ShowBarBase from "./ShowBarBase";
import {
	AreaChart,
	Area,
	ResponsiveContainer,
	YAxis,
	CartesianGrid,
} from "recharts";

import useWebSocket from "~/hooks/useWebSocket";

const ShowBarGraphHumidity = () => {
	const { sensorHistory } = useWebSocket();
	return (
		<ShowBarBase title="Графік вологості" description="%">
			<div className="w-full h-full">
				<ResponsiveContainer width="100%" height={180}>
					<AreaChart
						data={sensorHistory?.humidity ?? []}
						margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
						<defs>
							<linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
								<stop
									offset="0%"
									stopColor="rgb(166, 199, 221)"
									stopOpacity={1}
								/>
								<stop
									offset="100%"
									stopColor="rgb(225, 236, 244)"
									stopOpacity={0.1}
								/>
							</linearGradient>
						</defs>
						<CartesianGrid
							strokeDasharray="3 3"
							stroke="rgba(207, 212, 221, 1)"
							opacity={0.5}
						/>
						<YAxis
							axisLine={false}
							tickLine={false}
							tick={{ fontSize: 12, fill: "rgba(107, 114, 128, 1)" }}
							width={30}
						/>
						<Area
							type="monotone"
							dataKey="humidity"
							stroke="rgba(56, 110, 148, 1)"
							strokeWidth={2}
							fill="url(#blueGradient)"
							fillOpacity={0.8}
						/>
					</AreaChart>
				</ResponsiveContainer>
			</div>
		</ShowBarBase>
	);
};

export default ShowBarGraphHumidity;
