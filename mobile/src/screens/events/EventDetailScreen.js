import React, { useState, useCallback, useRef, useEffect, useLayoutEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text, TextInput } from '../../components/Text';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Avatar from '../../components/Avatar';
import Icon from '../../components/Icon';
import { handleOf, timeAgo, deadlineState } from '../../components/ThreadPost';
import CelebrationOverlay from '../../components/CelebrationOverlay';
import { Loading } from '../../components/ui';
import { EventsApi } from '../../api/events';
import { ChatApi } from '../../api/chat';
import { useAuth } from '../../context/AuthContext';
import { useTheme, useStyles } from '../../context/ThemeContext';
import { useKeyboardHeight } from '../../hooks/useKeyboardOpen';

const LABEL = { hackathon: 'Hackathon', project: 'Project', cultural: 'Event', competition: 'Competition', other: 'Notice' };

/**
 * Post detail — the same Threads-style card the feed shows, unfolded: the
 * avatar gutter with its thread line, handle / branch / age, the kind pill,
 * title, full description, "Looking for" chips, the roster row, then the
 * heart / reply / share actions. Below it: the one action for this student,
 * the owner's request list, and the replies. A pill reply bar sits at the
 * bottom. Everything reads off the feed's tokens so it feels like Home.
 */
export default function EventDetailScreen({ route, navigation }) {
  const { t: colors } = useTheme();
  const styles = useStyles(makeStyles);
  const keyboardHeight = useKeyboardHeight();
  const { id } = route.params;
  const keyboardOpen = keyboardHeight > 0;
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const inputRef = useRef(null);
  const scrollRef = useRef(null);
  const didFocus = useRef(false);

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [celebrating, setCelebrating] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [posting, setPosting] = useState(false);

  useLayoutEffect(() => { navigation.setOptions({ headerShown: false }); }, [navigation]);

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
  if (!event) {
    return (
      <SafeAreaView style={styles.safe}><Text style={styles.notFound}>Not found.</Text></SafeAreaView>
    );
  }

  const owner = event.createdBy || {};
  const isOwner = String(owner._id || event.createdBy) === String(user?._id);
  const myApp = event.applicants?.find((a) => String(a.user?._id || a.user) === String(user?._id));
  const comments = event.comments || [];
  const applicants = event.applicants || [];
  const approved = applicants.filter((a) => a.status === 'approved');
  const interestedCount = applicants.length;
  const due = deadlineState(event.deadline);
  const skills = (event.skillsNeeded || []).filter(Boolean);
  const size = event.teamSize || 1;
  const filled = approved.length;
  const closed = event.status !== 'open' || (due && due.past);
  const who = owner.branch ? `${owner.branch}${owner.semester ? ` · Sem ${owner.semester}` : ''}` : '';

  /** Toggle the request. Chat only opens once the poster accepts. */
  async function onInterest() {
    if (isOwner) return;
    try {
      const res = await EventsApi.interest(id);
      if (res.interested) setCelebrating(true);
      load();
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

  function focusReply() {
    scrollRef.current?.scrollToEnd({ animated: true });
    inputRef.current?.focus();
  }

  async function onPostComment() {
    const text = commentText.trim();
    if (!text || posting) return;
    setPosting(true);
    try { const c = await EventsApi.addComment(id, text); setEvent((e) => ({ ...e, comments: c })); setCommentText(''); }
    catch (e) { Alert.alert('Error', e.message); } finally { setPosting(false); }
  }

  function review(a, status) {
    EventsApi.review(id, a._id, status).then(setEvent).catch((e) => Alert.alert('Error', e.message));
  }

  // The one big action, by where this student stands with the post.
  const cta = isOwner
    ? { label: 'Your post', kind: 'muted' }
    : myApp?.status === 'approved'
    ? { label: 'Message the poster', kind: 'primary', icon: 'chatbubble-outline', onPress: () => openChatWith(owner._id, owner.name) }
    : myApp?.status === 'rejected'
    ? { label: 'Not selected', kind: 'muted' }
    : myApp
    ? { label: 'Requested · tap to withdraw', kind: 'outline', onPress: onInterest }
    : !closed
    ? { label: "I'm interested", kind: 'primary', icon: 'heart-outline', onPress: onInterest }
    : { label: 'Closed', kind: 'muted' };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={{ flex: 1, paddingBottom: keyboardHeight }}>
        {/* Top bar — same quiet chrome as Home */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.round} onPress={() => navigation.goBack()} hitSlop={8}>
            <Icon name="back" size={18} color={colors.text} strokeWidth={1.9} />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Post</Text>
          <TouchableOpacity style={styles.round} onPress={onShare} hitSlop={8}>
            <Ionicons name="paper-plane-outline" size={19} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {/* The post, as on the feed but fully unfolded */}
          <View style={styles.post}>
            <View style={styles.gutter}>
              <Avatar name={owner.name} size={40} neutral />
              <View style={styles.thread} />
            </View>
            <View style={styles.content}>
              <View style={styles.head}>
                <Text style={styles.name} numberOfLines={1}>{handleOf(owner.name)}</Text>
                {who ? <Text style={styles.who} numberOfLines={1}>{who}</Text> : null}
                <Text style={styles.time}>{timeAgo(event.createdAt)}</Text>
              </View>
              <View style={styles.labelRow}>
                <View style={styles.pill}>
                  <Ionicons name="people-outline" size={11} color={colors.textMuted} />
                  <Text style={styles.pillText}>{LABEL[event.category] || 'Post'}</Text>
                </View>
                {closed ? (
                  <View style={styles.pill}><Text style={styles.pillText}>Closed</Text></View>
                ) : due && due.soon ? (
                  <View style={[styles.pill, styles.pillWarm]}><Text style={[styles.pillText, { color: colors.amber }]}>{due.left}</Text></View>
                ) : null}
              </View>

              <Text style={styles.title}>{event.title}</Text>
              {event.description ? <Text style={styles.body}>{event.description}</Text> : null}

              {skills.length ? (
                <View style={styles.chips}>
                  <Text style={styles.chipsLabel}>Looking for</Text>
                  {skills.map((sk) => (
                    <View key={sk} style={styles.chip}><Text style={styles.chipText}>{sk}</Text></View>
                  ))}
                </View>
              ) : null}

              {/* Where / when */}
              {due || event.venue ? (
                <View style={styles.meta}>
                  {due ? (
                    <View style={styles.metaBit}>
                      <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
                      <Text style={styles.metaText}>{due.text}</Text>
                    </View>
                  ) : null}
                  {event.venue ? (
                    <View style={styles.metaBit}>
                      <Ionicons name="location-outline" size={14} color={colors.textMuted} />
                      <Text style={styles.metaText}>{event.venue}</Text>
                    </View>
                  ) : null}
                </View>
              ) : null}

              {/* Roster: owner + accepted members, then a dashed "+" for every open seat */}
              <View style={styles.roster}>
                <View style={styles.seats}>
                  {[{ user: owner }, ...approved].slice(0, 5).map((a, i) => (
                    <View key={a.user?._id || i} style={[styles.seat, i > 0 && { marginLeft: -7 }]}>
                      <Avatar name={a.user?.name} size={22} neutral />
                    </View>
                  ))}
                  {Array.from({ length: Math.min(Math.max(size - filled, 0), 4) }).map((_, i) => (
                    <View key={`open-${i}`} style={[styles.seat, styles.seatOpen, { marginLeft: -7 }]}>
                      <Ionicons name="add" size={12} color={colors.textMuted} />
                    </View>
                  ))}
                </View>
                <Text style={styles.rosterText} numberOfLines={1}>
                  {closed ? 'Team closed' : filled >= size ? 'Team full' : `${size - filled} ${size - filled === 1 ? 'seat' : 'seats'} open`}
                  {size > 1 ? <Text style={{ color: colors.textFaint }}> · team of {size}</Text> : null}
                </Text>
              </View>

              <View style={styles.actions}>
                <TouchableOpacity style={styles.action} onPress={isOwner ? undefined : onInterest} disabled={isOwner} hitSlop={8}>
                  <Ionicons name={myApp ? 'heart' : 'heart-outline'} size={23} color={myApp ? colors.like : colors.text} />
                  {interestedCount ? <Text style={styles.count}>{interestedCount}</Text> : null}
                </TouchableOpacity>
                <TouchableOpacity style={styles.action} onPress={focusReply} hitSlop={8}>
                  <Ionicons name="chatbubble-outline" size={20} color={colors.text} />
                  {comments.length ? <Text style={styles.count}>{comments.length}</Text> : null}
                </TouchableOpacity>
                <TouchableOpacity style={styles.action} onPress={onShare} hitSlop={8}>
                  <Ionicons name="paper-plane-outline" size={21} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* The one action */}
          <TouchableOpacity
            style={[styles.cta, cta.kind === 'primary' ? styles.ctaPrimary : cta.kind === 'outline' ? styles.ctaOutline : styles.ctaMuted]}
            onPress={cta.onPress}
            disabled={!cta.onPress}
            activeOpacity={0.85}
          >
            {cta.icon ? <Ionicons name={cta.icon} size={18} color={colors.onPrimary} /> : null}
            <Text style={[styles.ctaText, { color: cta.kind === 'primary' ? colors.onPrimary : cta.kind === 'outline' ? colors.text : colors.textMuted }]}>{cta.label}</Text>
          </TouchableOpacity>

          {/* Owner: who asked to join */}
          {isOwner && applicants.length ? (
            <View style={styles.section}>
              <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>Requests</Text>
                <Text style={styles.sectionCount}>{applicants.length}</Text>
              </View>
              {applicants.map((a, i) => {
                const u = a.user || {};
                const accepted = a.status === 'approved';
                const declined = a.status === 'rejected';
                return (
                  <View key={a._id} style={[styles.row, i > 0 && styles.rowLine]}>
                    <Avatar name={u.name} size={36} neutral />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={styles.rowHead}>
                        <Text style={styles.name} numberOfLines={1}>{handleOf(u.name)}</Text>
                        <Text style={styles.who} numberOfLines={1}>{u.branch || 'Campus'}{u.semester ? ` · Sem ${u.semester}` : ''}</Text>
                      </View>
                      {a.message ? <Text style={styles.rowBody}>{a.message}</Text> : null}
                      <View style={styles.rowBtns}>
                        {accepted ? (
                          <>
                            <View style={[styles.small, styles.smallDone]}><Ionicons name="checkmark" size={13} color={colors.success} /><Text style={[styles.smallText, { color: colors.success }]}>Accepted</Text></View>
                            <TouchableOpacity style={[styles.small, styles.smallFilled]} onPress={() => openChatWith(u._id, u.name)}>
                              <Text style={[styles.smallText, { color: colors.onPrimary }]}>Message</Text>
                            </TouchableOpacity>
                          </>
                        ) : declined ? (
                          <View style={[styles.small, styles.smallDone]}><Text style={styles.smallText}>Declined</Text></View>
                        ) : (
                          <>
                            <TouchableOpacity style={[styles.small, styles.smallFilled]} onPress={() => review(a, 'approved')}>
                              <Text style={[styles.smallText, { color: colors.onPrimary }]}>Accept</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.small, styles.smallOutline]} onPress={() => review(a, 'rejected')}>
                              <Text style={styles.smallText}>Decline</Text>
                            </TouchableOpacity>
                          </>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : null}

          {/* Replies */}
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Replies</Text>
              {comments.length ? <Text style={styles.sectionCount}>{comments.length}</Text> : null}
            </View>
            {comments.length ? (
              comments.map((c, i) => {
                const mine = String(c.user?._id) === String(user?._id);
                return (
                  <View key={c._id} style={[styles.row, i > 0 && styles.rowLine]}>
                    <Avatar name={c.user?.name} size={32} neutral={!mine} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={styles.rowHead}>
                        <Text style={styles.name} numberOfLines={1}>{handleOf(c.user?.name)}</Text>
                        <Text style={styles.who} numberOfLines={1}>{c.user?.branch || 'Campus'}{c.user?.semester ? ` · Sem ${c.user.semester}` : ''}</Text>
                        <Text style={styles.time}>{timeAgo(c.createdAt)}</Text>
                      </View>
                      <Text style={styles.rowBody}>{c.text}</Text>
                    </View>
                  </View>
                );
              })
            ) : (
              <Text style={styles.emptyText}>No replies yet — be the first.</Text>
            )}
          </View>
        </ScrollView>

        {/* Reply bar */}
        <View style={[styles.inputBar, { paddingBottom: keyboardOpen ? 10 : Math.max(insets.bottom, 10) + 2 }]}>
          <Avatar name={user?.name} size={32} />
          <View style={styles.inputPill}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder={`Reply to ${handleOf(owner.name)}…`}
              placeholderTextColor={colors.textFaint}
              value={commentText}
              onChangeText={setCommentText}
              multiline
            />
          </View>
          <TouchableOpacity onPress={onPostComment} disabled={!commentText.trim() || posting} activeOpacity={0.85} style={[styles.send, !commentText.trim() && styles.sendOff]}>
            <Ionicons name="arrow-up" size={18} color={commentText.trim() ? colors.onPrimary : colors.textFaint} />
          </TouchableOpacity>
        </View>
      </View>

      <CelebrationOverlay visible={celebrating} onDone={() => setCelebrating(false)} message="Request sent! 🎉" subtitle="The poster will review it" />
    </SafeAreaView>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.page },
    notFound: { fontSize: 14.5, fontWeight: '600', color: colors.textMuted, padding: 24 },

    topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingTop: 6, paddingBottom: 8 },
    round: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
    topTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
    scroll: { paddingBottom: 24, gap: 12 },

    // The feed card, unfolded
    post: { flexDirection: 'row', paddingHorizontal: 14, paddingTop: 14, paddingBottom: 12, marginHorizontal: 12, backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.border },
    gutter: { width: 40, alignItems: 'center', marginRight: 10 },
    thread: { flex: 1, width: 2, borderRadius: 1, backgroundColor: colors.border, marginTop: 8, marginBottom: -4 },
    content: { flex: 1, minWidth: 0 },
    head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    name: { fontSize: 15, lineHeight: 20, fontWeight: '700', color: colors.text, flexShrink: 1 },
    who: { flex: 1, fontSize: 12, lineHeight: 20, color: colors.textFaint, marginLeft: -2, includeFontPadding: false },
    time: { fontSize: 12.5, lineHeight: 20, color: colors.textFaint, includeFontPadding: false },
    labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5, flexWrap: 'wrap' },
    pill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
    pillWarm: { borderColor: colors.amberSoft, backgroundColor: colors.amberSoft },
    pillText: { fontSize: 11.5, fontWeight: '700', letterSpacing: 0.2, color: colors.textMuted },
    title: { fontSize: 17, lineHeight: 23, fontWeight: '700', color: colors.text, marginTop: 8 },
    body: { fontSize: 14.5, lineHeight: 21, color: colors.textMuted, marginTop: 6 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 12 },
    chipsLabel: { fontSize: 12.5, color: colors.textMuted, marginRight: 2 },
    chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: colors.surfaceMuted, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
    chipText: { fontSize: 12.5, fontWeight: '600', color: colors.text },
    meta: { gap: 6, marginTop: 12 },
    metaBit: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    metaText: { fontSize: 13, color: colors.textMuted, flexShrink: 1 },
    roster: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
    seats: { flexDirection: 'row', alignItems: 'center' },
    seat: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: colors.surface, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
    seatOpen: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.mediaStroke },
    rosterText: { flex: 1, fontSize: 13, color: colors.textMuted },
    actions: { flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 14 },
    action: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    count: { fontSize: 13.5, color: colors.textMuted, fontWeight: '500' },

    // Primary action
    cta: { marginHorizontal: 12, height: 48, borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    ctaPrimary: { backgroundColor: colors.primary },
    ctaOutline: { borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface },
    ctaMuted: { backgroundColor: colors.surfaceMuted },
    ctaText: { fontSize: 15, fontWeight: '700' },

    // Sections (requests, replies) — same card as the post
    section: { marginHorizontal: 12, backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 12 },
    sectionHead: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 6 },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
    sectionCount: { fontSize: 13, color: colors.textFaint },
    row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 10 },
    rowLine: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
    rowHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    rowBody: { fontSize: 14, lineHeight: 20, color: colors.text, marginTop: 3 },
    rowBtns: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
    small: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7, borderWidth: StyleSheet.hairlineWidth, borderColor: 'transparent' },
    smallFilled: { backgroundColor: colors.primary },
    smallOutline: { borderColor: colors.border, backgroundColor: colors.surface },
    smallDone: { backgroundColor: colors.surfaceMuted },
    smallText: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
    emptyText: { fontSize: 13.5, color: colors.textMuted, paddingVertical: 8 },

    // Reply bar
    inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 12, paddingTop: 10, backgroundColor: colors.surface, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
    inputPill: { flex: 1, backgroundColor: colors.surfaceMuted, borderRadius: 20, paddingHorizontal: 14, minHeight: 40, justifyContent: 'center' },
    input: { fontSize: 14.5, color: colors.text, maxHeight: 100, paddingVertical: 9 },
    send: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
    sendOff: { backgroundColor: colors.surfaceMuted },
  });
