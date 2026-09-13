import React, { useState, useCallback, useMemo, useLayoutEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { Text, TextInput } from '../../components/Text';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Icon from '../../components/Icon';
import { EmptyState, Loading } from '../../components/ui';
import { handleOf, timeAgo } from '../../components/ThreadPost';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ResourcesApi, RESOURCE_KINDS, openResource, formatSize } from '../../api/resources';
import { layout, monoFamily } from '../../theme';
import AmbientGlow from '../../components/AmbientGlow';

const FILTERS = [{ key: 'all', label: 'All' }, ...RESOURCE_KINDS.filter((k) => k.key !== 'other').map((k) => ({ key: k.key, label: k.label + 's' }))];

/** Icon + tint for a file, by what it is. */
export function fileGlyph(r, t) {
  if (/^image\//.test(r.mime || '')) return { ion: 'image', color: t.avatarText, bg: t.avatarBg };
  if (/pdf/.test(r.mime || '')) return { ion: 'document-text', color: t.accent, bg: t.accentSoft };
  if (/presentation|powerpoint/.test(r.mime || '')) return { ion: 'easel', color: t.amber, bg: t.amberSoft };
  if (/word|msword/.test(r.mime || '')) return { ion: 'document', color: t.success, bg: t.successSoft };
  return { ion: 'document-outline', color: t.text, bg: t.primarySoft };
}

export function resourceMeta(r) {
  return [r.subject, r.semester ? `Sem ${r.semester}` : null, r.branch || null, r.year || null].filter(Boolean).join(' · ');
}

/** One row of the library — also used by search results. */
export function ResourceRow({ r, onPress, onLongPress, styles, t, mine }) {
  const g = fileGlyph(r, t);
  const kind = RESOURCE_KINDS.find((k) => k.key === r.kind);
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} onLongPress={onLongPress} delayLongPress={350} activeOpacity={0.8}>
      <View style={[styles.glyph, { backgroundColor: g.bg }]}>
        <Ionicons name={g.ion} size={22} color={g.color} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={styles.titleRow}>
          <Text style={styles.kindTag}>{kind?.short || 'FILE'}</Text>
          {mine ? <Text style={styles.mineTag}>YOURS</Text> : null}
        </View>
        <Text style={styles.title} numberOfLines={2}>{r.title}</Text>
        <Text style={styles.meta} numberOfLines={1}>{resourceMeta(r)}</Text>
        <Text style={styles.foot} numberOfLines={1}>
          {handleOf(r.uploader?.name)} · {timeAgo(r.createdAt)}
          {r.downloads ? ` · ${r.downloads} download${r.downloads === 1 ? '' : 's'}` : ''}
          {r.size ? ` · ${formatSize(r.size)}` : ''}
        </Text>
      </View>
      <Ionicons name="open-outline" size={18} color={t.textFaint} />
    </TouchableOpacity>
  );
}

export default function ResourcesScreen({ navigation, route }) {
  const { t, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(t, isDark), [t, isDark]);
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState(route.params?.kind || 'all');
  const [query, setQuery] = useState(route.params?.search || '');
  const [mineOnly, setMineOnly] = useState(false);
  // "For me" narrows to the student's own branch + semester, when known.
  const [forMe, setForMe] = useState(false);
  const canForMe = !!(user?.branch || user?.semester);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('CreateResource')} activeOpacity={0.8}>
          <Icon name="plus" size={16} color={t.onPrimary} strokeWidth={2.2} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, styles, t]);

  const load = useCallback(async () => {
    try {
      const params = { limit: 50 };
      if (filter !== 'all') params.kind = filter;
      if (query.trim()) params.search = query.trim();
      if (forMe) {
        if (user?.branch) params.branch = user.branch;
        if (user?.semester) params.semester = user.semester;
      }
      const data = mineOnly ? { resources: await ResourcesApi.myUploads() } : await ResourcesApi.list(params);
      setItems(data.resources || []);
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter, query, forMe, mineOnly, user?.branch, user?.semester]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  function onLongPress(r) {
    if (String(r.uploader?._id || r.uploader) !== String(user?._id)) return;
    Alert.alert(r.title, 'Remove this file from the library?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => ResourcesApi.remove(r._id).then(load).catch((e) => Alert.alert('Could not delete', e.message)),
      },
    ]);
  }

  const shown = mineOnly
    ? items.filter((r) => (filter === 'all' || r.kind === filter) && (!query.trim() || `${r.title} ${r.subject}`.toLowerCase().includes(query.trim().toLowerCase())))
    : items;

  return (
    <View style={styles.safe}>
      <AmbientGlow />
      <View style={styles.search}>
        <Icon name="search" size={15} color={t.textMuted} strokeWidth={1.9} />
        <TextInput
          style={styles.searchInput}
          placeholder="Subject, paper, topic…"
          placeholderTextColor={t.textMuted}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          autoCorrect={false}
        />
        {query ? (
          <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Icon name="plus" size={14} color={t.textMuted} strokeWidth={2.2} style={{ transform: [{ rotate: '45deg' }] }} />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.chips}>
        {FILTERS.map((f) => {
          const on = filter === f.key;
          return (
            <TouchableOpacity key={f.key} style={[styles.chip, on && styles.chipOn]} onPress={() => setFilter(f.key)} activeOpacity={0.85}>
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
        {canForMe ? (
          <TouchableOpacity style={[styles.chip, styles.chipAccent, forMe && styles.chipAccentOn]} onPress={() => setForMe((v) => !v)} activeOpacity={0.85}>
            <Text style={[styles.chipText, forMe ? styles.chipTextOn : { color: t.accent }]}>
              {[user?.branch, user?.semester ? `Sem ${user.semester}` : null].filter(Boolean).join(' · ')}
            </Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity style={[styles.chip, mineOnly && styles.chipOn]} onPress={() => setMineOnly((v) => !v)} activeOpacity={0.85}>
          <Text style={[styles.chipText, mineOnly && styles.chipTextOn]}>My uploads</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <Loading />
      ) : (
        <FlatList
          data={shown}
          keyExtractor={(r) => r._id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={t.primary} />}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          renderItem={({ item }) => (
            <ResourceRow
              r={item}
              styles={styles}
              t={t}
              mine={String(item.uploader?._id || item.uploader) === String(user?._id)}
              onPress={() => openResource(item).catch((e) => Alert.alert('Could not open', e.message))}
              onLongPress={() => onLongPress(item)}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              title={mineOnly ? 'You have not shared anything yet' : 'Nothing here yet'}
              subtitle={mineOnly ? 'Upload a past paper or your notes — every upload earns Campus Score.' : 'Be the first: tap + to share a past paper or notes for this subject.'}
            />
          }
          ListFooterComponent={shown.length ? <Text style={styles.footHint}>HOLD ONE OF YOURS TO DELETE IT</Text> : null}
        />
      )}
    </View>
  );
}

export function makeResourceStyles(t, isDark) {
  return {
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 13, backgroundColor: t.surface },
    glyph: { width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
    kindTag: { fontFamily: monoFamily, fontSize: 8.5, fontWeight: '700', letterSpacing: 1, color: t.accent },
    mineTag: { fontFamily: monoFamily, fontSize: 8.5, fontWeight: '700', letterSpacing: 1, color: t.textFaint },
    title: { fontSize: 14.5, fontWeight: '700', color: t.text, lineHeight: 19 },
    meta: { fontSize: 12.5, color: t.textMuted, marginTop: 2 },
    foot: { fontSize: 11.5, color: t.textFaint, marginTop: 4 },
    sep: { height: 1, backgroundColor: t.hairline, marginLeft: 74 },
  };
}

function makeStyles(t, isDark) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: t.bg },
    headerBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: t.primary, alignItems: 'center', justifyContent: 'center' },
    search: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
      marginHorizontal: 16,
      marginTop: 6,
      backgroundColor: t.field,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: t.borderSoft,
      paddingHorizontal: 14,
      height: 42,
    },
    searchInput: { flex: 1, fontSize: 14.5, color: t.text, paddingVertical: 0 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10 },
    chip: { borderRadius: 999, paddingVertical: 7, paddingHorizontal: 12, backgroundColor: t.surface, borderWidth: 1, borderColor: t.borderSoft },
    chipOn: { backgroundColor: t.primary, borderColor: t.primary },
    chipAccent: { borderColor: t.accent, backgroundColor: t.accentSoft },
    chipAccentOn: { backgroundColor: t.accent },
    chipText: { fontSize: 12, fontWeight: '600', color: t.textMuted },
    chipTextOn: { color: t.onPrimary },
    list: { paddingBottom: layout.tabBarSpace + 16 },
    footHint: { fontFamily: monoFamily, fontSize: 9, letterSpacing: 1, color: t.textFaint, textAlign: 'center', paddingVertical: 18 },
    ...makeResourceStyles(t, isDark),
  });
}
