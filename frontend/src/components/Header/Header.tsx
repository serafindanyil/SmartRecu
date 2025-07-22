import Logo from "~/assets/logo.svg?react";
import useWebSocket from "~/hooks/useWebSocket";

const Header = ({ className = "", version = "0.1" }) => {
	const { connectionStatus } = useWebSocket();
	const isOnline = connectionStatus === "Online";

	return (
		<header
			className={`${className} sticky top-0 z-50 pt-4 pb-8 bg-gradient-to-b gradient-background`}>
			<div className="flex flex-row items-center justify-between bg-white-100 py-2 px-4 w-full rounded-[25px] shadow-shapes">
				<div className="inline-flex flex-row items-center gap-2 w-full">
					<Logo width={24} height={24} />
					<h1 className="text-2xl font-bold leading-relaxed black-400">
						SmartRecu
					</h1>
					<p className="text-sm font-bold text-gray-400 ">v {version}</p>
				</div>
				<span
					className={`font-bold ${
						isOnline ? "text-blue-500" : "text-red-100"
					}`}>
					{connectionStatus}
				</span>
			</div>
		</header>
	);
};

export default Header;
