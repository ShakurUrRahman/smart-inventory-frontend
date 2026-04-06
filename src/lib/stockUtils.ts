/**
 * Stock Level Color Utilities
 * Provides unified color theming for stock levels across components
 * Ensures icon, progress bar, text, and background colors are always synchronized
 */

export interface StockColorTheme {
	barColor: string; // for progress bar (e.g., "bg-red-500")
	iconColor: string; // for icon (e.g., "text-red-500")
	iconBgColor: string; // for icon background (e.g., "bg-red-100")
	textColor: string; // for text labels (e.g., "text-red-700")
	badgeColor: string; // for status badge (e.g., "bg-red-100 text-red-900")
	borderColor: string; // for borders (e.g., "border-red-200")
}

/**
 * Get all color classes for a stock level based on current vs threshold
 * Returns consistent colors for icon, bar, text, background, etc.
 *
 * @param currentStock - Current stock quantity
 * @param threshold - Minimum stock threshold
 * @returns StockColorTheme object with all color classes
 *
 * @example
 * const colors = getStockLevelColors(15, 50);
 * // Returns red theme (30% = critical)
 */
export const getStockLevelColors = (
	currentStock: number,
	threshold: number,
): StockColorTheme => {
	// Calculate percentage (0-100%)
	const percentage = Math.min((currentStock / threshold) * 100, 100);

	// Determine colors based on percentage
	if (percentage <= 30) {
		// Critical: Red (≤30%)
		return {
			barColor: "bg-red-500",
			iconColor: "text-red-500",
			iconBgColor: "bg-red-100",
			textColor: "text-red-700",
			badgeColor: "bg-red-100 text-red-900",
			borderColor: "border-red-200",
		};
	}

	if (percentage <= 60) {
		// Warning: Amber (31-60%)
		return {
			barColor: "bg-amber-500",
			iconColor: "text-amber-500",
			iconBgColor: "bg-amber-100",
			textColor: "text-amber-700",
			badgeColor: "bg-amber-100 text-amber-900",
			borderColor: "border-amber-200",
		};
	}

	// Healthy: Green (>60%)
	return {
		barColor: "bg-green-500",
		iconColor: "text-green-500",
		iconBgColor: "bg-green-100",
		textColor: "text-green-700",
		badgeColor: "bg-green-100 text-green-900",
		borderColor: "border-green-200",
	};
};

/**
 * Calculate stock level as percentage of threshold
 *
 * @param current - Current stock quantity
 * @param threshold - Minimum stock threshold
 * @returns Percentage (0-100)
 *
 * @example
 * getStockPercentage(30, 100) // returns 30
 * getStockPercentage(150, 100) // returns 100 (capped)
 */
export const getStockPercentage = (
	current: number,
	threshold: number,
): number => {
	return Math.min((current / threshold) * 100, 100);
};

/**
 * Get human-readable status based on stock percentage
 *
 * @param percentage - Stock level percentage (0-100)
 * @returns Status string: "Critical", "Low", or "Healthy"
 *
 * @example
 * getStockStatus(25) // returns "Critical"
 * getStockStatus(45) // returns "Low"
 * getStockStatus(75) // returns "Healthy"
 */
export const getStockStatus = (percentage: number): string => {
	if (percentage <= 30) return "Critical";
	if (percentage <= 60) return "Low";
	return "Healthy";
};

/**
 * Get priority level based on stock percentage (for sorting)
 *
 * @param percentage - Stock level percentage (0-100)
 * @returns Priority number: 3 (critical), 2 (low), 1 (healthy)
 *
 * @example
 * getStockPriority(15) // returns 3
 * getStockPriority(50) // returns 2
 * getStockPriority(80) // returns 1
 */
export const getStockPriority = (percentage: number): number => {
	if (percentage <= 30) return 3; // Critical - highest priority
	if (percentage <= 60) return 2; // Low - medium priority
	return 1; // Healthy - low priority
};

/**
 * Combine all stock information into a single object
 * Useful for components that need multiple pieces of stock info
 *
 * @param currentStock - Current stock quantity
 * @param threshold - Minimum stock threshold
 * @returns Object containing percentage, status, priority, and colors
 *
 * @example
 * const stock = getStockInfo(25, 100);
 * // {
 * //   percentage: 25,
 * //   status: "Critical",
 * //   priority: 3,
 * //   colors: { barColor: "bg-red-500", ... }
 * // }
 */
export const getStockInfo = (currentStock: number, threshold: number) => {
	const percentage = getStockPercentage(currentStock, threshold);
	const status = getStockStatus(percentage);
	const priority = getStockPriority(percentage);
	const colors = getStockLevelColors(currentStock, threshold);

	return {
		percentage,
		status,
		priority,
		colors,
	};
};

/**
 * Check if stock is critical (needs immediate attention)
 *
 * @param percentage - Stock level percentage (0-100)
 * @returns boolean - true if percentage <= 30
 */
export const isCritical = (percentage: number): boolean => {
	return percentage <= 30;
};

/**
 * Check if stock is low (needs attention soon)
 *
 * @param percentage - Stock level percentage (0-100)
 * @returns boolean - true if percentage <= 60
 */
export const isLow = (percentage: number): boolean => {
	return percentage <= 60 && percentage > 30;
};

/**
 * Check if stock is healthy (no action needed)
 *
 * @param percentage - Stock level percentage (0-100)
 * @returns boolean - true if percentage > 60
 */
export const isHealthy = (percentage: number): boolean => {
	return percentage > 60;
};

/**
 * Thresholds for stock level classification
 * Can be adjusted if your business rules change
 */
export const STOCK_THRESHOLDS = {
	CRITICAL_LEVEL: 30, // <= 30%
	LOW_LEVEL: 60, // <= 60%
	HEALTHY_LEVEL: 100, // > 60%
};
