/**
 * Settings screen - User preferences including profile, notifications, theme, and about.
 * Allows users to configure nickname, daily reminder notifications and other app settings.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Switch, Pressable, Platform, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Application from 'expo-application';
import { X, Check, Pencil } from 'lucide-react-native';
import { BrutalistText } from '../src/components/BrutalistText';
import { useTheme } from '../src/context/ThemeContext';
import { notificationService, NotificationPreferences } from '../src/services/notificationService';
import { loadData, STORAGE_KEYS } from '../src/utils/storage';
import { getOrCreateUserIdentity, updateUserProfile, UserIdentity } from '../src/utils/identity';

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i);

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, isDark, mode: colorMode, setMode: setColorMode } = useTheme();
  const [userId, setUserId] = useState<string | null>(null);
  const [userIdentity, setUserIdentity] = useState<UserIdentity | null>(null);
  const [nickname, setNickname] = useState('');
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [isSavingNickname, setIsSavingNickname] = useState(false);
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    dailyReminderEnabled: true,
    reminderHour: 9,
    reminderMinute: 0,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  const [hasNotificationPermission, setHasNotificationPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load user ID, identity, and preferences on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Load user identity (includes nickname)
        const identity = await getOrCreateUserIdentity();
        setUserIdentity(identity);
        setNickname(identity.nickname);
        setUserId(identity.id);

        // Initialize notifications and get preferences
        const token = await notificationService.initialize(identity.id);
        setHasNotificationPermission(!!token);

        const prefs = await notificationService.getPreferences(identity.id);
        setNotificationPrefs(prefs);
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  const handleToggleReminder = useCallback(async (enabled: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (!userId) return;

    // If enabling, ensure we have permission
    if (enabled && !hasNotificationPermission) {
      const token = await notificationService.initialize(userId);
      if (!token) {
        // Permission denied, don't enable
        return;
      }
      setHasNotificationPermission(true);
    }

    setNotificationPrefs((prev) => ({ ...prev, dailyReminderEnabled: enabled }));
    await notificationService.updatePreferences(userId, { dailyReminderEnabled: enabled });
  }, [userId, hasNotificationPermission]);

  const handleChangeHour = useCallback(async (hour: number) => {
    Haptics.selectionAsync();

    if (!userId) return;

    setNotificationPrefs((prev) => ({ ...prev, reminderHour: hour }));
    await notificationService.updatePreferences(userId, { reminderHour: hour });
  }, [userId]);

  const handleThemeChange = useCallback((mode: 'light' | 'dark' | 'system') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setColorMode(mode);
  }, [setColorMode]);

  const handleEditNickname = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsEditingNickname(true);
  }, []);

  const handleCancelEditNickname = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNickname(userIdentity?.nickname || '');
    setIsEditingNickname(false);
  }, [userIdentity]);

  const handleSaveNickname = useCallback(async () => {
    if (!userIdentity || !nickname.trim()) return;

    const trimmedNickname = nickname.trim();
    if (trimmedNickname === userIdentity.nickname) {
      setIsEditingNickname(false);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSavingNickname(true);

    try {
      const updatedIdentity = await updateUserProfile(userIdentity, {
        nickname: trimmedNickname,
      });
      setUserIdentity(updatedIdentity);
      setNickname(updatedIdentity.nickname);
      setIsEditingNickname(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error saving nickname:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      // Reset to original nickname on error
      setNickname(userIdentity.nickname);
    } finally {
      setIsSavingNickname(false);
    }
  }, [userIdentity, nickname]);

  const formatHour = (hour: number): string => {
    if (hour === 0) return '12:00 AM';
    if (hour === 12) return '12:00 PM';
    if (hour < 12) return `${hour}:00 AM`;
    return `${hour - 12}:00 PM`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerSpacer} />
            <View style={styles.headerCenter}>
              <BrutalistText size={11} mono uppercase muted>
                Preferences
              </BrutalistText>
              <BrutalistText size={36} bold uppercase letterSpacing={2}>
                SETTINGS
              </BrutalistText>
            </View>
            <Pressable
              style={[styles.closeButton, { borderColor: colors.primary }]}
              onPress={handleClose}
            >
              <X size={20} color={colors.text} strokeWidth={2.5} />
            </Pressable>
          </View>
          <View style={[styles.headerLine, { backgroundColor: colors.primary }]} />
        </Animated.View>

        {/* Profile Section */}
        <Animated.View entering={FadeInUp.delay(150).springify()}>
          <BrutalistText size={12} mono uppercase muted style={styles.sectionTitle}>
            Profile
          </BrutalistText>

          <View style={[styles.section, { borderColor: colors.primary }]}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <BrutalistText size={12} mono muted>
                  Nickname
                </BrutalistText>
                {isEditingNickname ? (
                  <View style={styles.nicknameInputContainer}>
                    <TextInput
                      style={[
                        styles.nicknameInput,
                        {
                          color: colors.text,
                          borderColor: colors.primary,
                          backgroundColor: colors.surface,
                        },
                      ]}
                      value={nickname}
                      onChangeText={setNickname}
                      maxLength={30}
                      autoFocus
                      selectTextOnFocus
                      placeholder="Enter nickname"
                      placeholderTextColor={colors.muted}
                      editable={!isSavingNickname}
                      onSubmitEditing={handleSaveNickname}
                      returnKeyType="done"
                    />
                  </View>
                ) : (
                  <BrutalistText size={18} bold>
                    {nickname || 'Not set'}
                  </BrutalistText>
                )}
              </View>
              {isEditingNickname ? (
                <View style={styles.nicknameActions}>
                  {isSavingNickname ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <>
                      <Pressable
                        style={[styles.nicknameActionButton, { borderColor: colors.muted }]}
                        onPress={handleCancelEditNickname}
                      >
                        <X size={18} color={colors.muted} strokeWidth={2.5} />
                      </Pressable>
                      <Pressable
                        style={[
                          styles.nicknameActionButton,
                          { borderColor: colors.primary, backgroundColor: colors.primary },
                        ]}
                        onPress={handleSaveNickname}
                      >
                        <Check size={18} color={colors.background} strokeWidth={2.5} />
                      </Pressable>
                    </>
                  )}
                </View>
              ) : (
                <Pressable
                  style={[styles.editButton, { borderColor: colors.primary }]}
                  onPress={handleEditNickname}
                >
                  <Pencil size={16} color={colors.text} strokeWidth={2.5} />
                </Pressable>
              )}
            </View>
          </View>
        </Animated.View>

        {/* Notifications Section */}
        <Animated.View entering={FadeInUp.delay(200).springify()}>
          <BrutalistText size={12} mono uppercase muted style={styles.sectionTitle}>
            Notifications
          </BrutalistText>

          <View style={[styles.section, { borderColor: colors.primary }]}>
            {/* Daily Reminder Toggle */}
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <BrutalistText size={16} bold>
                  Daily Reminder
                </BrutalistText>
                <BrutalistText size={12} mono muted>
                  Get reminded to play today's puzzle
                </BrutalistText>
              </View>
              <Switch
                value={notificationPrefs.dailyReminderEnabled}
                onValueChange={handleToggleReminder}
                trackColor={{ false: colors.muted, true: colors.primary }}
                thumbColor={colors.background}
                ios_backgroundColor={colors.muted}
              />
            </View>

            {/* Reminder Time */}
            {notificationPrefs.dailyReminderEnabled && (
              <View style={[styles.timeSection, { borderTopColor: colors.highlight }]}>
                <BrutalistText size={14} bold style={styles.timeLabel}>
                  Reminder Time
                </BrutalistText>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.timeScroll}
                  contentContainerStyle={styles.timeScrollContent}
                >
                  {HOUR_OPTIONS.map((hour) => (
                    <Pressable
                      key={hour}
                      onPress={() => handleChangeHour(hour)}
                      style={[
                        styles.timeOption,
                        {
                          borderColor: notificationPrefs.reminderHour === hour ? colors.primary : colors.muted,
                          backgroundColor: notificationPrefs.reminderHour === hour ? colors.primary : 'transparent',
                        },
                      ]}
                    >
                      <BrutalistText
                        size={12}
                        mono
                        bold={notificationPrefs.reminderHour === hour}
                        color={notificationPrefs.reminderHour === hour ? colors.background : colors.text}
                      >
                        {formatHour(hour)}
                      </BrutalistText>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}

            {!hasNotificationPermission && (
              <View style={[styles.permissionWarning, { backgroundColor: colors.highlight }]}>
                <BrutalistText size={12} mono>
                  Enable notifications in {Platform.OS === 'ios' ? 'Settings' : 'system settings'} to receive reminders
                </BrutalistText>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Appearance Section */}
        <Animated.View entering={FadeInUp.delay(250).springify()}>
          <BrutalistText size={12} mono uppercase muted style={styles.sectionTitle}>
            Appearance
          </BrutalistText>

          <View style={[styles.section, { borderColor: colors.primary }]}>
            <View style={styles.themeOptions}>
              {(['light', 'dark', 'system'] as const).map((mode) => (
                <Pressable
                  key={mode}
                  onPress={() => handleThemeChange(mode)}
                  style={[
                    styles.themeOption,
                    {
                      borderColor: colorMode === mode ? colors.primary : colors.muted,
                      backgroundColor: colorMode === mode ? colors.primary : 'transparent',
                    },
                  ]}
                >
                  <BrutalistText
                    size={14}
                    bold
                    uppercase
                    color={colorMode === mode ? colors.background : colors.text}
                  >
                    {mode}
                  </BrutalistText>
                </Pressable>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* Info Section */}
        <Animated.View entering={FadeInUp.delay(300).springify()}>
          <BrutalistText size={12} mono uppercase muted style={styles.sectionTitle}>
            About
          </BrutalistText>

          <View style={[styles.section, { borderColor: colors.muted }]}>
            <View style={styles.infoRow}>
              <BrutalistText size={14} muted>
                Version
              </BrutalistText>
              <BrutalistText size={14} mono bold>
                {Application.nativeApplicationVersion || '1.0.0'}
              </BrutalistText>
            </View>
            <View style={[styles.infoRow, { borderTopWidth: 1, borderTopColor: colors.highlight }]}>
              <BrutalistText size={14} muted>
                Timezone
              </BrutalistText>
              <BrutalistText size={12} mono>
                {notificationPrefs.timezone}
              </BrutalistText>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  headerSpacer: {
    width: 40,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLine: {
    width: 60,
    height: 3,
    marginTop: 12,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  section: {
    borderWidth: 3,
    marginBottom: 24,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  timeSection: {
    borderTopWidth: 1,
    padding: 16,
  },
  timeLabel: {
    marginBottom: 12,
  },
  timeScroll: {
    marginHorizontal: -16,
  },
  timeScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  timeOption: {
    borderWidth: 2,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  permissionWarning: {
    padding: 12,
    margin: 16,
    marginTop: 0,
  },
  themeOptions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  themeOption: {
    flex: 1,
    borderWidth: 2,
    paddingVertical: 12,
    alignItems: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  nicknameInputContainer: {
    marginTop: 4,
  },
  nicknameInput: {
    borderWidth: 2,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  nicknameActions: {
    flexDirection: 'row',
    gap: 8,
  },
  nicknameActionButton: {
    width: 36,
    height: 36,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    width: 36,
    height: 36,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
