import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../../components/Icon';
import { ChatApi } from '../../api/chat';
import { useAuth } from '../../context/AuthContext';
import { Loading } from '../../components/ui';
import { useTheme } from '../../context/ThemeContext';
import { useKeyboardHeight } from '../../hooks/useKeyboardOpen';

function clock(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export default function ChatScreen({ route, navigation }) {
  const { t, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(t, isDark), [t, isDark]);
  const keyboardHeight = useKeyboardHeight();
  const { conversationId, title } = route.params;
  const keyboardOpen = keyboardHeight > 0;
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

  useEffect(() => { if (title) navigation.setOptions({ title }); }, [navigation, title]);

  const fetchMessages = useCallback(async (spin) => {
    try { setMessages(await ChatApi.messages(conversationId)); } catch {} finally { if (spin) setLoading(false); }
  }, [conversationId]);

  useEffect(() => {
    fetchMessages(true);
    const t = setInterval(() => fetchMessages(false), 3000);
    return () => clearInterval(t);
  }, [fetchMessages]);

  async function onSend() {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setText('');
    try { const msg = await ChatApi.send(conversationId, body); setMessages((p) => [...p, msg]); }
    catch { setText(body); } finally { setSending(false); }
  }

  if (loading) return <Loading />;

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <View style={{ flex: 1, paddingBottom: keyboardHeight }}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m._id}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ListHeaderComponent={
            messages.length ? (
              <View style={styles.dateWrap}>
                <Text style={styles.date}>Today</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.blank}>
              <Text style={styles.blankText}>Say hello to get things moving.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const mine = String(item.sender?._id || item.sender) === String(user?._id);
            return (
              <View style={[styles.row, mine ? styles.rowMine : styles.rowTheirs]}>
                <View style={[styles.bubble, mine ? styles.bubbleOut : styles.bubbleIn]}>
                  <Text style={[styles.msg, { color: mine ? t.onPrimary : t.text }]}>{item.text}</Text>
                  <Text style={[styles.time, { color: mine ? (isDark ? 'rgba(18,23,26,0.55)' : 'rgba(255,255,255,0.7)') : t.textMuted }]}>{clock(item.createdAt)}</Text>
                </View>
              </View>
            );
          }}
        />

        <View style={[styles.inputBar, { paddingBottom: keyboardOpen ? 10 : Math.max(insets.bottom, 10) }]}>
          <View style={styles.inputPill}>
            <Icon name="attach" size={20} color={t.textMuted} strokeWidth={1.6} />
            <TextInput style={styles.input} placeholder="Write a message..." placeholderTextColor={t.textMuted} value={text} onChangeText={setText} multiline />
          </View>
          <TouchableOpacity style={styles.send} onPress={onSend}>
            <Icon name="send" size={20} color={t.onPrimary} strokeWidth={1.9} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(t, isDark) {
  return StyleSheet.create({
    // A tinted canvas is what makes white bubbles read as a conversation
    // rather than as plain paragraphs on the page.
    safe: { flex: 1, backgroundColor: isDark ? '#0C1012' : t.field },
    list: { padding: 14, paddingBottom: 6, gap: 6, flexGrow: 1 },

    dateWrap: { alignItems: 'center', marginBottom: 12 },
    date: {
      backgroundColor: isDark ? t.surfaceHi : t.surface,
      color: t.textMuted,
      fontSize: 11,
      fontWeight: '600',
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 999,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: t.borderSoft,
    },

    blank: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
    blankText: { fontSize: 13, color: t.textMuted },

    row: { flexDirection: 'row', marginBottom: 2 },
    rowMine: { justifyContent: 'flex-end' },
    rowTheirs: { justifyContent: 'flex-start' },
    bubble: {
      maxWidth: '78%',
      paddingHorizontal: 13,
      paddingTop: 9,
      paddingBottom: 7,
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 8,
    },
    bubbleOut: { backgroundColor: t.primary, borderRadius: 18, borderBottomRightRadius: 6 },
    bubbleIn: {
      backgroundColor: t.surface,
      borderRadius: 18,
      borderBottomLeftRadius: 6,
      borderWidth: 1,
      borderColor: t.borderSoft,
    },
    msg: { fontSize: 14.5, lineHeight: 20, flexShrink: 1 },
    time: { fontSize: 10.5, paddingBottom: 2 },

    inputBar: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 10,
      paddingHorizontal: 12,
      paddingTop: 10,
      backgroundColor: isDark ? '#0C1012' : t.field,
      borderTopWidth: 1,
      borderTopColor: t.hairline,
    },
    inputPill: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: t.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: t.borderSoft,
      paddingHorizontal: 14,
      paddingVertical: 4,
    },
    input: { flex: 1, fontSize: 15, color: t.text, maxHeight: 110, paddingVertical: 9 },
    send: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: t.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
