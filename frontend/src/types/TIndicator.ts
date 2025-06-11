import type React from "react";

export type TIndicator =
	| "Дуже погано"
	| "Погано"
	| "Нормально"
	| "Добре"
	| "Дуже добре";

export interface TLevelIndicator {
	level?: number;
	description: React.ReactNode;
}
