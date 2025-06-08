import { Children } from "react";

interface SliderWrapperProps {
	children: React.ReactNode;
}

const SliderWrapper = ({ children }: SliderWrapperProps) => {
	return (
		<div className="flex flex-row justify-around items-center gap-2 bg-blue-400 rounded-[25px] p-1 w-full">
			{children}
		</div>
	);
};
export default SliderWrapper;
