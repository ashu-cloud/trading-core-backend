/** Utility helpers */
import { twMerge } from 'tailwind-merge'
import clsx from 'clsx'
import { format } from 'date-fns'

/**
 * Class name helper that merges tailwind classes.
 */
export function cn(...inputs) {
  return twMerge(clsx(...inputs))
}

/**
 * Format a number as a currency string in USD (defensive)
 * @param {number} value
 */
export function formatCurrency(value) {
  const n = Number(value ?? 0)
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

/**
 * Format date as `DD MMM HH:mm`
 * @param {string|number|Date} d
 */
export function formatDate(d) {
  try {
    return format(new Date(d), 'dd MMM HH:mm')
  } catch (e) {
    return ''
  }
}
