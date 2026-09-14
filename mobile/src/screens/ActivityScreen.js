import React, { useState, useCallback, useRef } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Text } from '../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../components/Avatar';
import { Ghost } from '../components/Mascot';
import { handleOf, timeAgo } from '../components/ThreadPost';
import { EventsApi } from '../api/events';
import { markActivitySeen } from '../utils/activitySeen';
import { layout } from '../theme';
import { useTheme, useStyles } from '../context/ThemeContext';

const TABS = [
  { key: 'all', label: 'All', icon: 'notifications' },
  { key: 'request', label: 'Requests', icon: 'hand-left' },
  { key: 'accepted', label: 'Accepted', icon: 'checkmark-circle' },
  { key: 'comment', label: 'Comments', icon: 'chatbubble' },
];

/** What each kind of note looks like: icon on the avatar badge and the row's accent. */
const kindFor = (colors) => ({
  request: { icon: 'hand-left', tint: colors.amber },
  accepted: { icon: 'checkmark', tint: colors.success },
  comment: { icon: 'chatbubble', tint: colors.badgeEventFg },
});

/**
 * Everything that happened to the student's posts — interest requests and
 * comments on their own posts, and the applications of theirs that got
 * accepted. Flat, edge-to-edge rows like the Home feed.
 */
export default function ActivityScreen({ navigation }) {
  const { t: colors } = useTheme();
  const styles = useStyles(makeStyles);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const seen = useRef('');

  const load = useCallback(async () => {
    try {
      const [created, applied] = await Promise.all([EventsApi.myCreated(), EventsApi.myApplications()]);
      const notes = [];
      created.forEach((ev) => {
        // People interested in my posts
        (ev.applicants || []).forEach((a) => {
          notes.push({
            id: `${ev._id}-${a._id}`,
            kind: 'request',
            name: a.user?.name,
            time: a.createdAt || ev.updatedAt,
            text: a.status === 'approved' ? 'joined your team for' : 'is interested in',
            title: ev.title,
            cta: a.status === 'pending' ? 'Review' : '',
            eventId: ev._id,
          });
        });
        // Comments under my posts
        (ev.comments || []).forEach((c) => {
          notes.push({
            id: `c-${ev._id}-${c._id}`,
            kind: 'comment',
            name: c.user?.name,
            time: c.createdAt,
            text: `commented "${c.text}" on`,
            title: ev.title,
            cta: '',
            eventId: ev._id,
          });
        });
      });
      // My accepted applications
      applied.forEach((ap) => {
        if (ap.myStatus === 'approved') {
          notes.push({
            id: `acc-${ap._id}`,
            kind: 'accepted',
            name: ap.createdBy?.name,
            time: ap.appliedAt,
            text: 'accepted you for',
            title: ap.title,
            cta: 'Say hello',
            eventId: ap._id,
          });
        }
      });
      notes.sort((a, b) => new Date(b.time) - new Date(a.time));
      const sig = notes.map((n) => `${n.id}:${n.cta}`).join('|');
      if (sig !== seen.current) {
        seen.current = sig;
        setItems(notes);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  // Opening this screen is what clears the bell badge.
  useFocusEffect(
    useCallback(() => {
      load();
      markActivitySeen();
    }, [load])
  );

  const data = tab === 'all' ? items : items.filter((i) => i.kind === tab);

  const Header = (
    <View style={styles.header}>
      <Text style={styles.title}>Activity</Text>
    </View>
  );

  const Tabs = (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs} style={styles.tabsWrap}>
      {TABS.map((t) => {
        const active = tab === t.key;
        return (
          <TouchableOpacity key={t.key} style={styles.tab} onPress={() => setTab(t.key)} activeOpacity={0.7}>
            <View style={styles.tabInner}>
              <Ionicons name={active ? t.icon : `${t.icon}-outline`} size={15} color={active ? colors.text : colors.textMuted} />
              <Text style={[styles.tabText, active && styles.tabTextOn]}>{t.label}</Text>
            </View>
            <View style={[styles.tabLine, active && styles.tabLineOn]} />
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  const Empty = (
    <View style={styles.empty}>
      <Ghost width={64} variant="surprised" />
      <Text style={styles.emptyTitle}>All quiet</Text>
      <Text style={styles.emptyText}>Interest, replies and accepted requests show up here.</Text>
    </View>
  );

  const renderItem = ({ item }) => {
    const KIND = kindFor(colors);
    const k = KIND[item.kind] || KIND.request;
    return (
      <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => navigation.navigate('Thread', { id: item.eventId })}>
        <View>
          <Avatar name={item.name} size={42} neutral />
          <View style={[styles.kindDot, { backgroundColor: k.tint }]}>
            <Ionicons name={k.icon} size={9} color={colors.onPrimary} />
          </View>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.text}>
            <Text style={styles.name}>{handleOf(item.name)}</Text> {item.text} <Text style={styles.name}>“{item.title}”</Text>
          </Text>
          <Text style={styles.time}>{timeAgo(item.time)}</Text>
        </View>
        {item.cta ? (
          <View style={styles.cta}>
            <Text style={styles.ctaText}>{item.cta}</Text>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {Header}
      {Tabs}
      <FlatList
        data={loading ? [] : data}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.hairline} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={loading ? null : Empty}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const HAIRLINE = StyleSheet.hairlineWidth;

const makeStyles = (colors, isDark) => {
  return StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: { height: 48, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  title: { fontSize: 22, fontWeight: '700', color: colors.text },

  tabsWrap: { flexGrow: 0, borderBottomWidth: HAIRLINE, borderBottomColor: colors.border },
  tabs: { paddingHorizontal: 8 },
  tab: { paddingHorizontal: 12, paddingTop: 10 },
  tabInner: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingBottom: 10 },
  tabText: { fontSize: 15, fontWeight: '600', color: colors.textMuted },
  tabTextOn: { color: colors.text, fontWeight: '700' },
  tabLine: { height: 2, borderRadius: 1, backgroundColor: 'transparent' },
  tabLineOn: { backgroundColor: colors.text },

  list: { paddingBottom: layout.tabBarSpace + 16, flexGrow: 1 },
  hairline: { height: HAIRLINE, backgroundColor: colors.border },

  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  kindDot: { position: 'absolute', right: -3, bottom: -3, width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 14.5, lineHeight: 20, color: colors.textMuted },
  name: { fontWeight: '700', color: colors.text },
  time: { fontSize: 12.5, color: colors.textFaint, marginTop: 3 },
  cta: { borderRadius: 999, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 7 },
  ctaText: { fontSize: 13, fontWeight: '700', color: colors.text },

  empty: { alignItems: 'center', paddingVertical: 56, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 12 },
  emptyText: { fontSize: 14, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
});
};
