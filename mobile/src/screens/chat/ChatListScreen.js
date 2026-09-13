import React, { useState, useCallback, useMemo } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '../../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Avatar from '../../components/Avatar';
import { handleOf, timeAgo } from '../../components/ThreadPost';
import { Loading, EmptyState } from '../../components/ui';
import { ChatApi } from '../../api/chat';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { layout } from '../../theme';
import AmbientGlow from '../../components/AmbientGlow';

export default function ChatListScreen({ navigation }) {
  const { t, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(t, isDark), [t, isDark]);
  const { user } = useAuth();
  const [convos, setConvos] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setConvos(await ChatApi.conversations());
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) return <Loading />;

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <AmbientGlow />
      <FlatList
        data={convos}
        keyExtractor={(c) => c._id}
        contentContainerStyle={{ paddingBottom: layout.tabBarSpace }}
        renderItem={({ item }) => {
          const other = item.participants.find((p) => String(p._id) !== String(user?._id)) || {};
          return (
            <TouchableOpacity
              style={styles.row}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Chat', { conversationId: item._id, title: other.name || 'Chat' })}
            >
              <Avatar name={other.name} size={48} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={styles.rowTop}>
                  <Text style={styles.name}>{handleOf(other.name)}</Text>
                  <Text style={styles.time}>{timeAgo(item.lastMessageAt)}</Text>
                </View>
                <Text style={styles.last} numberOfLines={1}>{item.lastMessage || 'Say hello 👋'}</Text>
                {item.event?.title ? <Text style={styles.ctx} numberOfLines={1}>re: {item.event.title}</Text> : null}
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <EmptyState title="No messages yet" subtitle="Raise your hand on a post to start a chat." />
        }
      />
    </SafeAreaView>
  );
}

function makeStyles(t, isDark) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: t.bg },
    header: { alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: t.border },
    title: { fontSize: 16, fontWeight: '700', color: t.text },
    row: { flexDirection: 'row', gap: 12, alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: t.border },
    rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    name: { fontSize: 15, fontWeight: '600', color: t.text },
    time: { fontSize: 13, color: t.textFaint },
    last: { fontSize: 14, color: t.textMuted, marginTop: 3 },
    ctx: { fontSize: 12, color: t.textFaint, marginTop: 3 },
    });
  }
