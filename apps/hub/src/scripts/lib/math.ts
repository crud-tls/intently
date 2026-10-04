/**
 * The arithmetic behind every "feel it" moment. Pure and tested (math.test.ts), so the copy's
 * worked examples and the live versions can never disagree. Assumptions are parameters with the
 * defaults the pages state next to the numbers.
 */
export const WEEKS_PER_YEAR = 52;
export const WAKING_HOURS = 16;
export const STRIDE_M = 0.75;
export const MARATHON_KM = 42.195;

/** Weeks lived at an age in years. */
export const weeksLived = (age: number) => Math.max(0, Math.floor(age * WEEKS_PER_YEAR));

/** Weeks in a whole life of `years`. */
export const lifeWeeks = (years: number) => Math.round(years * WEEKS_PER_YEAR);

/** Phone hours a year at `perDay` hours a day. */
export const hoursPerYear = (perDay: number) => perDay * 365;

/** Hours as full waking days. */
export const wakingDays = (hours: number) => hours / WAKING_HOURS;

/** Of the waking years left, how many go to the phone at this daily rate. */
export const phoneYearsAhead = (perDay: number, age: number, life: number) =>
	(Math.max(0, life - age) * perDay) / WAKING_HOURS;

/** Kilometres a year from a daily step count. */
export const kmPerYear = (stepsPerDay: number, strideM = STRIDE_M) => (stepsPerDay * strideM * 365) / 1000;

export const marathons = (km: number) => km / MARATHON_KM;

/** A daily amount simply set aside: no growth. */
export const setAside = (perDay: number, years: number) => perDay * 365 * years;

/**
 * Illustration only: the same daily amount, put away once a year and growing at `rate` a year
 * (before inflation and fees). Equals setAside() when rate is 0.
 */
export function withGrowth(perDay: number, years: number, rate: number): number {
	const yearly = perDay * 365;
	if (rate === 0) return yearly * years;
	return (yearly * ((1 + rate) ** years - 1)) / rate;
}

/** Visits left with someone of `theirAge`, seen `perYear` times a year, if they live to `lifespan`. */
export const visitsLeft = (theirAge: number, perYear: number, lifespan = 85) =>
	Math.max(0, Math.round((lifespan - theirAge) * perYear));
