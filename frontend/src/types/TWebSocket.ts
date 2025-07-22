export type TMessagePayload = {
	device: "server" | "web";
	type: string;
	data?: unknown;
};

export type TSensorData = {
	tempOut: number;
	tempIn: number;
	co2: number;
	humidity: number;
	fanInRPM: number;
	fanOutRPM: number;
	fanInSpd: number;
	fanOutSpd: number;
};

export type TAirQualityConfig = {
	co2: {
		poor: string;
		bad: string;
		good: string;
		well: string;
	};
	humidity: {
		poor: string;
		bad: string;
		good: string;
		well: string;
	};
};

export type TConnectionStatus = "Online" | "Offline";

import type { TSensorHistory } from "~/types/TSensorHistory";

export interface TWebSocketContextType {
	sensorData: TSensorData | null;
	sensorHistory: TSensorHistory | null;
	switchState: boolean;
	changeMode: TChangeMode;
	fanInSpeed: number;
	fanOutSpeed: number;
	indicatorConfig: TAirQualityConfig | null;
	connectionStatus: TConnectionStatus;
	error: string | null;
	sendMessage: (type: string, data?: unknown) => void;
	reconnect: () => void;
}

import type { TChangeMode } from "~/types/TChangeMode";

export interface TWebSocketSetupData {
	metrics: TAirQualityConfig;
	switchState: boolean;
	mode: TChangeMode;
	fanInSpd: number;
	fanOutSpd: number;
}
