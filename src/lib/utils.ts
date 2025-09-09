import { type ClassValue, clsx } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('sr-RS')
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('sr-RS', {
    style: 'currency',
    currency: 'RSD'
  }).format(amount)
}

export function calculateMembershipStatus(endDate: string): 'active' | 'expiring' | 'expired' {
  const today = new Date()
  const membershipEnd = new Date(endDate)
  const daysUntilExpiry = Math.ceil((membershipEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (daysUntilExpiry < 0) return 'expired'
  if (daysUntilExpiry <= 3) return 'expiring'
  return 'active'
}