import { Children } from "react";
import "./ButtonBase.scss";

interface ButtonBaseProps {
	variant?: "default" | "disabled";
	children: React.ReactNode;
}

const ButtonBase = ({
	variant = "default",
	children,
	...props
}: ButtonBaseProps) => {
	const padding = Children.count(children) == 1 ? "p-4" : "py-3 px-4";
	return (
		<button
			className={`button-base button-base__${variant} ${padding}`}
			{...props}>
			{children}
		</button>
	);
};

export default ButtonBase;
