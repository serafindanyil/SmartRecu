import NavigationLink from "./NavigationLink";

import Home from "~/assets/home.svg?react";
import Chart from "~/assets/chart.svg?react";
import Setting from "~/assets/setting.svg?react";

interface NavigationProps {
	className?: string;
}

const Navigation = ({ className }: NavigationProps) => {
	return (
		<nav className={`${className}`}>
			<ul className="flex flex-row w-max gap-8 py-4 px-8 bg-white-100 shadow-shapes rounded-[25px]">
				<NavigationLink page="home">
					{(style) => {
						return <Home height={24} width={24} className={style} />;
					}}
				</NavigationLink>
				<NavigationLink page="statistics">
					{(style) => {
						return <Chart height={24} width={24} className={style} />;
					}}
				</NavigationLink>
				<NavigationLink page="settings">
					{(style) => {
						return <Setting height={24} width={24} className={style} />;
					}}
				</NavigationLink>
			</ul>
		</nav>
	);
};

export default Navigation;
