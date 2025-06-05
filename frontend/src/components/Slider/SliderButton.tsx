interface SliderButtonProps {
	children: React.ReactNode;
}

const SliderButton = ({ children }: SliderButtonProps) => {
	return <button className="bg-white-100 w-full">{children}</button>;
};

export default SliderButton;
