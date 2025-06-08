import "./SliderButton.scss";

interface SliderButtonProps {
	children: React.ReactNode;
	variant?: "active" | "disabled";
}

const SliderButton = ({
	children,
	variant = "disabled",
}: SliderButtonProps) => {
	return <button className={`button button--${variant}`}>{children}</button>;
};

export default SliderButton;
