import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { SoftCard } from '@/components/SoftCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import type { Member, Expense } from '@/store/trips';
import { useColors } from '@/store/theme';
import { radius, space, type } from '@/theme/tokens';

type Props = {
  visible: boolean;
  expense: Expense | null;
  members: Member[];
  currencySymbol?: string;
  onClose: () => void;
  onUpdate: (expenseId: string, data: {
    title: string;
    amount: number;
    paidById: string;
    splits: import('@/store/trips').ExpenseSplit[];
    recurring?: boolean;
    tag?: string;
    receiptUri?: string;
  }) => void;
  onDelete: (expenseId: string) => void;
};

const TAG_IDEAS = ['Travel', 'Food', 'Rent', 'Office', 'Fun', 'Utilities'];

export function EditExpenseSheet({
  visible,
  expense,
  members,
  currencySymbol = '₹',
  onClose,
  onUpdate,
  onDelete,
}: Props) {
  const c = useColors();
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [tag, setTag] = useState('');
  const [paidById, setPaidById] = useState('');
  const [splitIds, setSplitIds] = useState<string[]>([]);
  const [splitMode, setSplitMode] = useState<'equal' | 'custom'>('equal');
  const [customSplits, setCustomSplits] = useState<Record<string, number>>({});
  const [recurring, setRecurring] = useState(false);
  const [receiptUri, setReceiptUri] = useState<string | undefined>();
  const titleRef = useRef<any>(null);

  useEffect(() => {
    if (!visible || !expense) return;
    
    setTitle(expense.title);
    setAmount(String(expense.amount));
    setTag(expense.tag || '');
    setPaidById(expense.paidById);
    setRecurring(expense.recurring || false);
    setReceiptUri(expense.receiptUri);
    
    // Convert splits to splitIds and customSplits for UI
    if (expense.splits && expense.splits.length > 0) {
      const ids = expense.splits.map(s => s.memberId);
      setSplitIds(ids);
      
      // Check if it's custom split (amounts differ significantly)
      const amounts = expense.splits.map(s => s.amount);
      const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const isCustom = amounts.some(amt => Math.abs(amt - avg) > 0.02);
      
      if (isCustom) {
        setSplitMode('custom');
        const custom: Record<string, number> = {};
        expense.splits.forEach(s => custom[s.memberId] = s.amount);
        setCustomSplits(custom);
      } else {
        setSplitMode('equal');
        setCustomSplits({});
      }
    } else if (expense.splitAmongIds) {
      // Legacy fallback
      setSplitIds(expense.splitAmongIds || []);
      if (expense.customSplitAmounts) {
        setSplitMode('custom');
        setCustomSplits(expense.customSplitAmounts);
      } else {
        setSplitMode('equal');
        setCustomSplits({});
      }
    }
    
    const t = setTimeout(() => titleRef.current?.focus?.(), 350);
    return () => clearTimeout(t);
  }, [visible, expense]);

  const parsed = useMemo(() => Number(amount.replace(/,/g, '')), [amount]);
  
  const customTotal = useMemo(() => {
    if (splitMode === 'equal') return 0;
    return Object.values(customSplits).reduce((sum, val) => sum + (Number(val) || 0), 0);
  }, [splitMode, customSplits]);
  
  const canSave =
    title.trim().length > 0 &&
    Number.isFinite(parsed) &&
    parsed > 0 &&
    !!paidById &&
    (splitMode === 'equal' 
      ? splitIds.length > 0 
      : Math.abs(customTotal - parsed) < 0.01);

  const toggleSplit = (id: string) => {
    setSplitIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const pickReceipt = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Photos needed', 'Allow photo access to attach receipts.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setReceiptUri(result.assets[0].uri);
    }
  };

  const handleSave = () => {
    if (!canSave || !expense) return;
    
    // Build ExpenseSplit array preserving isPaid status
    const splits: import('@/store/trips').ExpenseSplit[] = [];
    
    if (splitMode === 'equal') {
      const share = parsed / splitIds.length;
      splitIds.forEach((id) => {
        const oldSplit = expense.splits.find(s => s.memberId === id);
        splits.push({
          memberId: id,
          amount: share,
          isPaid: oldSplit?.isPaid || id === paidById, // Preserve payment status
          paidAt: oldSplit?.paidAt,
        });
      });
    } else {
      Object.entries(customSplits).forEach(([id, amount]) => {
        if (amount > 0) {
          const oldSplit = expense.splits.find(s => s.memberId === id);
          splits.push({
            memberId: id,
            amount,
            isPaid: oldSplit?.isPaid || id === paidById,
            paidAt: oldSplit?.paidAt,
          });
        }
      });
    }
    
    onUpdate(expense.id, {
      title: title.trim(),
      amount: parsed,
      paidById,
      splits,
      recurring,
      tag: tag.trim() || undefined,
      receiptUri,
    });
    onClose();
  };

  const handleDelete = () => {
    if (!expense) return;
    Alert.alert('Delete expense?', title, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          onDelete(expense.id);
          onClose();
        },
      },
    ]);
  };

  if (!expense) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[styles.screen, { backgroundColor: c.bgGrouped }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={12} style={styles.iconBtn}>
            <Ionicons name="close" size={22} color={c.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: c.text }]}>Edit expense</Text>
          <Pressable onPress={handleDelete} hitSlop={12} style={styles.iconBtn}>
            <Ionicons name="trash-outline" size={20} color={c.danger} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>What for?</Text>
          <SoftCard tone="white" style={styles.inputCard}>
            <TextInput
              ref={titleRef}
              value={title}
              onChangeText={setTitle}
              placeholder="Dinner, cab, wifi…"
              placeholderTextColor={c.textTertiary}
              style={[styles.input, { color: c.text }]}
              selectionColor={c.accent}
              returnKeyType="next"
            />
          </SoftCard>

          <Text style={[styles.sectionLabel, { color: c.textSecondary, marginTop: space.xl }]}>
            Amount
          </Text>
          <SoftCard tone="white" style={styles.amountCard}>
            <Text style={[styles.rupee, { color: c.text }]}>{currencySymbol}</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              placeholderTextColor={c.textTertiary}
              style={[styles.amountInput, { color: c.text }]}
              keyboardType="decimal-pad"
              selectionColor={c.accent}
            />
          </SoftCard>

          <Text style={[styles.sectionLabel, { color: c.textSecondary, marginTop: space.xl }]}>
            Tag (optional)
          </Text>
          <SoftCard tone="white" style={styles.inputCard}>
            <TextInput
              value={tag}
              onChangeText={setTag}
              placeholder="Type your own or pick below"
              placeholderTextColor={c.textTertiary}
              style={[styles.tagInput, { color: c.text }]}
              selectionColor={c.accent}
              autoCorrect={false}
            />
          </SoftCard>
          <View style={[styles.chips, { marginTop: space.sm }]}>
            {TAG_IDEAS.map((t) => (
              <Pressable
                key={t}
                onPress={() => setTag(t)}
                style={[
                  styles.chip,
                  { backgroundColor: tag === t ? c.accent : c.fillSecondary },
                ]}
              >
                <Text style={[styles.chipText, { color: tag === t ? c.accentInk : c.text }]}>
                  {t}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            onPress={() => setRecurring((v) => !v)}
            style={[
              styles.recurRow,
              { backgroundColor: recurring ? c.accentSoft : c.card },
            ]}
          >
            <Ionicons
              name={recurring ? 'checkmark-circle' : 'ellipse-outline'}
              size={22}
              color={c.accentInk}
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.recurTitle, { color: c.text }]}>Mark as recurring</Text>
              <Text style={[styles.recurBody, { color: c.textSecondary }]}>
                Useful for rent, wifi, subscriptions
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={pickReceipt}
            style={[styles.recurRow, { backgroundColor: c.card }]}
          >
            <Ionicons name="image-outline" size={22} color={c.accentInk} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.recurTitle, { color: c.text }]}>
                {receiptUri ? 'Receipt attached' : 'Attach receipt'}
              </Text>
              <Text style={[styles.recurBody, { color: c.textSecondary }]}>
                Optional photo from your library
              </Text>
            </View>
            {receiptUri ? (
              <Image source={{ uri: receiptUri }} style={styles.thumb} />
            ) : (
              <Ionicons name="add" size={20} color={c.textTertiary} />
            )}
          </Pressable>
          
          {receiptUri && (
            <Pressable onPress={() => setReceiptUri(undefined)} style={{ marginTop: space.sm }}>
              <Text style={{ color: c.danger, ...type.caption1, fontWeight: '700' }}>
                Remove receipt
              </Text>
            </Pressable>
          )}

          {members.length > 0 ? (
            <>
              <Text style={[styles.sectionLabel, { color: c.textSecondary, marginTop: space.xl }]}>
                Who paid?
              </Text>
              <View style={styles.chips}>
                {members.map((m) => (
                  <Pressable
                    key={m.id}
                    onPress={() => setPaidById(m.id)}
                    style={[
                      styles.chip,
                      { backgroundColor: paidById === m.id ? c.accent : c.fillSecondary },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: paidById === m.id ? c.accentInk : c.text },
                      ]}
                    >
                      {m.name}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.sectionLabel, { color: c.textSecondary, marginTop: space.xl }]}>
                Split amount
              </Text>
              
              <View style={styles.splitModeRow}>
                <Pressable
                  onPress={() => setSplitMode('equal')}
                  style={[
                    styles.splitModeBtn,
                    { backgroundColor: splitMode === 'equal' ? c.accent : c.fillSecondary },
                  ]}
                >
                  <Text style={[styles.splitModeText, { color: splitMode === 'equal' ? c.accentInk : c.text }]}>
                    Equal split
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setSplitMode('custom');
                    const each = parsed / members.length || 0;
                    const init: Record<string, number> = {};
                    members.forEach(m => init[m.id] = each);
                    setCustomSplits(init);
                  }}
                  style={[
                    styles.splitModeBtn,
                    { backgroundColor: splitMode === 'custom' ? c.accent : c.fillSecondary },
                  ]}
                >
                  <Text style={[styles.splitModeText, { color: splitMode === 'custom' ? c.accentInk : c.text }]}>
                    Custom split
                  </Text>
                </Pressable>
              </View>
              
              {splitMode === 'equal' ? (
                <View style={styles.chips}>
                  {members.map((m) => {
                    const on = splitIds.includes(m.id);
                    return (
                      <Pressable
                        key={m.id}
                        onPress={() => toggleSplit(m.id)}
                        style={[
                          styles.chip,
                          { backgroundColor: on ? c.accent : c.fillSecondary },
                        ]}
                      >
                        <Text style={[styles.chipText, { color: on ? c.accentInk : c.text }]}>
                          {m.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : (
                <>
                  {members.map((m) => (
                    <SoftCard key={m.id} tone="white" style={styles.customSplitRow}>
                      <Text style={[styles.customSplitName, { color: c.text }]}>{m.name}</Text>
                      <View style={styles.customSplitInput}>
                        <Text style={[styles.rupee, { color: c.text, fontSize: 18 }]}>{currencySymbol}</Text>
                        <TextInput
                          value={String(customSplits[m.id] || '')}
                          onChangeText={(val) => setCustomSplits(prev => ({ ...prev, [m.id]: Number(val) || 0 }))}
                          placeholder="0"
                          placeholderTextColor={c.textTertiary}
                          style={[styles.customAmountInput, { color: c.text }]}
                          keyboardType="decimal-pad"
                          selectionColor={c.accent}
                        />
                      </View>
                    </SoftCard>
                  ))}
                  <SoftCard tone={Math.abs(customTotal - parsed) < 0.01 ? 'accent' : 'fill'} style={{ marginTop: space.sm }}>
                    <View style={styles.customTotalRow}>
                      <Text style={[styles.customTotalLabel, { color: Math.abs(customTotal - parsed) < 0.01 ? c.accentInk : c.text }]}>
                        Total assigned
                      </Text>
                      <Text style={[styles.customTotalValue, { color: Math.abs(customTotal - parsed) < 0.01 ? c.accentInk : c.text }]}>
                        {currencySymbol}{customTotal.toFixed(2)} / {currencySymbol}{parsed.toFixed(2)}
                      </Text>
                    </View>
                    {Math.abs(customTotal - parsed) >= 0.01 && (
                      <Text style={[styles.customTotalHint, { color: c.textSecondary }]}>
                        {customTotal < parsed ? '⚠️ Amounts don\'t add up' : '⚠️ Total exceeds expense'}
                      </Text>
                    )}
                  </SoftCard>
                </>
              )}
            </>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton
            label="Save changes"
            variant="accent"
            disabled={!canSave}
            onPress={handleSave}
          />
        </View>
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
  body: { paddingHorizontal: space.xl, paddingBottom: space.lg },
  sectionLabel: {
    ...type.footnote,
    marginBottom: space.sm,
    marginLeft: 4,
  },
  inputCard: { paddingVertical: 4, paddingHorizontal: space.lg },
  input: { ...type.title2, paddingVertical: space.lg },
  tagInput: { ...type.callout, paddingVertical: space.lg },
  amountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.lg,
  },
  rupee: { ...type.title1, marginRight: 4 },
  amountInput: {
    ...type.title1,
    flex: 1,
    paddingVertical: space.lg,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.pill,
  },
  chipText: { ...type.footnote, fontWeight: '700' },
  recurRow: {
    marginTop: space.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderRadius: radius.lg,
    padding: space.lg,
  },
  recurTitle: { ...type.subheadline },
  recurBody: { ...type.caption1, marginTop: 2 },
  thumb: { width: 40, height: 40, borderRadius: 10 },
  splitModeRow: {
    flexDirection: 'row',
    gap: space.sm,
    marginBottom: space.md,
  },
  splitModeBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: space.md,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  splitModeText: { ...type.footnote, fontWeight: '700' },
  customSplitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.sm,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
  },
  customSplitName: { ...type.subheadline, flex: 1 },
  customSplitInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  customAmountInput: {
    ...type.title3,
    width: 100,
    textAlign: 'right',
  },
  customTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customTotalLabel: { ...type.subheadline },
  customTotalValue: { ...type.headline },
  customTotalHint: { ...type.caption1, marginTop: space.xs },
  footer: {
    paddingHorizontal: space.xl,
    paddingBottom: space.xxxl,
    paddingTop: space.md,
  },
});
