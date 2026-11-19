import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useThemeStore } from '@/store/theme';
import { useAuthStore } from '@/store/auth';
import { getFirstName } from '@/lib/welcomeEmail';
import { FairpayMark, FairpayLogo } from '@/components/FairpayLogo';

export function WelcomeGreetingModal() {
  const c = useColors();
  const darkMode = useThemeStore((s) => s.darkMode);
  const { showWelcomeModal, setShowWelcomeModal, name, email } = useAuthStore();
  const [showMailPreview, setShowMailPreview] = useState(false);

  if (!showWelcomeModal) return null;

  const firstName = getFirstName(name);
  const targetEmail = email || 'your email';

  return (
    <Modal
      visible={showWelcomeModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowWelcomeModal(false)}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: darkMode ? '#18181A' : '#FFFFFF',
              borderColor: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            },
          ]}
        >
          {/* Header Status Bar */}
          <View style={styles.topRow}>
            <View
              style={[
                styles.badgeWrap,
                { backgroundColor: darkMode ? '#242426' : '#F2F2F7' },
              ]}
            >
              <View style={styles.greenDot} />
              <Text style={[styles.badgeText, { color: c.textSecondary }]}>
                ACCOUNT VERIFIED
              </Text>
            </View>
            <Pressable
              hitSlop={14}
              onPress={() => setShowWelcomeModal(false)}
              style={styles.closeBtn}
            >
              <Ionicons name="close" size={18} color={c.textSecondary} />
            </Pressable>
          </View>

          {!showMailPreview ? (
            <>
              {/* Brand Mark & Apple Thin Display Typography */}
              <View style={styles.headingWrap}>
                <FairpayMark size={48} style={styles.logoMark} />
                <Text style={[styles.title, { color: c.text }]}>
                  Welcome, {firstName}
                </Text>
                <Text style={[styles.subtitle, { color: c.textSecondary }]}>
                  Zero-friction shared money. Your Fairpay account is ready.
                </Text>
              </View>

              {/* Feature Highlights (Apple border-free soft tiles) */}
              <View style={styles.featureList}>
                <View
                  style={[
                    styles.featureItem,
                    { backgroundColor: darkMode ? '#222225' : '#F5F5F7' },
                  ]}
                >
                  <View style={[styles.featureIconWrap, { backgroundColor: c.accent }]}>
                    <Ionicons name="flash-outline" size={15} color="#000" />
                  </View>
                  <View style={styles.featureTextWrap}>
                    <Text style={[styles.featureTitle, { color: c.text }]}>
                      Smart split engine
                    </Text>
                    <Text style={[styles.featureDesc, { color: c.textSecondary }]}>
                      Minimises transactions so 10 debts simplify into 2 direct payments.
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.featureItem,
                    { backgroundColor: darkMode ? '#222225' : '#F5F5F7' },
                  ]}
                >
                  <View style={[styles.featureIconWrap, { backgroundColor: c.accent }]}>
                    <Ionicons name="wallet-outline" size={15} color="#000" />
                  </View>
                  <View style={styles.featureTextWrap}>
                    <Text style={[styles.featureTitle, { color: c.text }]}>
                      1-Tap settlement rails
                    </Text>
                    <Text style={[styles.featureDesc, { color: c.textSecondary }]}>
                      Instant transfers via WhatsApp, UPI, GPay, PhonePe, and Paytm.
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.featureItem,
                    { backgroundColor: darkMode ? '#222225' : '#F5F5F7' },
                  ]}
                >
                  <View style={[styles.featureIconWrap, { backgroundColor: c.accent }]}>
                    <Ionicons name="document-text-outline" size={15} color="#000" />
                  </View>
                  <View style={styles.featureTextWrap}>
                    <Text style={[styles.featureTitle, { color: c.text }]}>
                      Apple-grade statements
                    </Text>
                    <Text style={[styles.featureDesc, { color: c.textSecondary }]}>
                      Clean 2-page PDF balance reports with high-fidelity mockups.
                    </Text>
                  </View>
                </View>
              </View>

              {/* Mail notification note */}
              <View
                style={[
                  styles.mailNote,
                  {
                    backgroundColor: darkMode
                      ? 'rgba(178,255,36,0.08)'
                      : 'rgba(178,255,36,0.14)',
                  },
                ]}
              >
                <Ionicons
                  name="mail-unread-outline"
                  size={15}
                  color={darkMode ? '#B2FF24' : '#2D6B00'}
                />
                <Text
                  style={[
                    styles.mailNoteText,
                    { color: darkMode ? '#D2FFA0' : '#235200' },
                  ]}
                >
                  A welcome email has been sent to{' '}
                  <Text style={{ fontWeight: '500' }}>{targetEmail}</Text>
                </Text>
              </View>

              {/* Actions */}
              <View style={styles.actions}>
                <Pressable
                  style={[
                    styles.primaryBtn,
                    { backgroundColor: darkMode ? '#B2FF24' : '#000000' },
                  ]}
                  onPress={() => setShowWelcomeModal(false)}
                >
                  <Text
                    style={[
                      styles.primaryBtnText,
                      { color: darkMode ? '#000000' : '#FFFFFF' },
                    ]}
                  >
                    Get Started &rarr;
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.secondaryBtn}
                  onPress={() => setShowMailPreview(true)}
                >
                  <Text style={[styles.secondaryBtnText, { color: c.textSecondary }]}>
                    Preview welcome email
                  </Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              {/* Mail Preview Screen */}
              <View style={{ marginBottom: 12 }}>
                <Text style={[styles.previewHeader, { color: c.text }]}>
                  Welcome Email
                </Text>
                <Text style={[styles.previewSub, { color: c.textSecondary }]}>
                  To: {targetEmail} &middot; From: Fairpay
                </Text>
              </View>

              <ScrollView
                style={[
                  styles.mailBodyScroll,
                  { backgroundColor: darkMode ? '#121214' : '#F8F9FA' },
                ]}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.mailPaper}>
                  <View style={styles.mailTop}>
                    <FairpayLogo width={92} />
                  </View>
                  <Text style={styles.mailDate}>Welcome &middot; Account Active</Text>
                  <Text style={[styles.mailTitle, { color: darkMode ? '#FFFFFF' : '#000000' }]}>
                    Welcome, {firstName}.
                  </Text>
                  <Text style={[styles.mailText, { color: darkMode ? '#A1A1A6' : '#3A3A3C' }]}>
                    Your Fairpay account is ready. Zero-friction group expense management designed with clarity, speed, and precision.
                  </Text>

                  <View
                    style={[
                      styles.mailDivider,
                      { backgroundColor: darkMode ? '#2C2C2E' : '#E5E5EA' },
                    ]}
                  />

                  <View style={styles.mailFeature}>
                    <Text style={[styles.mailFeatureTitle, { color: darkMode ? '#FFFFFF' : '#000000' }]}>
                      &bull; Smart Split Engine
                    </Text>
                    <Text style={styles.mailFeatureDesc}>
                      Minimises debt paths so multi-member trips resolve easily.
                    </Text>
                  </View>

                  <View style={styles.mailFeature}>
                    <Text style={[styles.mailFeatureTitle, { color: darkMode ? '#FFFFFF' : '#000000' }]}>
                      &bull; 1-Tap Settlements
                    </Text>
                    <Text style={styles.mailFeatureDesc}>
                      Direct settlement links on UPI, WhatsApp, GPay, and PhonePe.
                    </Text>
                  </View>

                  <View style={styles.mailFeature}>
                    <Text style={[styles.mailFeatureTitle, { color: darkMode ? '#FFFFFF' : '#000000' }]}>
                      &bull; 2-Page Statements
                    </Text>
                    <Text style={styles.mailFeatureDesc}>
                      Export clean, verified PDF reports ready to share.
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.mailDivider,
                      { backgroundColor: darkMode ? '#2C2C2E' : '#E5E5EA' },
                    ]}
                  />

                  <Text style={styles.mailFooterText}>
                    Fairpay &bull; Settle smarter &bull; fairpay.app
                  </Text>
                </View>
              </ScrollView>

              <Pressable
                style={[
                  styles.primaryBtn,
                  {
                    marginTop: 14,
                    backgroundColor: darkMode ? '#B2FF24' : '#000000',
                  },
                ]}
                onPress={() => setShowMailPreview(false)}
              >
                <Text
                  style={[
                    styles.primaryBtnText,
                    { color: darkMode ? '#000000' : '#FFFFFF' },
                  ]}
                >
                  &larr; Back to Welcome
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 390,
    borderRadius: 26,
    borderWidth: 1,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#B2FF24',
    marginRight: 6,
  },
  badgeText: {
    fontSize: 9.5,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  closeBtn: {
    padding: 4,
  },
  headingWrap: {
    alignItems: 'center',
    marginBottom: 18,
  },
  logoMark: {
    marginBottom: 10,
  },
  title: {
    fontSize: 27,
    fontWeight: '300', // Thin Apple SF Pro display typography
    letterSpacing: -0.7,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 18,
    letterSpacing: -0.1,
  },
  featureList: {
    marginBottom: 14,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 11,
    borderRadius: 14,
    marginBottom: 8,
  },
  featureIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  featureTextWrap: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 12.5,
    fontWeight: '500',
    letterSpacing: -0.1,
    marginBottom: 1.5,
  },
  featureDesc: {
    fontSize: 11,
    fontWeight: '400',
    lineHeight: 15,
    letterSpacing: -0.1,
  },
  mailNote: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    marginBottom: 16,
  },
  mailNoteText: {
    fontSize: 11.5,
    fontWeight: '400',
    marginLeft: 8,
    flex: 1,
    lineHeight: 15,
  },
  actions: {
    alignItems: 'center',
  },
  primaryBtn: {
    width: '100%',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  secondaryBtn: {
    paddingVertical: 6,
  },
  secondaryBtnText: {
    fontSize: 12.5,
    fontWeight: '400',
    letterSpacing: -0.1,
    textDecorationLine: 'underline',
  },
  previewHeader: {
    fontSize: 17,
    fontWeight: '400',
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  previewSub: {
    fontSize: 11.5,
    fontWeight: '400',
  },
  mailBodyScroll: {
    maxHeight: 280,
    borderRadius: 14,
    padding: 14,
  },
  mailPaper: {
    padding: 4,
  },
  mailTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  mailDate: {
    fontSize: 10,
    color: '#8E8E93',
    marginBottom: 4,
    fontWeight: '400',
  },
  mailTitle: {
    fontSize: 19,
    fontWeight: '300',
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  mailText: {
    fontSize: 11.5,
    fontWeight: '400',
    lineHeight: 16,
    marginBottom: 10,
  },
  mailDivider: {
    height: 1,
    marginVertical: 10,
  },
  mailFeature: {
    marginBottom: 8,
  },
  mailFeatureTitle: {
    fontSize: 11.5,
    fontWeight: '500',
  },
  mailFeatureDesc: {
    fontSize: 10.5,
    color: '#8E8E93',
    lineHeight: 14,
    fontWeight: '400',
  },
  mailFooterText: {
    fontSize: 9.5,
    color: '#8E8E93',
    textAlign: 'center',
    fontWeight: '400',
  },
});
