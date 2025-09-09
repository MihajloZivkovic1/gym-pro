import { z } from 'zod'

export const memberSchema = z.object({
  firstName: z.string().min(2, 'Ime mora imati najmanje 2 karaktera'),
  lastName: z.string().min(2, 'Prezime mora imati najmanje 2 karaktera'),
  email: z.string().email('Neispravna email adresa'),
  phone: z.string().optional(),
  membershipStart: z.string(),
  membershipDuration: z.number().min(1).max(24),
  planId: z.string().uuid('Molimo izaberite plan članarine')
})

export const paymentSchema = z.object({
  amount: z.number().positive('Iznos mora biti pozitivan broj'),
  paymentMethod: z.enum(['cash', 'card', 'bank_transfer']),
  monthsPaid: z.number().min(1).max(12),
  notes: z.string().optional()
})

export type MemberFormData = z.infer<typeof memberSchema>
export type PaymentFormData = z.infer<typeof paymentSchema>