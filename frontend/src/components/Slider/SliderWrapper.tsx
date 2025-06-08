import "./Slider.scss";

import React from "react";
import { Children } from "react";

interface SliderWrapperProps {
	children: React.ReactNode;
	activeIndex: number;
}

const SliderWrapper = ({ activeIndex, children }: SliderWrapperProps) => {
	const childrenCount = Children.count(children);

	return (
		<div className="slider">
			<div
				className="slider__button slider__button__indicator"
				style={{
					width: `calc(${100 / childrenCount}% - 0.5rem)`,
					left: `calc(${100 / childrenCount}% * ${activeIndex} + 0.25rem)`,
				}}></div>
			{children}
		</div>
	);
};
export default SliderWrapper;
