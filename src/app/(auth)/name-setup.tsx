import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '@/lib/supabase';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useColors } from '@/store/theme';
import { useAuthStore } from '@/store/auth';

export default function ProfileCreationScreen() {
  const { colors } = { colors: useColors() };
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const user = useAuthStore((s) => s.user);

  const handleCreateProfile = async () => {
    if (!name.trim()) {
      Alert.alert('Name Required', 'Please enter your name');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'No user session found. Please try logging in again.');
      router.replace('/(auth)/phone');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('users')
        .insert({
          id: user.id,
          phone_number: user.phone,
          name: name.trim(),
        });

      if (error) throw error;

      // Profile created - now collect payment methods
      router.replace('/(auth)/payment-setup');
    } catch (error: any) {
      console.error('Profile creation error:', error);
      
      if (error.code === '23505') {
        // Duplicate key error - profile already exists, go to payment setup
        router.replace('/(auth)/payment-setup');
      } else {
        Alert.alert(
          'Error',
          error.message || 'Failed to create profile. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="auto" />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.emoji]}>👋</Text>
          <Text style={[styles.title, { color: colors.text }]}>
            What's your name?
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            This is how others will see you in groups
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={[styles.label, { color: colors.text }]}>
            Full Name
          </Text>

          <TextInput
            style={[styles.input, { 
              backgroundColor: colors.card,
              color: colors.text,
              borderColor: colors.separator 
            }]}
            placeholder="Enter your name"
            placeholderTextColor={colors.textSecondary}
            value={name}
            onChangeText={setName}
            autoFocus
            autoCapitalize="words"
            maxLength={50}
          />

          <PrimaryButton
            label={loading ? 'Creating Profile...' : 'Continue'}
            onPress={handleCreateProfile}
            disabled={loading || name.trim().length === 0}
            style={styles.button}
          />
        </View>

        <View style={styles.footer}>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            You can change this later in settings
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 120,
  },
  emoji: {
    fontSize: 72,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  form: {
    flex: 1,
    justifyContent: 'center',
    marginTop: -100,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  input: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 18,
  },
  button: {
    marginTop: 32,
  },
  footer: {
    paddingBottom: 32,
    alignItems: 'center',
  },
  hint: {
    fontSize: 14,
  },
});
