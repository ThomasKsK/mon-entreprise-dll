import { describe, expect, it } from 'vitest'

/**
 * Fonction helper pour détecter si une valeur contient des décimales
 * (utilisée dans MontantField pour activer le mode centimes)
 */
export function hasDecimals(value: number): boolean {
	return value !== Math.floor(value)
}

describe('Mode centimes - Détection des décimales', () => {
	describe('hasDecimals', () => {
		it('détecte qu\'un nombre entier n\'a pas de décimales', () => {
			expect(hasDecimals(123)).toBe(false)
			expect(hasDecimals(0)).toBe(false)
			expect(hasDecimals(1000)).toBe(false)
		})

		it('détecte qu\'un nombre avec décimales a des décimales', () => {
			expect(hasDecimals(123.45)).toBe(true)
			expect(hasDecimals(123.4)).toBe(true)
			expect(hasDecimals(0.01)).toBe(true)
			expect(hasDecimals(0.1)).toBe(true)
		})

		it('gère les cas limites', () => {
			expect(hasDecimals(123.00)).toBe(false) // 123.00 === 123
			expect(hasDecimals(123.0)).toBe(false)
			expect(hasDecimals(0.0)).toBe(false)
		})

		it('gère les nombres négatifs', () => {
			expect(hasDecimals(-123)).toBe(false)
			expect(hasDecimals(-123.45)).toBe(true)
		})

		it('gère les très petites décimales', () => {
			expect(hasDecimals(123.001)).toBe(true)
			expect(hasDecimals(123.0001)).toBe(true)
		})
	})

	describe('Cas d\'usage réels', () => {
		it('active le mode centimes pour "123.45"', () => {
			const input = 123.45
			expect(hasDecimals(input)).toBe(true)
		})

		it('active le mode centimes pour "123,45" (converti en 123.45)', () => {
			// Le composant NumericInput convertit "123,45" en 123.45
			const input = 123.45
			expect(hasDecimals(input)).toBe(true)
		})

		it('n\'active pas le mode centimes pour "123"', () => {
			const input = 123
			expect(hasDecimals(input)).toBe(false)
		})

		it('n\'active pas le mode centimes pour "1000"', () => {
			const input = 1000
			expect(hasDecimals(input)).toBe(false)
		})

		it('active le mode centimes pour "2000.50"', () => {
			const input = 2000.5
			expect(hasDecimals(input)).toBe(true)
		})
	})
})
