import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Text, TextInput } from '../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Avatar from '../components/Avatar';
import DotsMenu from '../components/DotsMenu';
import Confirm from '../components/Confirm';
import { handleOf } from '../components/ThreadPost';
import { useAuth } from '../context/AuthContext';
import { EventsApi, CATEGORIES } from '../api/events';
import { colors, layout } from '../theme';

/**
 * Threads-style composer. One big text box: the first line becomes the title,
 * the rest the description. Category, skills and team size sit under the
 * text as light inline rows — no form labels.
 */
export default function ComposeScreen({ navigation }) {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [category, setCategory] = useState('hackathon');
  const [skills, setSkills] = useState('');
  const [teamSize, setTeamSize] = useState(2);
  const [showTeam, setShowTeam] = useState(false);
  const [showSkills, setShowSkills] = useState(false);
  const skillsRef = useRef(null);
  const [posting, setPosting] = useState(false);
  const [inputH, setInputH] = useState(60);
  const [askDiscard, setAskDiscard] = useState(false);
  const input = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => input.current?.focus(), 350);
    return () => clearTimeout(t);
  }, []);

  const canPost = text.trim().length > 0 && !posting;

  async function post() {
    if (!canPost) return;
    const [first, ...rest] = text.trim().split('\n');
    const title = first.trim().slice(0, 120);
    const description = rest.join('\n').trim() || title;
    setPosting(true);
    try {
      await EventsApi.create({ title, description, category, skillsNeeded: skills, teamSize });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      navigation.goBack();
    } catch (e) {
      Alert.alert('Could not post', e.message);
    } finally {
      setPosting(false);
    }
  }

  function cancel() {
    if (!text.trim() && !skills.trim()) return navigation.goBack();
    setAskDiscard(true);
  }

  const bump = (d) => {
    Haptics.selectionAsync().catch(() => {});
    setTeamSize((n) => Math.min(10, Math.max(1, n + d)));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Top bar */}
      <View style={styles.bar}>
        <TouchableOpacity onPress={cancel} hitSlop={10} style={styles.barSide}>
          <Text style={styles.cancel}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.barTitle}>New post</Text>
        <View style={styles.barSide} />
      </View>
      <View style={styles.hairline} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.row}>
            <View style={styles.gutter}>
              <Avatar name={user?.name} size={40} />
              <View style={styles.thread} />
            </View>

            <View style={styles.content}>
              <Text style={styles.handle}>{handleOf(user?.name)}</Text>
              <TextInput
                ref={input}
                style={[styles.input, { height: Math.max(60, inputH) }]}
                onContentSizeChange={(e) => setInputH(e.nativeEvent.contentSize.height)}
                placeholder="What's happening on campus?"
                placeholderTextColor={colors.textFaint}
                value={text}
                onChangeText={setText}
                multiline
                scrollEnabled={false}
                maxLength={1200}
              />

              {/* Attachments — appear inline under the text, like a poll in Threads */}
              {showTeam ? (
                <View style={styles.attach}>
                  <Ionicons name="people-outline" size={18} color={colors.textMuted} />
                  <Text style={styles.attachLabel}>Teammates needed</Text>
                  <View style={styles.stepper}>
                    <TouchableOpacity onPress={() => bump(-1)} hitSlop={8} style={styles.stepBtn}>
                      <Ionicons name="remove" size={15} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.stepVal}>{teamSize}</Text>
                    <TouchableOpacity onPress={() => bump(1)} hitSlop={8} style={styles.stepBtn}>
                      <Ionicons name="add" size={15} color={colors.text} />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity onPress={() => setShowTeam(false)} hitSlop={8}>
                    <Ionicons name="close" size={18} color={colors.textFaint} />
                  </TouchableOpacity>
                </View>
              ) : null}
              {showSkills ? (
                <View style={styles.attach}>
                  <Ionicons name="code-slash-outline" size={18} color={colors.textMuted} />
                  <TextInput
                    ref={skillsRef}
                    style={styles.attachInput}
                    placeholder="Skills needed — React, Figma, Node"
                    placeholderTextColor={colors.textFaint}
                    value={skills}
                    onChangeText={setSkills}
                    autoCapitalize="words"
                    returnKeyType="done"
                  />
                  <TouchableOpacity
                    onPress={() => {
                      setShowSkills(false);
                      setSkills('');
                    }}
                    hitSlop={8}
                  >
                    <Ionicons name="close" size={18} color={colors.textFaint} />
                  </TouchableOpacity>
                </View>
              ) : null}

              {/* Icon-only tools row, Threads style */}
              <View style={styles.tools}>
                <TouchableOpacity onPress={() => setShowTeam((v) => !v)} hitSlop={8}>
                  <Ionicons name={showTeam ? 'people' : 'people-outline'} size={22} color={showTeam ? colors.primary : colors.textMuted} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setShowSkills((v) => !v);
                    if (!showSkills) setTimeout(() => skillsRef.current?.focus(), 50);
                  }}
                  hitSlop={8}
                >
                  <Ionicons name="code-slash-outline" size={22} color={showSkills ? colors.primary : colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Faint "add to thread" tail, like Threads */}
          <View style={[styles.row, { opacity: 0.4, marginTop: 4 }]}>
            <View style={styles.gutter}>
              <Avatar name={user?.name} size={22} />
            </View>
            <Text style={[styles.handle, { fontWeight: '400', color: colors.textMuted, paddingTop: 2 }]}>Add to post</Text>
          </View>
        </ScrollView>

        {/* Bottom bar */}
        <View style={styles.foot}>
          <DotsMenu
            align="left"
            items={CATEGORIES.map((c) => ({ label: c.label, selected: c.key === category, onPress: () => setCategory(c.key) }))}
          >
            <View style={styles.catBtn}>
              <Text style={styles.footText}>{CATEGORIES.find((c) => c.key === category)?.label}</Text>
              <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
            </View>
          </DotsMenu>
          <TouchableOpacity style={[styles.postBtn, !canPost && styles.postBtnOff]} onPress={post} disabled={!canPost} activeOpacity={0.85}>
            <Text style={[styles.postText, !canPost && { color: colors.textFaint }]}>{posting ? 'Posting…' : 'Post'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Confirm
        visible={askDiscard}
        title="Discard post?"
        message="Your draft will be gone for good."
        confirmText="Discard"
        cancelText="Keep editing"
        destructive
        onCancel={() => setAskDiscard(false)}
        onConfirm={() => {
          setAskDiscard(false);
          navigation.goBack();
        }}
      />
    </SafeAreaView>
  );
}

const HAIRLINE = StyleSheet.hairlineWidth;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  bar: { height: 48, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  barSide: { width: 64 },
  barTitle: { flex: 1, textAlign: 'center', fontSize: 16.5, fontWeight: '700', color: colors.text },
  cancel: { fontSize: 15.5, color: colors.text },
  hairline: { height: HAIRLINE, backgroundColor: colors.border },

  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 },
  row: { flexDirection: 'row' },
  gutter: { width: 40, alignItems: 'center', marginRight: 12 },
  thread: { flex: 1, width: 2, borderRadius: 1, backgroundColor: colors.border, marginTop: 8, marginBottom: -6 },
  content: { flex: 1, minWidth: 0 },
  handle: { fontSize: 15, fontWeight: '700', color: colors.text, paddingTop: 9 },
  input: { fontSize: 16, lineHeight: 22, color: colors.text, paddingTop: 4, paddingBottom: 0, textAlignVertical: 'top', ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : null) },

  attach: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 14, borderWidth: HAIRLINE, borderColor: colors.border },
  attachLabel: { flex: 1, fontSize: 14, color: colors.text },
  attachInput: { flex: 1, fontSize: 14.5, color: colors.text, paddingVertical: 2, ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : null) },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stepBtn: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  stepVal: { minWidth: 18, textAlign: 'center', fontSize: 14.5, fontWeight: '700', color: colors.text },
  tools: { flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 14 },
  catBtn: { flexDirection: 'row', alignItems: 'center', gap: 3 },

  foot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: HAIRLINE, borderTopColor: colors.border, backgroundColor: colors.surface },
  footText: { fontSize: 13.5, color: colors.textMuted },
  postBtn: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 999, backgroundColor: colors.primary },
  postBtnOff: { backgroundColor: colors.surfaceMuted },
  postText: { fontSize: 14.5, fontWeight: '700', color: colors.onPrimary },
});
