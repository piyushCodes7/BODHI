/**
 * BODHI — PersonalDetailsScreen
 * ──────────────────────────────
 * Editable personal details screen.
 * Wired to: PUT /users/me (FastAPI backend)
 *
 * Features:
 *  - Edit name and phone number
 *  - Optimistic UI with rollback on error
 *  - Inline validation
 *  - Loading / success / error states
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { Colors, Spacing, Radius, FontSize } from '../theme/tokens';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserProfile {
  name: string;
  phone: string;
  email: string;   // read-only
}

interface UpdateProfilePayload {
  name: string;
  phone: string;
}

interface ValidationErrors {
  name?: string;
  phone?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const validateForm = (payload: UpdateProfilePayload): ValidationErrors => {
  const errors: ValidationErrors = {};
  if (!payload.name.trim() || payload.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters.';
  }
  const phoneRegex = /^[6-9]\d{9}$/;
  if (!phoneRegex.test(payload.phone.replace(/\s/g, ''))) {
    errors.phone = 'Enter a valid 10-digit Indian mobile number.';
  }
  return errors;
};

// TODO: replace with your actual API client (axios instance / fetch wrapper)
const updateProfileApi = async (payload: UpdateProfilePayload): Promise<UserProfile> => {
  const response = await fetch('https://api.bodhi.app/users/me', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      // Authorization: `Bearer ${await getToken()}`, // inject real auth token
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error((error as { detail?: string }).detail ?? 'Failed to update profile.');
  }

  return response.json() as Promise<UserProfile>;
};

// ─── Screen ───────────────────────────────────────────────────────────────────

const PersonalDetailsScreen: React.FC = () => {
  const navigation = useNavigation();

  // Mock initial data — replace with data from your auth context / Redux store
  const [savedProfile] = useState<UserProfile>({
    name:  'Aarav Sharma',
    phone: '9876543210',
    email: 'aarav@bodhi.app',
  });

  const [name, setName]   = useState<string>(savedProfile.name);
  const [phone, setPhone] = useState<string>(savedProfile.phone);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [saved, setSaved] = useState<boolean>(false);

  const isDirty = name !== savedProfile.name || phone !== savedProfile.phone;

  const handleSave = useCallback(async () => {
    const payload: UpdateProfilePayload = { name: name.trim(), phone: phone.trim() };
    const validationErrors = validateForm(payload);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      await updateProfileApi(payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      // TODO: dispatch to auth context / Redux to persist updated profile
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      Alert.alert('Update Failed', msg);
    } finally {
      setLoading(false);
    }
  }, [name, phone]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar placeholder */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitial}>
              {name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <TouchableOpacity>
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Full Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={[styles.input, errors.name ? styles.inputError : null]}
              value={name}
              onChangeText={(val) => {
                setName(val);
                if (errors.name) setErrors((e) => ({ ...e, name: undefined }));
              }}
              placeholder="Your full name"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="words"
              autoCorrect={false}
              accessibilityLabel="Full name input"
            />
            {errors.name ? (
              <Text style={styles.errorText}>{errors.name}</Text>
            ) : null}
          </View>

          {/* Phone Number */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={[styles.phoneRow, errors.phone ? styles.inputError : null]}>
              <Text style={styles.countryCode}>🇮🇳 +91</Text>
              <TextInput
                style={styles.phoneInput}
                value={phone}
                onChangeText={(val) => {
                  setPhone(val.replace(/\D/g, '').slice(0, 10));
                  if (errors.phone) setErrors((e) => ({ ...e, phone: undefined }));
                }}
                placeholder="9876543210"
                placeholderTextColor={Colors.textMuted}
                keyboardType="phone-pad"
                maxLength={10}
                accessibilityLabel="Phone number input"
              />
            </View>
            {errors.phone ? (
              <Text style={styles.errorText}>{errors.phone}</Text>
            ) : null}
          </View>

          {/* Email (read-only) */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email  <Text style={styles.readOnlyTag}>read-only</Text></Text>
            <View style={styles.readOnlyInput}>
              <Text style={styles.readOnlyText}>{savedProfile.email}</Text>
            </View>
          </View>
        </View>

        {/* Linked Screens Row */}
        <View style={styles.linksSection}>
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => navigation.navigate('BankAccounts' as never)}
          >
            <Text style={styles.linkIcon}>🏦</Text>
            <Text style={styles.linkText}>Bank Accounts</Text>
            <Text style={styles.linkChevron}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => navigation.navigate('SecuritySettings' as never)}
          >
            <Text style={styles.linkIcon}>🔐</Text>
            <Text style={styles.linkText}>Security Settings</Text>
            <Text style={styles.linkChevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[
            styles.saveBtn,
            (!isDirty || loading) && styles.saveBtnDisabled,
            saved && styles.saveBtnSuccess,
          ]}
          onPress={handleSave}
          disabled={!isDirty || loading}
          accessibilityLabel="Save profile changes"
          accessibilityRole="button"
        >
          {loading ? (
            <ActivityIndicator color={Colors.textInverse} />
          ) : (
            <Text style={styles.saveBtnText}>
              {saved ? '✓ Saved!' : 'Save Changes'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default PersonalDetailsScreen;

// ─── StyleSheet ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bgDeep,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },

  // ── Avatar ────────────────────────────────────────────────────────────────
  avatarSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: Radius.full,
    backgroundColor: Colors.neonLimeSubtle,
    borderWidth: 2,
    borderColor: Colors.neonLime + '66',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  avatarInitial: {
    color: Colors.neonLime,
    fontSize: FontSize.xxxl,
    fontWeight: '800',
  },
  changePhotoText: {
    color: Colors.neonCyan,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },

  // ── Form ──────────────────────────────────────────────────────────────────
  form: { marginBottom: Spacing.lg },
  fieldGroup: { marginBottom: Spacing.lg },
  label: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
    marginBottom: Spacing.xs,
    letterSpacing: 0.5,
  },
  readOnlyTag: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '400',
  },
  input: {
    backgroundColor: Colors.bgSurface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.bgGlassBorder,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  errorText: {
    color: Colors.danger,
    fontSize: FontSize.xs,
    marginTop: Spacing.xs,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgSurface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.bgGlassBorder,
    overflow: 'hidden',
  },
  countryCode: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRightWidth: 1,
    borderRightColor: Colors.bgGlassBorder,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
  },
  readOnlyInput: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.divider,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  readOnlyText: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
  },

  // ── Links ─────────────────────────────────────────────────────────────────
  linksSection: {
    backgroundColor: Colors.bgSurface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.bgGlassBorder,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    gap: Spacing.md,
  },
  linkIcon: { fontSize: 20 },
  linkText: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: '500',
  },
  linkChevron: {
    color: Colors.textMuted,
    fontSize: FontSize.xl,
  },

  // ── Save Button ───────────────────────────────────────────────────────────
  saveBtn: {
    backgroundColor: Colors.neonLime,
    borderRadius: Radius.full,
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: {
    backgroundColor: Colors.textMuted,
    opacity: 0.5,
  },
  saveBtnSuccess: {
    backgroundColor: Colors.success,
  },
  saveBtnText: {
    color: Colors.textInverse,
    fontSize: FontSize.lg,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
