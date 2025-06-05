import Logo from "../../assets/logo.svg?react";

const Header = ({ className = "", version = "0.1", isOnline = false }) => {
	return (
		<header className={`${className}`}>
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
					{isOnline ? "Online" : "Offline"}
				</span>
			</div>
		</header>
	);
};

export default Header;
