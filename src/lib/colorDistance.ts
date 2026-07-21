export function hexToRgb(hex: string): [number, number, number] {
	const n = parseInt(hex.slice(1), 16);
	return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function colorDistance(hexA: string, hexB: string): number {
	const [r1, g1, b1] = hexToRgb(hexA);
	const [r2, g2, b2] = hexToRgb(hexB);
	return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}
