import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import { colors, spacing, font, radius, layout } from '../theme';

const ITEMS = [
  { key: 'lost', icon: 'search', label: 'Lost & Found', sub: 'Report or find lost items', to: 'LostFeed' },
  { key: 'market', icon: 'tag', label: 'Marketplace', sub: 'Buy & sell on campus', feature: { step: '03', label: 'MARKETPLACE', headerTitle: 'Marketplace', title: 'Buy & sell on campus', subtitle: 'A campus-only marketplace for second-hand books and essentials.', bullets: ['LIST', 'CHAT', 'DEAL'] } },
  { key: 'club', icon: 'hand', label: 'Clubs', sub: 'Discover & join societies', feature: { step: '04', label: 'CLUBS', headerTitle: 'Clubs', title: 'Clubs & societies', subtitle: 'Discover clubs and manage your society.', bullets: ['DISCOVER', 'JOIN', 'MANAGE'] } },
  { key: 'contest', icon: 'heart', label: 'Contests', sub: 'Branch-wise challenges', feature: { step: '05', label: 'CONTESTS', headerTitle: 'Contests', title: 'Contests & quizzes', subtitle: 'Weekly coding challenges and quizzes.', bullets: ['COMPETE', 'RANK', 'WIN'] } },
  { key: 'papers', icon: 'image', label: 'Past Papers', sub: 'Previous-year question papers', feature: { step: '08', label: 'PAST PAPERS', headerTitle: 'Past Papers', title: 'Previous-year papers', subtitle: 'A shared library of question papers by branch and semester.', bullets: ['BROWSE', 'DOWNLOAD', 'ACE'] } },
  { key: 'sos', icon: 'bell', label: 'Emergency', sub: 'Need blood or urgent help', feature: { step: '10', label: 'EMERGENCY', headerTitle: 'Emergency Help', title: 'Campus SOS', subtitle: 'Notify nearby students instantly for a fast response.', bullets: ['ALERT', 'NEARBY', 'RESPOND'] } },
];

export default function SearchScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Icon name="search" size={17} color={colors.textMuted} strokeWidth={1.8} />
          <Text style={styles.searchPlaceholder}>Search people, posts, items</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        <Text style={styles.eyebrow}>EXPLORE CAMPUS</Text>
        {ITEMS.map((it) => (
          <TouchableOpacity
            key={it.key}
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => (it.to ? navigation.navigate(it.to) : navigation.navigate('Feature', it.feature))}
          >
            <View style={styles.rowIcon}>
              <Icon name={it.icon} size={20} color={colors.text} strokeWidth={1.6} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>{it.label}</Text>
              <Text style={styles.rowSub}>{it.sub}</Text>
            </View>
            <Icon name="chevronRight" size={18} color={colors.textFaint} strokeWidth={2} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  searchPlaceholder: { fontSize: 15, color: colors.textMuted },
  list: { paddingBottom: layout.tabBarSpace },
  eyebrow: { ...font.eyebrow, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
  rowSub: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
});
