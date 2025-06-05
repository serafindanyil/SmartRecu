import { Children } from "react";

interface SliderWrapperProps {
	children: React.ReactNode;
}

const SliderWrapper = ({ children }: SliderWrapperProps) => {
	return (
		<div className="flex flex-row justify-between items-center bg-blue-400 rounded-[25px] p-1 w-full">
			{children}
		</div>
	);
};
export default SliderWrapper;
