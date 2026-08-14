import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Share, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Avatar from '../../components/Avatar';
import Icon from '../../components/Icon';
import { handleOf, timeAgo } from '../../components/ThreadPost';
import CelebrationOverlay from '../../components/CelebrationOverlay';
import { Loading } from '../../components/ui';
import { EventsApi } from '../../api/events';
import { ChatApi } from '../../api/chat';
import { useAuth } from '../../context/AuthContext';
import { colors, radius, font } from '../../theme';

const CAT = { hackathon: 'Hackathon', cultural: 'Cultural', competition: 'Competition', project: 'Project', other: 'General' };
const BADGE = { hackathon: 'TEAM', project: 'TEAM', cultural: 'EVENT', competition: 'EVENT', other: 'NOTICE' };

export default function EventDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { user } = useAuth();
  const inputRef = useRef(null);
  const scrollRef = useRef(null);
  const didFocus = useRef(false);

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [celebrating, setCelebrating] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    try { setEvent(await EventsApi.get(id)); } catch (e) { Alert.alert('Error', e.message); } finally { setLoading(false); }
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  useEffect(() => {
    if (event && route.params?.focusComment && !didFocus.current) {
      didFocus.current = true;
      setTimeout(() => { scrollRef.current?.scrollToEnd({ animated: true }); inputRef.current?.focus(); }, 450);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event]);

  if (loading) return <Loading />;
  if (!event) return <SafeAreaView style={styles.safe}><Text style={[font.bodyMuted, { padding: 24 }]}>Not found.</Text></SafeAreaView>;

  const owner = event.createdBy || {};
  const isOwner = String(owner._id || event.createdBy) === String(user?._id);
  const myApp = event.applicants?.find((a) => String(a.user?._id || a.user) === String(user?._id));
  const comments = event.comments || [];

  async function onInterest() {
    try {
      const { alreadyInterested } = await EventsApi.interest(id);
      if (alreadyInterested) openChatWith(owner._id, owner.name);
      else { setCelebrating(true); load(); }
    } catch (e) { Alert.alert('Oops', e.message); }
  }

  async function openChatWith(uid, name) {
    try {
      const convo = await ChatApi.open(id, uid);
      navigation.navigate('Chat', { conversationId: convo._id, title: name });
    } catch (e) { Alert.alert('Cannot open chat', e.message); }
  }

  async function onShare() {
    try { await Share.share({ message: `${event.title}\n\n${event.description}\n\n— shared from Campus Bond` }); } catch {}
  }

  async function onPostComment() {
    const text = commentText.trim();
    if (!text || posting) return;
    setPosting(true);
    try { const c = await EventsApi.addComment(id, text); setEvent((e) => ({ ...e, comments: c })); setCommentText(''); }
    catch (e) { Alert.alert('Error', e.message); } finally { setPosting(false); }
  }

  const tiles = [
    { icon: 'star', label: 'Skill Needed', value: event.skillsNeeded?.length ? event.skillsNeeded.join(', ') : 'Any' },
    { icon: 'tag', label: 'Type', value: CAT[event.category] || 'General' },
    { icon: 'location', label: 'Status', value: event.status === 'open' ? 'Open' : 'Closed' },
    { icon: 'user', label: 'Team Size', value: event.teamSize ? `${event.teamSize} needed` : '—' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <ScrollView ref={scrollRef} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, paddingBottom: 16 }}>
          {/* Post card */}
          <View style={styles.card}>
            <View style={styles.head}>
              <Avatar name={owner.name} size={42} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.handle}>{handleOf(owner.name)}</Text>
                <Text style={styles.sub}>{owner.branch || 'Campus'}{owner.semester ? ` · Sem ${owner.semester}` : ''}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <View style={styles.badge}><Text style={styles.badgeText}>{BADGE[event.category] || 'POST'}</Text></View>
                <Text style={styles.time}>{timeAgo(event.createdAt)}</Text>
              </View>
            </View>

            <Text style={styles.body}>{event.title}</Text>
            {event.description ? <Text style={styles.desc}>{event.description}</Text> : null}
            <Text style={styles.tag}>#{event.category || 'campus'}</Text>

            {/* Details grid */}
            <View style={styles.grid}>
              {tiles.map((t) => (
                <View key={t.label} style={styles.tile}>
                  <Icon name={t.icon} size={18} color={colors.primary} strokeWidth={1.7} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.tileLabel}>{t.label}</Text>
                    <Text style={styles.tileValue} numberOfLines={1}>{t.value}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Primary action */}
            {isOwner ? (
              <View style={[styles.cta, styles.ctaMuted]}><Text style={[styles.ctaText, { color: colors.textMuted }]}>Your post</Text></View>
            ) : myApp && myApp.status !== 'rejected' ? (
              <TouchableOpacity style={styles.cta} onPress={() => openChatWith(owner._id, owner.name)}>
                <Icon name="chat" size={18} color={colors.onPrimary} strokeWidth={1.8} />
                <Text style={styles.ctaText}>Message</Text>
              </TouchableOpacity>
            ) : event.status === 'open' ? (
              <TouchableOpacity style={styles.cta} onPress={onInterest}>
                <Icon name="star" size={18} color={colors.onPrimary} strokeWidth={1.8} />
                <Text style={styles.ctaText}>Interested</Text>
              </TouchableOpacity>
            ) : (
              <View style={[styles.cta, styles.ctaMuted]}><Text style={[styles.ctaText, { color: colors.textMuted }]}>Closed</Text></View>
            )}
          </View>

          {/* Owner: interested list */}
          {isOwner && event.applicants?.length ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Interested ({event.applicants.length})</Text>
              {event.applicants.map((a) => {
                const u = a.user || {};
                const accepted = a.status === 'approved';
                return (
                  <View key={a._id} style={styles.applicant}>
                    <Avatar name={u.name} size={38} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.handle}>{handleOf(u.name)} <Text style={styles.sub}>{u.branch ? `· ${u.branch}` : ''}</Text></Text>
                      {a.message ? <Text style={styles.cBody}>{a.message}</Text> : null}
                      <View style={styles.appBtns}>
                        <TouchableOpacity style={[styles.smallPill, accepted ? styles.smallOutline : styles.smallFilled]} onPress={() => EventsApi.review(id, a._id, accepted ? 'rejected' : 'approved').then(setEvent).catch((e) => Alert.alert('Error', e.message))}>
                          <Text style={[styles.smallText, { color: accepted ? colors.textMuted : colors.onPrimary }]}>{accepted ? 'Accepted' : 'Accept'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.smallPill, styles.smallOutline]} onPress={() => openChatWith(u._id, u.name)}>
                          <Text style={[styles.smallText, { color: colors.text }]}>Message</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : null}

          {/* Comments */}
          <View style={styles.cHead}>
            <Text style={styles.cTitle}>Comments {comments.length}</Text>
            <Text style={styles.cSort}>Most recent</Text>
          </View>
          {comments.length === 0 ? (
            <Text style={[font.bodyMuted, { paddingHorizontal: 4, paddingTop: 8 }]}>No comments yet. Start the conversation.</Text>
          ) : (
            comments.map((c) => (
              <View key={c._id} style={styles.comment}>
                <Avatar name={c.user?.name} size={34} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={styles.cLine}>
                    <Text style={styles.cName}>{handleOf(c.user?.name)}</Text>
                    <Text style={styles.cTime}>{timeAgo(c.createdAt)}</Text>
                  </View>
                  <Text style={styles.cBody}>{c.text}</Text>
                  <View style={styles.cMeta}>
                    <Text style={styles.cReply}>Reply</Text>
                    <View style={styles.cLike}>
                      <Icon name="heart" size={14} color={colors.textMuted} strokeWidth={1.7} />
                      <Text style={styles.cLikeText}>0</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>

        {/* Comment input */}
        <View style={styles.inputBar}>
          <View style={styles.inputPill}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Add a comment..."
              placeholderTextColor={colors.textMuted}
              value={commentText}
              onChangeText={setCommentText}
              multiline
            />
            <Icon name="image" size={20} color={colors.textMuted} strokeWidth={1.6} />
          </View>
          <TouchableOpacity style={styles.send} onPress={onPostComment} disabled={!commentText.trim() || posting}>
            <Icon name="send" size={19} color={colors.onPrimary} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <CelebrationOverlay visible={celebrating} onDone={() => setCelebrating(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 16 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  handle: { fontSize: 15, fontWeight: '700', color: colors.text },
  sub: { fontSize: 12.5, color: colors.textMuted, marginTop: 1, fontWeight: '400' },
  badge: { backgroundColor: colors.primarySoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.6, color: colors.primary },
  time: { fontSize: 12, color: colors.textMuted },
  body: { fontSize: 16, lineHeight: 23, color: colors.text },
  desc: { fontSize: 15, lineHeight: 22, color: colors.textMuted, marginTop: 8 },
  tag: { fontSize: 14.5, color: colors.link, marginTop: 10, fontWeight: '500' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 },
  tile: { width: '47.5%', flexGrow: 1, flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: 12, padding: 12 },
  tileLabel: { fontSize: 11.5, color: colors.textMuted },
  tileValue: { fontSize: 13.5, fontWeight: '600', color: colors.text, marginTop: 1 },
  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 15, marginTop: 16 },
  ctaMuted: { backgroundColor: colors.surfaceMuted },
  ctaText: { fontSize: 15, fontWeight: '700', color: colors.onPrimary },
  section: { marginTop: 16, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  applicant: { flexDirection: 'row', gap: 12 },
  appBtns: { flexDirection: 'row', gap: 8, paddingTop: 8 },
  smallPill: { borderRadius: 999, paddingHorizontal: 18, paddingVertical: 8 },
  smallFilled: { backgroundColor: colors.primary },
  smallOutline: { borderWidth: 1, borderColor: colors.border },
  smallText: { fontSize: 13, fontWeight: '700' },
  cHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, marginBottom: 6, paddingHorizontal: 4 },
  cTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  cSort: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  comment: { flexDirection: 'row', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  cLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cName: { fontSize: 14, fontWeight: '700', color: colors.text },
  cTime: { fontSize: 12, color: colors.textMuted },
  cBody: { fontSize: 14.5, lineHeight: 20, color: colors.text, marginTop: 3 },
  cMeta: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 8 },
  cReply: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  cLike: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cLikeText: { fontSize: 13, color: colors.textMuted },
  inputBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.border },
  inputPill: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surfaceMuted, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 4 },
  input: { flex: 1, fontSize: 15, color: colors.text, maxHeight: 100, paddingVertical: 9 },
  send: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
});
