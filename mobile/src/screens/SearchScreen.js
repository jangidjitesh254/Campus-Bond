import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, Keyboard } from 'react-native';
import { Text, TextInput } from '../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Icon from '../components/Icon';
import Avatar from '../components/Avatar';
import { handleOf, timeAgo } from '../components/ThreadPost';
import { ResourceRow, makeResourceStyles } from './resources/ResourcesScreen';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { SearchApi } from '../api/search';
import { openResource } from '../api/resources';
import { imageUrl } from '../api/lostfound';
import { Ghost } from '../components/Mascot';
import { layout } from '../theme';

// The library and score live in the More (profile) stack.
const QUICK = [
  { key: 'papers', ion: 'document-text', label: 'Past papers & notes', tab: 'More', to: { screen: 'Resources' } },
  { key: 'score', ion: 'trophy', label: 'Campus score', tab: 'More', to: { screen: 'CampusScore' } },
  { key: 'map', ion: 'map', label: '3D campus map', tab: 'Map' },
  { key: 'clubs', ion: 'people-circle', label: 'Clubs', tab: 'Club' },
  { key: 'market', ion: 'pricetag', label: 'Marketplace', tab: 'Sell' },
  { key: 'lost', ion: 'search', label: 'Lost & Found', tab: 'Post', to: { screen: 'PostFeed', params: { filter: 'Lost Found' } } },
];

const EMPTY = { posts: [], resources: [], clubs: [], items: [], lost: [], people: [] };

/**
 * One box, whole campus: people (by name, branch or skill), posts, study
 * material, clubs, listings and lost & found — fetched together as you type.
 */
export default function SearchScreen({ navigation, route }) {
  const { t, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(t, isDark), [t, isDark]);
  const { user } = useAuth();
  const [q, setQ] = useState(route.params?.q || '');
  const [results, setResults] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const seq = useRef(0);

  // Debounced fetch; a stale response never overwrites a newer one.
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) { setResults(EMPTY); setLoading(false); return; }
    setLoading(true);
    const id = ++seq.current;
    const timer = setTimeout(() => {
      SearchApi.query(term)
        .then((d) => { if (id === seq.current) setResults(d); })
        .catch(() => {})
        .finally(() => { if (id === seq.current) setLoading(false); });
    }, 280);
    return () => clearTimeout(timer);
  }, [q]);

  const tabs = navigation.getParent();
  const goTab = (tab, params) => { Keyboard.dismiss(); tabs?.navigate(tab, params); };

  const openQuick = (item) => goTab(item.tab, item.to);

  const total = Object.values(results).reduce((n, arr) => n + (Array.isArray(arr) ? arr.length : 0), 0);
  const typed = q.trim().length >= 2;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        {/* As a tab root there is nothing to go back to, so the arrow only shows when pushed. */}
        {navigation.getState().index > 0 ? (
          <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Icon name="back" size={20} color={t.text} strokeWidth={2} />
          </TouchableOpacity>
        ) : null}
        <View style={styles.searchBar}>
          <Icon name="search" size={16} color={t.textMuted} strokeWidth={1.9} />
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="People, skills, posts, papers, clubs…"
            placeholderTextColor={t.textMuted}
            value={q}
            onChangeText={setQ}
            returnKeyType="search"
            autoCorrect={false}
          />
          {loading ? <ActivityIndicator size="small" color={t.primary} /> : q ? (
            <TouchableOpacity onPress={() => { setQ(''); inputRef.current?.focus(); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name="plus" size={14} color={t.textMuted} strokeWidth={2.2} style={{ transform: [{ rotate: '45deg' }] }} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        {!typed ? (
          <>
            <Text style={styles.eyebrow}>Jump to</Text>
            {QUICK.map((it) => (
              <TouchableOpacity key={it.key} style={styles.quick} activeOpacity={0.7} onPress={() => openQuick(it)}>
                <View style={styles.quickIcon}><Ionicons name={`${it.ion}-outline`} size={19} color={t.text} /></View>
                <Text style={styles.quickLabel}>{it.label}</Text>
                <Icon name="chevronRight" size={18} color={t.textFaint} strokeWidth={2} />
              </TouchableOpacity>
            ))}
            <View style={styles.tipRow}>
              <Ghost width={40} variant="happy" />
              <Text style={styles.tip}>Try a skill — “Flutter”, “UI design”, “Python” — to find people.</Text>
            </View>
          </>
        ) : !loading && total === 0 ? (
          <View style={styles.empty}>
            <Ghost width={64} variant="surprised" />
            <Text style={styles.emptyTitle}>Nothing for “{q.trim()}”</Text>
            <Text style={styles.emptySub}>Try a subject, a person's name, a skill, or a club.</Text>
          </View>
        ) : (
          <>
            {/* People */}
            {results.people?.length ? (
              <Section styles={styles} title="People" count={results.people.length}>
                {results.people.map((p, i) => {
                  const uri = imageUrl(p.avatar);
                  const me = String(p._id) === String(user?._id);
                  return (
                    <View key={p._id} style={[styles.row, i < results.people.length - 1 && styles.rowBorder]}>
                      {uri ? <Image source={{ uri }} style={styles.avatar} /> : <Avatar name={p.name} size={40} />}
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={styles.rowTitle} numberOfLines={1}>{p.name}{me ? ' (you)' : ''}</Text>
                        <Text style={styles.rowSub} numberOfLines={1}>
                          {handleOf(p.name)}{p.branch ? ` · ${p.branch}` : ''}{p.semester ? ` · Sem ${p.semester}` : ''}
                        </Text>
                        {p.skills?.length ? (
                          <View style={styles.tags}>
                            {p.skills.slice(0, 4).map((s) => (
                              <View key={s} style={[styles.tag, matches(s, q) && styles.tagHit]}>
                                <Text style={[styles.tagText, matches(s, q) && styles.tagTextHit]}>{s}</Text>
                              </View>
                            ))}
                            {p.skills.length > 4 ? <Text style={styles.more}>+{p.skills.length - 4}</Text> : null}
                          </View>
                        ) : null}
                      </View>
                      <View style={styles.score}>
                        <Ionicons name="trophy-outline" size={11} color={t.textMuted} />
                        <Text style={styles.scoreText}>{p.campusScore ?? 0}</Text>
                      </View>
                    </View>
                  );
                })}
              </Section>
            ) : null}

            {/* Posts */}
            {results.posts?.length ? (
              <Section styles={styles} title="Posts" count={results.posts.length}>
                {results.posts.map((p, i) => (
                  <TouchableOpacity
                    key={p._id}
                    style={[styles.row, i < results.posts.length - 1 && styles.rowBorder]}
                    activeOpacity={0.75}
                    onPress={() => goTab('Post', { screen: 'Thread', params: { id: p._id } })}
                  >
                    <View style={styles.glyphBox}><Ionicons name="megaphone-outline" size={19} color={t.text} /></View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.rowTitle} numberOfLines={2}>{p.title}</Text>
                      <Text style={styles.rowSub} numberOfLines={1}>
                        {handleOf(p.createdBy?.name)} · {timeAgo(p.createdAt)}
                        {p.status === 'closed' ? ' · closed' : ''}
                        {p.interestCount ? ` · ${p.interestCount} interested` : ''}
                      </Text>
                    </View>
                    <Icon name="chevronRight" size={18} color={t.textFaint} strokeWidth={2} />
                  </TouchableOpacity>
                ))}
              </Section>
            ) : null}

            {/* Study material */}
            {results.resources?.length ? (
              <Section styles={styles} title="Study material" count={results.resources.length} action="Library" onAction={() => goTab('More', { screen: 'Resources', params: { search: q.trim() } })}>
                {results.resources.map((r, i) => (
                  <View key={r._id} style={i < results.resources.length - 1 && styles.rowBorder}>
                    <ResourceRow
                      r={r}
                      styles={styles}
                      t={t}
                      mine={String(r.uploader?._id || r.uploader) === String(user?._id)}
                      onPress={() => openResource(r).catch((e) => Alert.alert('Could not open', e.message))}
                    />
                  </View>
                ))}
              </Section>
            ) : null}

            {/* Clubs */}
            {results.clubs?.length ? (
              <Section styles={styles} title="Clubs" count={results.clubs.length}>
                {results.clubs.map((c, i) => {
                  const uri = imageUrl(c.image);
                  return (
                    <TouchableOpacity
                      key={c._id}
                      style={[styles.row, i < results.clubs.length - 1 && styles.rowBorder]}
                      activeOpacity={0.75}
                      onPress={() => goTab('Club', { screen: 'ClubDetail', params: { id: c._id } })}
                    >
                      {uri ? <Image source={{ uri }} style={styles.thumb} /> : <View style={styles.glyphBox}><Ionicons name="people-circle-outline" size={20} color={t.text} /></View>}
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={styles.rowTitle} numberOfLines={1}>{c.name}</Text>
                        <Text style={styles.rowSub} numberOfLines={1}>{c.memberCount} member{c.memberCount === 1 ? '' : 's'}{c.category ? ` · ${c.category}` : ''}</Text>
                      </View>
                      <Icon name="chevronRight" size={18} color={t.textFaint} strokeWidth={2} />
                    </TouchableOpacity>
                  );
                })}
              </Section>
            ) : null}

            {/* Market */}
            {results.items?.length ? (
              <Section styles={styles} title="Marketplace" count={results.items.length}>
                {results.items.map((m, i) => {
                  const uri = imageUrl(m.image);
                  return (
                    <TouchableOpacity
                      key={m._id}
                      style={[styles.row, i < results.items.length - 1 && styles.rowBorder]}
                      activeOpacity={0.75}
                      onPress={() => goTab('Sell', { screen: 'SellDetail', params: { id: m._id } })}
                    >
                      {uri ? <Image source={{ uri }} style={styles.thumb} /> : <View style={styles.glyphBox}><Ionicons name="pricetag-outline" size={19} color={t.text} /></View>}
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={styles.rowTitle} numberOfLines={1}>{m.title}</Text>
                        <Text style={styles.rowSub} numberOfLines={1}>₹{m.price} · {handleOf(m.seller?.name)}</Text>
                      </View>
                      <Icon name="chevronRight" size={18} color={t.textFaint} strokeWidth={2} />
                    </TouchableOpacity>
                  );
                })}
              </Section>
            ) : null}

            {/* Lost & found */}
            {results.lost?.length ? (
              <Section styles={styles} title="Lost & Found" count={results.lost.length}>
                {results.lost.map((l, i) => {
                  const uri = imageUrl(l.image);
                  return (
                    <TouchableOpacity
                      key={l._id}
                      style={[styles.row, i < results.lost.length - 1 && styles.rowBorder]}
                      activeOpacity={0.75}
                      onPress={() => goTab('Post', { screen: 'LostDetail', params: { id: l._id } })}
                    >
                      {uri ? <Image source={{ uri }} style={styles.thumb} /> : <View style={styles.glyphBox}><Ionicons name="search-outline" size={19} color={t.text} /></View>}
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={styles.rowTitle} numberOfLines={1}>{l.title}</Text>
                        <Text style={styles.rowSub} numberOfLines={1}>{l.type === 'found' ? 'Found' : 'Lost'}{l.location ? ` · ${l.location}` : ''} · {timeAgo(l.createdAt)}</Text>
                      </View>
                      <Icon name="chevronRight" size={18} color={t.textFaint} strokeWidth={2} />
                    </TouchableOpacity>
                  );
                })}
              </Section>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function matches(tag, q) {
  return tag.toLowerCase().includes(q.trim().toLowerCase());
}

function Section({ styles, title, count, action, onAction, children }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionCount}>{count}</Text>
        <View style={{ flex: 1 }} />
        {action ? (
          <TouchableOpacity onPress={onAction} hitSlop={{ top: 8, bottom: 8 }}>
            <Text style={styles.sectionAction}>{action} →</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <View>{children}</View>
    </View>
  );
}

function makeStyles(t, isDark) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: t.surface },
    header: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingTop: 6, paddingBottom: 10 },
    back: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    searchBar: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
      backgroundColor: t.surfaceMuted,
      borderRadius: 999,
      paddingHorizontal: 14,
      height: 42,
    },
    input: { flex: 1, fontSize: 15, color: t.text, paddingVertical: 0 },
    list: { paddingBottom: layout.tabBarSpace + 20 },
    eyebrow: { fontSize: 13, fontWeight: '700', color: t.textMuted, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 6 },
    quick: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.border },
    quickIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: t.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
    quickLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: t.text },
    tipRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 26, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.border, marginTop: 2 },
    tip: { flex: 1, fontSize: 13, color: t.textMuted, lineHeight: 18 },
    empty: { alignItems: 'center', paddingVertical: 56, paddingHorizontal: 24 },
    emptyTitle: { fontSize: 16, fontWeight: '700', color: t.text, marginTop: 12, textAlign: 'center' },
    emptySub: { fontSize: 14, color: t.textMuted, textAlign: 'center', marginTop: 4, lineHeight: 19 },
    section: { marginTop: 6 },
    sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: t.text },
    sectionCount: { fontSize: 12.5, fontWeight: '600', color: t.textFaint },
    sectionAction: { fontSize: 13.5, fontWeight: '600', color: t.link },
    rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.border },
    rowTitle: { fontSize: 15, fontWeight: '600', color: t.text },
    rowSub: { fontSize: 13, color: t.textMuted, marginTop: 2 },
    avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: t.surfaceMuted },
    thumb: { width: 44, height: 44, borderRadius: 12, backgroundColor: t.surfaceMuted },
    glyphBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: t.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
    tags: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 5, marginTop: 6 },
    tag: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3, backgroundColor: t.surfaceMuted, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border },
    tagHit: { backgroundColor: t.text, borderColor: t.text },
    tagText: { fontSize: 11.5, fontWeight: '600', color: t.text },
    tagTextHit: { color: t.surface },
    more: { fontSize: 11, color: t.textFaint },
    score: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', marginTop: 2 },
    scoreText: { fontSize: 12, fontWeight: '700', color: t.textMuted },
    // ResourceRow shares the library's row styling; `row` is the shared one.
    ...makeResourceStyles(t, isDark),
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  });
}
