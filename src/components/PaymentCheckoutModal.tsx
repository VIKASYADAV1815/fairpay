import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useThemeStore } from '@/store/theme';
import { formatMoney } from '@/lib/currency';
import { initiateCheckout, type PaymentRail, type CheckoutOptions } from '@/lib/billing';
import { radius, space, type } from '@/theme/tokens';

type Props = {
  visible: boolean;
  options: CheckoutOptions;
  onClose: () => void;
  onSuccess: () => void;
};

export function PaymentCheckoutModal({
  visible,
  options,
  onClose,
  onSuccess,
}: Props) {
  const c = useColors();
  const darkMode = useThemeStore((s) => s.darkMode);

  const isIndia = (options.currency || 'INR').toUpperCase() === 'INR';
  const [selectedRail, setSelectedRail] = useState<PaymentRail>(
    isIndia ? 'upi_instant' : 'stripe',
  );
  const [loading, setLoading] = useState(false);

  const formattedAmount = formatMoney(options.amount, options.currency);

  const handlePay = async () => {
    try {
      setLoading(true);
      const result = await initiateCheckout({
        ...options,
        preferredRail: selectedRail,
      });

      if (result.ok) {
        onSuccess();
        onClose();
        Alert.alert(
          '🎉 Payment Successful!',
          `${options.title} is now active. Enjoy premium features!`,
        );
      } else {
        Alert.alert('Payment Failed', result.reason);
      }
    } catch (err: any) {
      console.warn('Payment error:', err);
      Alert.alert('Error', err.message || 'Payment could not be processed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            {
              backgroundColor: c.card,
              borderColor: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <View style={[styles.eyebrowBadge, { backgroundColor: '#0A0A0A' }]}>
                <Text style={[styles.eyebrow, { color: c.accent }]}>Secure checkout</Text>
              </View>
              <Text style={[styles.title, { color: c.text }]}>{options.title}</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={c.textSecondary} />
            </Pressable>
          </View>

          {/* Amount Box */}
          <View
            style={[
              styles.amountBox,
              { backgroundColor: darkMode ? '#232D15' : '#F6FFDC' },
            ]}
          >
            <Text style={[styles.amountLabel, { color: darkMode ? c.textSecondary : '#4B5563' }]}>
              Amount Due
            </Text>
            <Text style={[styles.amountValue, { color: c.text }]}>
              {formattedAmount}
            </Text>
          </View>

          {/* Payment Method Selector */}
          <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>
            Choose payment method
          </Text>

          {/* Option A: 1-Tap UPI (India) */}
          {isIndia && (
            <Pressable
              style={[
                styles.methodCard,
                {
                  borderColor: selectedRail === 'upi_instant' ? c.accent : c.separator,
                  backgroundColor:
                    selectedRail === 'upi_instant'
                      ? darkMode
                        ? '#2C2C2E'
                        : '#FAFAFA'
                      : c.fill,
                },
              ]}
              onPress={() => setSelectedRail('upi_instant')}
            >
              <View style={[styles.methodIconWrap, { backgroundColor: '#34C759' }]}>
                <Ionicons name="flash" size={18} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.methodTitle, { color: c.text }]}>
                  Instant UPI (0 Fee)
                </Text>
                <Text style={[styles.methodSub, { color: c.textSecondary }]}>
                  PhonePe, GPay, Paytm, BHIM or any UPI app
                </Text>
              </View>
              {selectedRail === 'upi_instant' && (
                <Ionicons name="checkmark-circle" size={22} color={c.green} />
              )}
            </Pressable>
          )}

          {/* Option B: Razorpay (India Cards/Netbanking) */}
          {isIndia && (
            <Pressable
              style={[
                styles.methodCard,
                {
                  borderColor: selectedRail === 'razorpay' ? c.accent : c.separator,
                  backgroundColor:
                    selectedRail === 'razorpay'
                      ? darkMode
                        ? '#2C2C2E'
                        : '#FAFAFA'
                      : c.fill,
                },
              ]}
              onPress={() => setSelectedRail('razorpay')}
            >
              <View style={[styles.methodIconWrap, { backgroundColor: '#0284C7' }]}>
                <Ionicons name="card" size={18} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.methodTitle, { color: c.text }]}>
                  Razorpay Secure
                </Text>
                <Text style={[styles.methodSub, { color: c.textSecondary }]}>
                  Credit/Debit Cards, NetBanking & UPI QR
                </Text>
              </View>
              {selectedRail === 'razorpay' && (
                <Ionicons name="checkmark-circle" size={22} color={c.green} />
              )}
            </Pressable>
          )}

          {/* Option C: Stripe (Global / Cards) */}
          <Pressable
            style={[
              styles.methodCard,
              {
                borderColor: selectedRail === 'stripe' ? c.accent : c.separator,
                backgroundColor:
                  selectedRail === 'stripe'
                    ? darkMode
                      ? '#2C2C2E'
                      : '#FAFAFA'
                    : c.fill,
              },
            ]}
            onPress={() => setSelectedRail('stripe')}
          >
            <View style={[styles.methodIconWrap, { backgroundColor: '#6366F1' }]}>
              <Ionicons name="globe-outline" size={18} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.methodTitle, { color: c.text }]}>
                Stripe Global Checkout
              </Text>
              <Text style={[styles.methodSub, { color: c.textSecondary }]}>
                Apple Pay, Google Pay & International Cards
              </Text>
            </View>
            {selectedRail === 'stripe' && (
              <Ionicons name="checkmark-circle" size={22} color={c.green} />
            )}
          </Pressable>

          {/* Security Badge */}
          <View style={styles.securityRow}>
            <Ionicons name="shield-checkmark" size={14} color={c.green} />
            <Text style={[styles.securityText, { color: c.textSecondary }]}>
              256-bit encrypted · RBI & PCI-DSS Compliant
            </Text>
          </View>

          {/* Pay Button */}
          <Pressable
            style={[
              styles.payBtn,
              { backgroundColor: c.accentInk },
              loading && { opacity: 0.7 },
            ]}
            onPress={handlePay}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={c.accent} />
            ) : (
              <Text style={[styles.payBtnText, { color: c.accent }]}>
                Pay {formattedAmount} Securely
              </Text>
            )}
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: space.xl,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: space.lg,
  },
  eyebrowBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  eyebrow: {
    ...type.caption2,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  title: {
    ...type.title2,
    fontSize: 22,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  amountBox: {
    borderRadius: radius.md,
    padding: space.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.lg,
  },
  amountLabel: {
    ...type.subheadline,
    fontWeight: '600',
  },
  amountValue: {
    ...type.largeTitle,
    fontSize: 24,
    fontWeight: '800',
  },
  sectionLabel: {
    ...type.caption2,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: space.sm,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: space.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    marginBottom: space.sm,
    gap: space.md,
  },
  methodIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodTitle: {
    ...type.subheadline,
    fontWeight: '700',
  },
  methodSub: {
    ...type.caption1,
    fontSize: 12,
    marginTop: 2,
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: space.sm,
    marginBottom: space.lg,
  },
  securityText: {
    ...type.caption2,
    fontWeight: '500',
  },
  payBtn: {
    borderRadius: radius.pill,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payBtnText: {
    ...type.subheadline,
    fontWeight: '800',
    fontSize: 16,
  },
});
