import { format } from 'date-fns'

export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(amount || 0)

export const formatDate = (dateStr) =>
  dateStr ? format(new Date(dateStr), 'dd MMM yyyy, HH:mm') : '—'

export const formatDateOnly = (dateStr) =>
  dateStr ? format(new Date(dateStr), 'dd MMM yyyy') : '—'

export const today = () => format(new Date(), 'yyyy-MM-dd')

export const ROLES = {
  admin:       'admin',
  manager:     'manager',
  cashier:     'cashier',
  pharmacist:  'pharmacist',
}

export const PAYMENT_METHODS = [
  { value: 'cash',         label: 'Cash' },
  { value: 'card',         label: 'Card' },
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'credit',       label: 'Credit' },
]

export const STORE_MODULES = [
  { value: 'general',     label: 'General' },
  { value: 'supermarket', label: 'Supermarket' },
  { value: 'pharmacy',    label: 'Pharmacy' },
]