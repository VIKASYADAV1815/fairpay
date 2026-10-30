import { Modal, View, Text, StyleSheet, Pressable, Share, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { SoftCard } from '@/components/SoftCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useColors } from '@/store/theme';
import { inviteDeepLink, inviteShareMessage } from '@/lib/invite';
import { space, type } from '@/theme/tokens';

type Props = {
  visible: boolean;
  groupName: string;
  inviteCode: string;
  onClose: () => void;
};

/**
 * Invite connect flow (local today):
 * 1. Host creates group → gets inviteCode + fairpay://join/CODE
 * 2. Host shares code / QR (this sheet) or link
 * 3. Guest: New → Enter code | Scan QR  OR  Join screen
 * 4. parseInvitePayload → joinByInviteCode
 */
export function ShareGroupSheet({ visible, groupName, inviteCode, onClose }: Props) {
  const c = useColors();
  const link = inviteDeepLink(inviteCode);

  const copyCode = async () => {
    try {
      await Clipboard.setStringAsync(inviteCode);
      Alert.alert('Copied', `Invite code ${inviteCode}`);
    } catch {
      Alert.alert('Copy failed', inviteCode);
    }
  };

  const copyLink = async () => {
    try {
      await Clipboard.setStringAsync(link);
      Alert.alert('Copied', 'Invite link ready to paste');
    } catch {
      Alert.alert('Copy failed', link);
    }
  };

  const shareInvite = async () => {
    try {
      await Share.share({
        message: inviteShareMessage(groupName, inviteCode),
      });
    } catch {
      // cancelled
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.screen, { backgroundColor: c.bgGrouped }]}>
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={12} style={styles.iconBtn}>
            <Ionicons name="close" size={22} color={c.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: c.text }]}>Invite people</Text>
          <View style={styles.iconBtn} />
        </View>

        <View style={styles.body}>
          <Text style={[styles.label, { color: c.textSecondary }]}>{groupName}</Text>

          <SoftCard tone="white" style={styles.qrCard}>
            <View style={[styles.qrWrap, { backgroundColor: '#FFFFFF' }]}>
              <QRCode
                value={link}
                size={180}
                backgroundColor="#FFFFFF"
                color="#0A0A0A"
                ecl="M"
              />
            </View>
            <Text style={[styles.code, { color: c.text }]}>{inviteCode}</Text>
            <Text style={[styles.codeHint, { color: c.textSecondary }]}>
              Friend scans this QR · or types the code
            </Text>
          </SoftCard>

          <Pressable onPress={copyLink}>
            <SoftCard style={styles.linkCard}>
              <Ionicons name="link-outline" size={18} color={c.accent} />
              <Text style={[styles.linkText, { color: c.text }]} numberOfLines={1}>
                {link}
              </Text>
              <Ionicons name="copy-outline" size={16} color={c.textTertiary} />
            </SoftCard>
          </Pressable>

          <View style={styles.actions}>
            <PrimaryButton
              label="Share invite"
              variant="accent"
              onPress={shareInvite}
              style={styles.half}
            />
            <PrimaryButton label="Copy code" onPress={copyCode} style={styles.half} />
          </View>

          <Text style={[styles.note, { color: c.textTertiary }]}>
            Groups need 2+ people. Share this so friends can join under New → Join or Scan.
          </Text>
        </View>
      </View>
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
  body: { flex: 1, paddingHorizontal: space.xl, paddingTop: space.lg },
  label: { ...type.footnote, marginBottom: space.sm, marginLeft: 4 },
  qrCard: { alignItems: 'center', marginBottom: space.lg },
  qrWrap: {
    padding: 14,
    borderRadius: 16,
    marginBottom: space.lg,
  },
  code: {
    ...type.largeTitle,
    letterSpacing: 6,
  },
  codeHint: { ...type.caption1, marginTop: space.sm, textAlign: 'center' },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginBottom: space.xl,
  },
  linkText: { ...type.footnote, flex: 1, fontWeight: '600' },
  actions: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: space.sm,
  },
  half: { flex: 1 },
  note: { ...type.caption1, textAlign: 'center', marginTop: space.xl, lineHeight: 18 },
});
