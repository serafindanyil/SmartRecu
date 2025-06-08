import "./Slider.scss";

interface SliderButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	children: React.ReactNode;
	variant?: "active" | "disabled";
}

const SliderButton = ({
	children,
	variant = "disabled",
	...props
}: SliderButtonProps) => {
	return (
		<button className={`slider__button slider__button--${variant}`} {...props}>
			{children}
		</button>
	);
};

export default SliderButton;
