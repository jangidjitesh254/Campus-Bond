import React, { useState, useCallback, useRef, useEffect, useMemo, useLayoutEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Share } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, TextInput } from '../../components/Text';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Avatar from '../../components/Avatar';
import Icon from '../../components/Icon';
import AmbientGlow from '../../components/AmbientGlow';
import { handleOf, timeAgo, deadlineState } from '../../components/ThreadPost';
import CelebrationOverlay from '../../components/CelebrationOverlay';
import { Loading } from '../../components/ui';
import { EventsApi } from '../../api/events';
import { ChatApi } from '../../api/chat';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useKeyboardHeight } from '../../hooks/useKeyboardOpen';
import { gradients, shadow } from '../../theme';

const BADGE = { hackathon: 'TEAM', project: 'TEAM', cultural: 'EVENT', competition: 'EVENT', other: 'NOTICE' };

/**
 * Post detail — the handoff's "Post detail" artboard: custom top bar, a
 * gradient hero carrying the kind and time-left tags, title, deadline,
 * author, description, skill chips, the coral Interested action, then the
 * replies with a fixed reply bar.
 */
export default function EventDetailScreen({ route, navigation }) {
  const { t, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(t, isDark), [t, isDark]);
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
  const interestedCount = (event.applicants || []).length;
  const due = deadlineState(event.deadline);
  const skills = event.skillsNeeded || [];

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

  async function onPostComment() {
    const text = commentText.trim();
    if (!text || posting) return;
    setPosting(true);
    try { const c = await EventsApi.addComment(id, text); setEvent((e) => ({ ...e, comments: c })); setCommentText(''); }
    catch (e) { Alert.alert('Error', e.message); } finally { setPosting(false); }
  }

  // The one big action, by where this student stands with the post.
  const cta = isOwner
    ? { label: 'Your post', kind: 'muted' }
    : myApp?.status === 'approved'
    ? { label: 'Message', kind: 'accent', onPress: () => openChatWith(owner._id, owner.name) }
    : myApp?.status === 'rejected'
    ? { label: 'Not selected', kind: 'muted' }
    : myApp
    ? { label: 'Requested · tap to withdraw', kind: 'outline', onPress: onInterest }
    : event.status === 'open'
    ? { label: 'Interested', kind: 'accent', onPress: onInterest }
    : { label: 'Closed', kind: 'muted' };

  const metaBits = [event.venue ? { icon: 'location', text: event.venue } : null, event.teamSize ? { icon: 'users', text: `${event.teamSize} needed` } : null].filter(Boolean);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AmbientGlow />
      <View style={{ flex: 1, paddingBottom: keyboardHeight }}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.round36} onPress={() => navigation.goBack()} hitSlop={8}>
            <Icon name="back" size={18} color={t.text} strokeWidth={1.8} />
          </TouchableOpacity>
          <View style={styles.topRight}>
            <TouchableOpacity style={styles.topStat} onPress={onInterest} disabled={isOwner} hitSlop={8}>
              <Icon name="heart" size={19} color={myApp ? t.accentFill : t.textMuted} filled={!!myApp} strokeWidth={1.8} />
              <Text style={[styles.topStatText, myApp && { color: t.accentFill }]}>{interestedCount}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.topStat} onPress={() => { scrollRef.current?.scrollToEnd({ animated: true }); inputRef.current?.focus(); }} hitSlop={8}>
              <Icon name="comment" size={19} color={t.textMuted} strokeWidth={1.8} />
              <Text style={styles.topStatText}>{comments.length}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onShare} hitSlop={8}>
              <Icon name="shareArrow" size={18} color={t.textMuted} strokeWidth={1.8} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          {/* Hero */}
          <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
            <Icon name="briefcase" size={56} color="rgba(255,255,255,0.14)" strokeWidth={1.4} />
            <View style={styles.heroTags}>
              <View style={styles.heroTag}><Text style={styles.heroTagText}>{BADGE[event.category] || 'POST'}</Text></View>
              {due && !due.past ? (
                <View style={[styles.heroTag, styles.heroTagHot]}><Text style={styles.heroTagText}>{due.left}</Text></View>
              ) : event.status !== 'open' ? (
                <View style={[styles.heroTag, styles.heroTagMuted]}><Text style={styles.heroTagText}>CLOSED</Text></View>
              ) : null}
            </View>
          </LinearGradient>

          <View style={styles.body}>
            <Text style={styles.title}>{event.title}</Text>

            {due ? (
              <View style={styles.metaRow}>
                <Icon name="calendar" size={14} color={t.textFaint} strokeWidth={1.6} />
                <Text style={styles.metaText}>{due.text}</Text>
              </View>
            ) : null}
            {metaBits.length ? (
              <View style={styles.metaRow}>
                {metaBits.map((m, i) => (
                  <View key={m.icon} style={[styles.metaBit, i > 0 && { marginLeft: 12 }]}>
                    <Icon name={m.icon} size={14} color={t.textFaint} strokeWidth={1.6} />
                    <Text style={styles.metaText}>{m.text}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {/* Author */}
            <View style={styles.author}>
              <Avatar name={owner.name} size={36} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.handle} numberOfLines={1}>{handleOf(owner.name)}</Text>
                <Text style={styles.sub} numberOfLines={1}>{owner.branch || 'Campus'}{owner.semester ? ` · Sem ${owner.semester}` : ''}</Text>
              </View>
              {!isOwner && myApp?.status === 'approved' ? (
                <TouchableOpacity style={styles.round34} onPress={() => openChatWith(owner._id, owner.name)} hitSlop={8}>
                  <Icon name="comment" size={16} color={t.textMuted} strokeWidth={1.8} />
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.divider} />

            {event.description ? <Text style={styles.desc}>{event.description}</Text> : null}

            {skills.length ? (
              <View style={styles.skills}>
                {skills.map((s) => (
                  <View key={s} style={styles.skill}><Text style={styles.skillText}>{s}</Text></View>
                ))}
              </View>
            ) : null}

            {/* Primary action */}
            <View style={styles.ctaRow}>
              {cta.kind === 'accent' ? (
                <TouchableOpacity style={styles.ctaWrap} onPress={cta.onPress} activeOpacity={0.88}>
                  <LinearGradient colors={gradients.accent} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.cta, shadow.glow]}>
                    <Text style={[styles.ctaText, { color: '#FFFFFF' }]}>{cta.label}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.ctaWrap, styles.cta, cta.kind === 'outline' ? styles.ctaOutline : styles.ctaMuted]}
                  onPress={cta.onPress}
                  disabled={!cta.onPress}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.ctaText, { color: cta.kind === 'outline' ? t.text : t.textMuted }]}>{cta.label}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.ctaSquare} onPress={onShare} activeOpacity={0.85}>
                <Icon name="shareArrow" size={18} color={t.textMuted} strokeWidth={1.8} />
              </TouchableOpacity>
            </View>

            {/* Owner: interested list */}
            {isOwner && event.applicants?.length ? (
              <View style={styles.applicants}>
                <View style={styles.sectionHead}>
                  <Text style={styles.sectionTitle}>Interested</Text>
                  <Text style={styles.sectionCount}>{event.applicants.length}</Text>
                </View>
                {event.applicants.map((a) => {
                  const u = a.user || {};
                  const accepted = a.status === 'approved';
                  return (
                    <View key={a._id} style={styles.applicant}>
                      <Avatar name={u.name} size={36} />
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <View style={styles.appTop}>
                          <Text style={styles.appName} numberOfLines={1}>{handleOf(u.name)}</Text>
                          <View style={[styles.appChip, accepted && styles.appChipOk]}>
                            <Text style={[styles.appChipText, accepted && { color: t.success }]}>{accepted ? 'ACCEPTED' : 'PENDING'}</Text>
                          </View>
                        </View>
                        <Text style={styles.sub} numberOfLines={1}>{u.branch || 'Campus'}{u.semester ? ` · Sem ${u.semester}` : ''}</Text>
                        {a.message ? <Text style={styles.appMsg}>{a.message}</Text> : null}
                        <View style={styles.appBtns}>
                          {accepted ? (
                            <TouchableOpacity style={[styles.smallPill, styles.smallFilled]} onPress={() => openChatWith(u._id, u.name)}>
                              <Text style={[styles.smallText, { color: t.onPrimary }]}>Message</Text>
                            </TouchableOpacity>
                          ) : (
                            <>
                              <TouchableOpacity
                                style={[styles.smallPill, styles.smallFilled]}
                                onPress={() => EventsApi.review(id, a._id, 'approved').then(setEvent).catch((e) => Alert.alert('Error', e.message))}
                              >
                                <Text style={[styles.smallText, { color: t.onPrimary }]}>Accept</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[styles.smallPill, styles.smallOutline]}
                                onPress={() => EventsApi.review(id, a._id, 'rejected').then(setEvent).catch((e) => Alert.alert('Error', e.message))}
                              >
                                <Text style={[styles.smallText, { color: t.textMuted }]}>Decline</Text>
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

            <View style={[styles.divider, { marginTop: 24 }]} />

            {/* Replies */}
            <Text style={styles.repliesTitle}>{comments.length ? `${comments.length} ${comments.length === 1 ? 'reply' : 'replies'}` : 'No replies yet'}</Text>
            <View style={styles.replies}>
              {comments.map((c) => {
                const mine = String(c.user?._id) === String(user?._id);
                return (
                  <View key={c._id} style={styles.reply}>
                    <Avatar name={c.user?.name} size={30} neutral={!mine} gradient={mine} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={styles.replyLine}>
                        <Text style={styles.replyName}>{handleOf(c.user?.name)}</Text>
                        <Text style={styles.replyMeta}>{c.user?.branch || 'Campus'}{c.user?.semester ? ` · Sem ${c.user.semester}` : ''} · {timeAgo(c.createdAt)}</Text>
                      </View>
                      <Text style={styles.replyBody}>{c.text}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>

        {/* Reply bar */}
        <View style={[styles.inputBar, { paddingBottom: keyboardOpen ? 12 : Math.max(insets.bottom, 12) + 4 }]}>
          <Avatar name={user?.name} size={30} gradient />
          <View style={styles.inputPill}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Add a reply..."
              placeholderTextColor={t.textFaint}
              value={commentText}
              onChangeText={setCommentText}
              multiline
            />
          </View>
          <TouchableOpacity onPress={onPostComment} disabled={!commentText.trim() || posting} activeOpacity={0.85} style={!commentText.trim() && { opacity: 0.5 }}>
            <LinearGradient colors={gradients.accent} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.send}>
              <Icon name="send" size={15} color="#FFFFFF" strokeWidth={1.7} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      <CelebrationOverlay visible={celebrating} onDone={() => setCelebrating(false)} message="Request sent! 🎉" subtitle="The poster will review it" />
    </SafeAreaView>
  );
}

function makeStyles(t, isDark) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: t.page },
    notFound: { fontSize: 14.5, fontWeight: '600', color: t.textMuted, padding: 24 },

    topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
    round36: { width: 36, height: 36, borderRadius: 18, backgroundColor: t.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
    round34: { width: 34, height: 34, borderRadius: 17, backgroundColor: t.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
    topRight: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    topStat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    topStatText: { fontSize: 13, fontWeight: '700', color: t.textMuted },

    hero: {
      marginHorizontal: 20, marginTop: 14, height: 150, borderRadius: 26,
      alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
      shadowColor: '#6C4DFF', shadowOffset: { width: 0, height: 24 }, shadowOpacity: 0.4, shadowRadius: 25, elevation: 6,
    },
    heroTags: { position: 'absolute', left: 16, bottom: 14, flexDirection: 'row', gap: 8 },
    heroTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.14)' },
    heroTagHot: { backgroundColor: 'rgba(108,77,255,0.9)' },
    heroTagMuted: { backgroundColor: 'rgba(0,0,0,0.35)' },
    heroTagText: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase', color: '#FFFFFF' },

    body: { paddingHorizontal: 20, paddingTop: 20 },
    title: { fontSize: 21, lineHeight: 28, fontWeight: '600', color: t.text },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
    metaBit: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    metaText: { fontSize: 13, fontWeight: '600', color: t.textFaint },

    author: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 },
    handle: { fontSize: 14, fontWeight: '700', color: t.text },
    sub: { fontSize: 12, fontWeight: '600', color: t.textDim, marginTop: 1 },
    divider: { height: 1, backgroundColor: t.hairlineAlt, marginTop: 18 },
    desc: { fontSize: 14.5, lineHeight: 24, fontWeight: '600', color: t.textMuted, marginTop: 16 },

    skills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
    skill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16, borderWidth: 1.4, borderColor: 'rgba(108,77,255,0.4)' },
    skillText: { fontSize: 12.5, fontWeight: '700', color: t.accent },

    ctaRow: { flexDirection: 'row', gap: 10, marginTop: 22 },
    ctaWrap: { flex: 1, borderRadius: 20 },
    cta: { height: 48, borderRadius: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
    ctaOutline: { borderWidth: 1.5, borderColor: t.borderSoft },
    ctaMuted: { backgroundColor: t.surfaceAlt },
    ctaText: { fontSize: 14.5, fontWeight: '800' },
    ctaSquare: { width: 48, height: 48, borderRadius: 20, backgroundColor: t.surfaceAlt, alignItems: 'center', justifyContent: 'center' },

    applicants: { marginTop: 22, backgroundColor: t.glass, borderRadius: 26, borderWidth: 1, borderColor: t.glassBorder, padding: 16, gap: 12 },
    sectionHead: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
    sectionTitle: { fontSize: 15, fontWeight: '800', color: t.text },
    sectionCount: { fontSize: 13, fontWeight: '700', color: t.textDim },
    applicant: { flexDirection: 'row', gap: 12, padding: 12, borderRadius: 18, backgroundColor: t.surfaceAlt },
    appTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    appName: { flexShrink: 1, fontSize: 14, fontWeight: '700', color: t.text },
    appChip: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, backgroundColor: t.primarySoft },
    appChipOk: { backgroundColor: t.successSoft },
    appChipText: { fontSize: 9.5, fontWeight: '800', letterSpacing: 0.6, color: t.textMuted },
    appMsg: { fontSize: 13, lineHeight: 18, fontWeight: '600', color: t.text, marginTop: 7 },
    appBtns: { flexDirection: 'row', gap: 8, paddingTop: 8 },
    smallPill: { borderRadius: 999, paddingHorizontal: 18, paddingVertical: 8, borderWidth: 1.5, borderColor: 'transparent' },
    smallFilled: { backgroundColor: t.primary },
    smallOutline: { borderColor: t.borderSoft },
    smallText: { fontSize: 13, fontWeight: '800' },

    repliesTitle: { fontSize: 15, fontWeight: '800', color: t.text, marginTop: 20 },
    replies: { gap: 16, marginTop: 14 },
    reply: { flexDirection: 'row', gap: 10 },
    replyLine: { flexDirection: 'row', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' },
    replyName: { fontSize: 13.5, fontWeight: '700', color: t.text },
    replyMeta: { fontSize: 11.5, fontWeight: '600', color: t.textDim },
    replyBody: { fontSize: 13.5, lineHeight: 20, fontWeight: '600', color: t.textMuted, marginTop: 3 },

    inputBar: {
      flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 12,
      backgroundColor: t.barGlass, borderTopWidth: 1, borderTopColor: t.borderSoft,
    },
    inputPill: { flex: 1, backgroundColor: t.field, borderRadius: 20, paddingHorizontal: 16 },
    input: { fontSize: 13.5, fontWeight: '600', color: t.text, maxHeight: 100, paddingVertical: 10 },
    send: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  });
}
