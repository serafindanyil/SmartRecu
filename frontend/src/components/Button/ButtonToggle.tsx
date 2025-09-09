import ButtonBase from "../Button/ButtonBase";
import SwitchState from "~/assets/switch-state.svg?react";

interface ShowBarBaseProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	isEnabled: boolean;
}

const ButtonToggle = ({ isEnabled, ...props }: ShowBarBaseProps) => {
	return (
		<ButtonBase variant={isEnabled ? "default" : "disabled"} {...props}>
			<SwitchState
				height={28}
				width={28}
				className={isEnabled ? "fill-white-100" : "fill-blue-500"}
			/>
		</ButtonBase>
	);
};

export default ButtonToggle;
