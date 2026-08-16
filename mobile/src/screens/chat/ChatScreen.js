import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '../../components/Icon';
import Doodles from '../../components/Doodles';
import { ChatApi } from '../../api/chat';
import { useAuth } from '../../context/AuthContext';
import { Loading } from '../../components/ui';
import { colors, layout } from '../../theme';

function clock(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export default function ChatScreen({ route, navigation }) {
  const { conversationId, title } = route.params;
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
      <Doodles />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m._id}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ListHeaderComponent={<View style={styles.dateWrap}><Text style={styles.date}>Today</Text></View>}
          renderItem={({ item }) => {
            const mine = String(item.sender?._id || item.sender) === String(user?._id);
            return (
              <View style={[styles.row, mine ? styles.rowMine : styles.rowTheirs]}>
                <View style={[styles.bubble, mine ? styles.bubbleOut : styles.bubbleIn]}>
                  <Text style={[styles.msg, { color: mine ? '#fff' : colors.text }]}>{item.text}</Text>
                  <Text style={[styles.time, { color: mine ? 'rgba(255,255,255,0.7)' : colors.textMuted }]}>{clock(item.createdAt)}</Text>
                </View>
              </View>
            );
          }}
        />

        <View style={styles.inputBar}>
          <View style={styles.inputPill}>
            <Icon name="attach" size={20} color={colors.textMuted} strokeWidth={1.6} />
            <TextInput style={styles.input} placeholder="Write a message..." placeholderTextColor={colors.textMuted} value={text} onChangeText={setText} multiline />
          </View>
          <TouchableOpacity style={styles.send} onPress={onSend}>
            <Icon name="send" size={20} color={colors.onPrimary} strokeWidth={1.9} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.chatBg },
  list: { padding: 14, gap: 8 },
  dateWrap: { alignItems: 'center', marginBottom: 10 },
  date: { backgroundColor: colors.datePill, color: colors.textMuted, fontSize: 12, fontWeight: '600', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, overflow: 'hidden' },
  row: { flexDirection: 'row', marginBottom: 2 },
  rowMine: { justifyContent: 'flex-end' },
  rowTheirs: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '80%', paddingHorizontal: 13, paddingTop: 9, paddingBottom: 7, flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  bubbleOut: { backgroundColor: colors.bubbleOut, borderRadius: 18, borderBottomRightRadius: 5 },
  bubbleIn: { backgroundColor: colors.bubbleIn, borderRadius: 18, borderBottomLeftRadius: 5, borderWidth: 1, borderColor: colors.border },
  msg: { fontSize: 15, lineHeight: 20, flexShrink: 1 },
  time: { fontSize: 11, paddingBottom: 1 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 12, paddingTop: 8, paddingBottom: layout.tabBarSpace, backgroundColor: colors.chatBg },
  inputPill: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surface, borderRadius: 999, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 4 },
  input: { flex: 1, fontSize: 15, color: colors.text, maxHeight: 100, paddingVertical: 9 },
  send: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
});
