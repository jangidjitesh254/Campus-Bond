import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Text } from '../../components/Text';
import { VideoView, useVideoPlayer } from 'expo-video';
import Icon from '../../components/Icon';
import { Loading } from '../../components/ui';
import { useTheme } from '../../context/ThemeContext';
import { CampusApi, campusAsset, DEFAULT_CAMPUS } from '../../api/campus';
import { layout } from '../../theme';

/**
 * The real campus, on foot: short clips recorded around campus, listed under
 * the 3D map so a fresher can see what a route actually looks like.
 */
export default function WalkthroughScreen({ route }) {
  const { t, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(t, isDark), [t, isDark]);
  const campusId = route.params?.campus || DEFAULT_CAMPUS;
  const [videos, setVideos] = useState(null);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    CampusApi.layout(campusId).then((d) => setVideos(d.videos || [])).catch(() => setVideos([]));
  }, [campusId]);

  const clip = videos?.[current];
  const player = useVideoPlayer(clip ? campusAsset(clip.file, campusId) : null, (p) => {
    p.loop = true;
    p.play();
  });

  if (!videos) return <Loading />;

  return (
    <View style={styles.safe}>
      <View style={styles.playerWrap}>
        {clip ? <VideoView player={player} style={styles.player} contentFit="contain" nativeControls fullscreenOptions={{ enable: true }} /> : null}
      </View>
      <ScrollView contentContainerStyle={styles.list}>
        <Text style={styles.eyebrow}>Clips</Text>
        {videos.length === 0 ? <Text style={styles.empty}>No walkthrough clips for this campus yet.</Text> : null}
        {videos.map((v, i) => {
          const on = i === current;
          return (
            <TouchableOpacity key={v.id} style={[styles.row, on && styles.rowOn]} onPress={() => setCurrent(i)} activeOpacity={0.8}>
              <View style={[styles.playIcon, on && styles.playIconOn]}>
                <Icon name={on ? 'pause' : 'play'} size={15} color={on ? t.onPrimary : t.text} strokeWidth={1.9} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{v.title}</Text>
                {v.seconds ? <Text style={styles.sub}>{v.seconds}s</Text> : null}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

function makeStyles(t, isDark) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: t.bg },
    playerWrap: { backgroundColor: '#000', aspectRatio: 9 / 12, maxHeight: 460, width: '100%' },
    player: { flex: 1 },
    list: { padding: 14, paddingBottom: layout.tabBarSpace + 16 },
    eyebrow: { fontSize: 13, fontWeight: '700', color: t.textMuted, marginBottom: 8, marginLeft: 4 },
    empty: { fontSize: 13.5, color: t.textMuted, padding: 12 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, marginBottom: 8 },
    rowOn: { borderColor: t.primary },
    playIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: t.primarySoft, alignItems: 'center', justifyContent: 'center' },
    playIconOn: { backgroundColor: t.primary },
    title: { fontSize: 14.5, fontWeight: '600', color: t.text },
    sub: { fontSize: 12, color: t.textMuted, marginTop: 2 },
  });
}
