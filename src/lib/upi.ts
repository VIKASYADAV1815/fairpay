/** Re-export settle pay helpers — kept so older imports keep working */
export {
  buildUpiLink,
  buildPayLink,
  buildWhatsAppSettleMessage,
  openWhatsAppWithMessage,
  openPayLink as openUpi,
} from '@/lib/settlePay';
