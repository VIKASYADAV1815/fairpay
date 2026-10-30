import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { router } from 'expo-router';
import { SoftCard } from '@/components/SoftCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useColors } from '@/store/theme';
import { useAuthStore } from '@/store/auth';
import { CURRENCIES, type CurrencyCode } from '@/lib/currency';
import { radius, space, type } from '@/theme/tokens';
import { enter } from '@/theme/motion';

type Props = {
  visible: boolean;
  onClose: () => void;
  onCreate: (name: string, purpose?: string, currency?: CurrencyCode) => void;
};

type Mode = 'choose' | 'create';

const IDEAS = ['Manali Weekend', 'Office lunch', 'Flat 402', 'Team offsite', 'Birthday bash'];

export function NewTripSheet({ visible, onClose, onCreate }: Props) {
  const c = useColors();
  const preferredCurrency = useAuthStore((s) => s.preferredCurrency);
  const [mode, setMode] = useState<Mode>('choose');
  const [name, setName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>(preferredCurrency);
  const inputRef = useRef<any>(null);
  const canCreate = name.trim().length > 0;

  useEffect(() => {
    if (!visible) {
      setMode('choose');
      return;
    }
    setCurrency(preferredCurrency);
  }, [visible, preferredCurrency]);

  useEffect(() => {
    if (!visible || mode !== 'create') return;
    const t = setTimeout(() => inputRef.current?.focus?.(), 350);
    return () => clearTimeout(t);
  }, [visible, mode]);

  const handleCreate = () => {
    if (!canCreate) return;
    onCreate(name.trim(), purpose.trim() || undefined, currency);
    setName('');
    setPurpose('');
    setMode('choose');
  };

  const handleClose = () => {
    setName('');
    setPurpose('');
    setMode('choose');
    onClose();
  };

  const goJoinCode = () => {
    handleClose();
    router.push('/join');
  };

  const goScan = () => {
    handleClose();
    router.push('/scan');
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={[styles.screen, { backgroundColor: c.bgGrouped }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable
            onPress={mode === 'create' ? () => setMode('choose') : handleClose}
            hitSlop={12}
            style={styles.iconBtn}
          >
            <Ionicons name="chevron-back" size={24} color={c.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: c.text }]}>
            {mode === 'choose' ? 'Start' : 'New group'}
          </Text>
          <View style={styles.iconBtn} />
        </View>

        {mode === 'choose' ? (
          <View style={styles.body}>
            <Text style={[styles.hero, { color: c.text }]}>Create or join</Text>
            <Text style={[styles.sub, { color: c.textSecondary }]}>
              Start a group, enter a code, or scan a QR — right from the beginning.
            </Text>

            <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} transition={enter(40)}>
              <Pressable onPress={() => setMode('create')}>
                <SoftCard tone="white" style={styles.option}>
                  <View style={[styles.optionIcon, { backgroundColor: c.accent }]}>
                    <Ionicons name="add-circle-outline" size={22} color={c.accentInk} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.optionTitle, { color: c.text }]}>Create group</Text>
                    <Text style={[styles.optionBody, { color: c.textSecondary }]}>
                      Name it, add people, then invite with link / QR
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={c.textTertiary} />
                </SoftCard>
              </Pressable>
            </MotiView>

            <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} transition={enter(80)}>
              <Pressable onPress={goJoinCode}>
                <SoftCard tone="white" style={styles.option}>
                  <View style={[styles.optionIcon, { backgroundColor: c.accent }]}>
                    <Ionicons name="keypad-outline" size={22} color={c.accentInk} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.optionTitle, { color: c.text }]}>Enter invite code</Text>
                    <Text style={[styles.optionBody, { color: c.textSecondary }]}>
                      Someone shared a 6-character Fairpay code
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={c.textTertiary} />
                </SoftCard>
              </Pressable>
            </MotiView>

            <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} transition={enter(120)}>
              <Pressable onPress={goScan}>
                <SoftCard tone="white" style={styles.option}>
                  <View style={[styles.optionIcon, { backgroundColor: c.accent }]}>
                    <Ionicons name="qr-code-outline" size={22} color={c.accentInk} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.optionTitle, { color: c.text }]}>Scan QR</Text>
                    <Text style={[styles.optionBody, { color: c.textSecondary }]}>
                      Open camera and join instantly
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={c.textTertiary} />
                </SoftCard>
              </Pressable>
            </MotiView>
          </View>
        ) : (
          <>
            <View style={styles.body}>
              <MotiView
                from={{ opacity: 0, translateY: 16 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={enter(40)}
              >
                <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>Name it anything</Text>
                <SoftCard tone="white" style={styles.inputCard}>
                  <TextInput
                    ref={inputRef}
                    value={name}
                    onChangeText={setName}
                    placeholder="Travel, office, rent, party…"
                    placeholderTextColor={c.textTertiary}
                    style={[styles.input, { color: c.text }]}
                    returnKeyType="next"
                    autoCorrect={false}
                    selectionColor={c.accent}
                  />
                </SoftCard>
              </MotiView>

              <Text style={[styles.sectionLabel, { color: c.textSecondary, marginTop: space.xxl }]}>
                Ideas (optional)
              </Text>
              <View style={styles.chips}>
                {IDEAS.map((s, i) => (
                  <MotiView
                    key={s}
                    transition={enter(80 + i * 35)}
                    from={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <Pressable
                      onPress={() => setName(s)}
                      style={[
                        styles.chip,
                        { backgroundColor: name === s ? c.accent : c.fillSecondary },
                      ]}
                    >
                      <Text style={[styles.chipText, { color: name === s ? c.accentInk : c.text }]}>
                        {s}
                      </Text>
                    </Pressable>
                  </MotiView>
                ))}
              </View>

              <Text style={[styles.sectionLabel, { color: c.textSecondary, marginTop: space.xxl }]}>
                Purpose tag (optional)
              </Text>
              <SoftCard tone="white" style={styles.inputCard}>
                <TextInput
                  value={purpose}
                  onChangeText={setPurpose}
                  placeholder="e.g. Travel · Office · Friends"
                  placeholderTextColor={c.textTertiary}
                  style={[styles.purposeInput, { color: c.text }]}
                  autoCorrect={false}
                  selectionColor={c.accent}
                />
              </SoftCard>

              <Text style={[styles.sectionLabel, { color: c.textSecondary, marginTop: space.xxl }]}>
                Group currency
              </Text>
              <View style={styles.chips}>
                {CURRENCIES.slice(0, 6).map((cur) => {
                  const on = currency === cur.code;
                  return (
                    <Pressable
                      key={cur.code}
                      onPress={() => setCurrency(cur.code)}
                      style={[
                        styles.chip,
                        { backgroundColor: on ? c.accent : c.fillSecondary },
                      ]}
                    >
                      <Text style={[styles.chipText, { color: on ? c.accentInk : c.text }]}>
                        {cur.symbol} {cur.code}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <SoftCard tone="white" style={styles.hintCard}>
                <View style={styles.hintRow}>
                  <View style={[styles.hintIcon, { backgroundColor: c.accent }]}>
                    <Ionicons name="share-outline" size={18} color={c.accentInk} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.hintTitle, { color: c.text }]}>Invite next</Text>
                    <Text style={[styles.hintBody, { color: c.textSecondary }]}>
                      After create you’ll add people — then Invite / QR from the group.
                    </Text>
                  </View>
                </View>
              </SoftCard>
            </View>

            <View style={styles.footer}>
              <PrimaryButton
                label="Continue"
                variant="accent"
                disabled={!canCreate}
                onPress={handleCreate}
              />
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
    paddingBottom: space.md,
  },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...type.headline },
  body: { flex: 1, paddingHorizontal: space.xl, paddingTop: space.md },
  hero: { ...type.title1, marginBottom: space.sm },
  sub: { ...type.body, marginBottom: space.xxl },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginBottom: space.sm,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: { ...type.subheadline },
  optionBody: { ...type.caption1, marginTop: 2 },
  sectionLabel: {
    ...type.footnote,
    marginBottom: space.sm,
    marginLeft: 4,
  },
  inputCard: { paddingVertical: 4, paddingHorizontal: space.lg },
  input: { ...type.title1, paddingVertical: space.lg },
  purposeInput: { ...type.title3, paddingVertical: space.lg },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.pill,
  },
  chipText: { ...type.footnote, fontWeight: '700' },
  hintCard: { marginTop: space.xxl },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  hintIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintTitle: { ...type.subheadline, marginBottom: 2 },
  hintBody: { ...type.caption1 },
  footer: {
    paddingHorizontal: space.xl,
    paddingBottom: space.xxxl,
    paddingTop: space.lg,
  },
});
