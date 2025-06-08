import { Link, useLocation } from "react-router-dom";
import type { TNavigationLinkProps } from "~/types/TNavigation";

type NavigationLinkProps = TNavigationLinkProps & {
	page: TNavigationLinkProps["page"];
	children: ((style: string) => React.ReactNode) | string;
};

const NavigationLink = ({ children, page }: NavigationLinkProps) => {
	const path = useLocation();
	const currentPage = path.pathname.split("/")[1] === page.toLowerCase();
	const style = currentPage
		? "text-blue-500 fill-blue-500"
		: "text-gray-300 fill-blue-300";

	return (
		<li>
			<Link to={`/${page}`} className={`text-lg font-semibold ${style}`}>
				{typeof children === "function" ? children(style) : children}
			</Link>
		</li>
	);
};
export default NavigationLink;
