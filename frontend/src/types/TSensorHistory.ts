export interface TSensorHistory {
	co2: { co2: number; time: string }[];
	humidity: { humidity: number; time: string }[];
	tempInside: { temp_inside: number; time: string }[];
	tempOutside: { temp_outside: number; time: string }[];
}
