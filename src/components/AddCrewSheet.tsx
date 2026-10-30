import { useState } from 'react';
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
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { SoftCard } from '@/components/SoftCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import type { Member } from '@/store/trips';
import { memberPayMethod } from '@/store/trips';
import { useColors } from '@/store/theme';
import { PAY_RAILS, formatPayLabel, type PayRail } from '@/lib/payments';
import { radius, space, type } from '@/theme/tokens';
import { timing } from '@/theme/motion';

type Props = {
  visible: boolean;
  members: Member[];
  onClose: () => void;
  onAdd: (name: string, pay?: { rail: PayRail; handle: string }) => void;
  doneLabel?: string;
  /** Split groups need 2+ — default 2 */
  minMembers?: number;
  /** Open invite / QR when user is short of people */
  onInvite?: () => void;
};

export function AddCrewSheet({
  visible,
  members,
  onClose,
  onAdd,
  doneLabel = 'Done',
  minMembers = 2,
  onInvite,
}: Props) {
  const c = useColors();
  const [name, setName] = useState('');
  const [rail, setRail] = useState<PayRail>('upi');
  const [handle, setHandle] = useState('');

  const canAdd = name.trim().length > 0;
  const nextCount = members.length + (canAdd ? 1 : 0);
  const ready = nextCount >= minMembers;

  const handleAdd = () => {
    if (!canAdd) return;
    onAdd(
      name.trim(),
      handle.trim() ? { rail, handle: handle.trim() } : undefined,
    );
    setName('');
    setHandle('');
  };

  const flushDraft = () => {
    if (!canAdd) return;
    onAdd(
      name.trim(),
      handle.trim() ? { rail, handle: handle.trim() } : undefined,
    );
    setName('');
    setHandle('');
  };

  const handleDone = () => {
    const count = members.length + (canAdd ? 1 : 0);
    if (count < minMembers) {
      Alert.alert(
        'Need 2+ people',
        'A Fairpay group needs at least two people to split. Add someone or share an invite.',
        [
          { text: 'Keep adding', style: 'cancel' },
          ...(onInvite
            ? [
                {
                  text: 'Share invite',
                  onPress: () => {
                    flushDraft();
                    onClose();
                    onInvite();
                  },
                },
              ]
            : []),
        ],
      );
      return;
    }
    flushDraft();
    onClose();
  };

  const railInfo = PAY_RAILS.find((r) => r.rail === rail);

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
          <Text style={[styles.headerTitle, { color: c.text }]}>Add crew</Text>
          <View style={styles.iconBtn} />
        </View>

        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>Name</Text>
          <SoftCard tone="white" style={styles.inputCard}>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Alex"
              placeholderTextColor={c.textTertiary}
              style={[styles.input, { color: c.text }]}
              autoFocus
            />
          </SoftCard>

          <Text style={[styles.sectionLabel, { color: c.textSecondary, marginTop: space.xl }]}>
            Pay method (optional)
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {PAY_RAILS.map((r) => {
              const on = rail === r.rail;
              return (
                <Pressable
                  key={r.rail}
                  onPress={() => setRail(r.rail)}
                  style={[
                    styles.chip,
                    { backgroundColor: on ? c.accent : c.fillSecondary },
                  ]}
                >
                  <Text style={{ color: on ? c.accentInk : c.text, fontWeight: '700', fontSize: 13 }}>
                    {r.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <SoftCard tone="white" style={styles.inputCard}>
            <TextInput
              value={handle}
              onChangeText={setHandle}
              placeholder={railInfo?.placeholder}
              placeholderTextColor={c.textTertiary}
              style={[styles.inputSmall, { color: c.text }]}
              autoCapitalize="none"
            />
          </SoftCard>
          <Text style={[styles.hint, { color: c.textTertiary }]}>{railInfo?.hint}</Text>

          <PrimaryButton
            label="Add member"
            variant="accent"
            disabled={!canAdd}
            onPress={handleAdd}
            style={{ marginTop: space.xxl }}
          />

          {members.length > 0 ? (
            <View style={styles.list}>
              <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>
                In this group · {members.length}
              </Text>
              {members.map((m, i) => (
                <MotiView
                  key={m.id}
                  from={{ opacity: 0, translateX: -8 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={timing(320, i * 40)}
                >
                  <SoftCard tone="white" style={styles.memberRow}>
                    <View style={[styles.avatar, { backgroundColor: c.accent }]}>
                      <Text style={[styles.avatarText, { color: c.accentInk }]}>
                        {m.name.slice(0, 1).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.memberName, { color: c.text }]}>{m.name}</Text>
                      <Text style={[styles.memberUpi, { color: c.textSecondary }]}>
                        {formatPayLabel(memberPayMethod(m))}
                      </Text>
                    </View>
                    <Ionicons name="checkmark-circle" size={22} color={c.accent} />
                  </SoftCard>
                </MotiView>
              ))}
            </View>
          ) : (
            <Text style={[styles.emptyHint, { color: c.textTertiary }]}>
              You’re first — add at least one more person (or invite) to split.
            </Text>
          )}

          {members.length > 0 && members.length < minMembers ? (
            <Text style={[styles.emptyHint, { color: c.textSecondary, marginTop: space.lg }]}>
              {minMembers - members.length} more needed · groups can’t be solo
            </Text>
          ) : null}
        </ScrollView>

        <View
          style={[
            styles.footer,
            { backgroundColor: c.bgGrouped, borderTopColor: c.separator },
          ]}
        >
          <PrimaryButton
            label={
              ready
                ? `${doneLabel} · ${nextCount} people`
                : `Add ${Math.max(minMembers - nextCount, 1)} more`
            }
            variant="accent"
            onPress={handleDone}
          />
          {onInvite ? (
            <Pressable
              onPress={() => {
                flushDraft();
                onClose();
                onInvite();
              }}
              style={styles.skip}
            >
              <Text style={[styles.skipText, { color: c.text }]}>Invite with QR / link</Text>
            </Pressable>
          ) : null}
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
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { ...type.headline },
  body: { paddingHorizontal: space.xl, paddingBottom: space.lg },
  sectionLabel: {
    ...type.footnote,
    marginBottom: space.sm,
    marginLeft: 4,
  },
  inputCard: { paddingVertical: 4, paddingHorizontal: space.lg },
  input: { ...type.title1, paddingVertical: space.lg },
  inputSmall: { ...type.title3, paddingVertical: space.lg },
  chipRow: { gap: space.sm, paddingBottom: space.sm },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  hint: { ...type.caption1, marginLeft: 4, marginTop: 4 },
  list: { marginTop: space.xxxl, gap: space.sm },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginBottom: space.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...type.subheadline },
  memberName: { ...type.subheadline },
  memberUpi: { ...type.caption1, marginTop: 2 },
  emptyHint: {
    ...type.caption1,
    textAlign: 'center',
    marginTop: space.xxxl,
  },
  footer: {
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    paddingBottom: space.xxxl,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  skip: { alignItems: 'center', paddingTop: space.md },
  skipText: { ...type.footnote, fontWeight: '600' },
});
