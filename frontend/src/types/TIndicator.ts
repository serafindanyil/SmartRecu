export type TIndicator =
	| "Дуже погано"
	| "Погано"
	| "Нормально"
	| "Добре"
	| "Дуже добре";

export interface TLevelIndicator {
	level: number | "Не визначено";
}
