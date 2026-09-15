import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Image, Modal, FlatList, Pressable, ActivityIndicator, useWindowDimensions, Keyboard, Platform } from 'react-native';
import { Text, TextInput } from '../../components/Text';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import Icon from '../../components/Icon';
import { useTheme } from '../../context/ThemeContext';
import { CampusApi, campusUrl, campusThumb, campusPhoto, CATEGORY_ION, walkMinutes, DEFAULT_CAMPUS } from '../../api/campus';
import { ScoreApi } from '../../api/score';
import { shadow } from '../../theme';

const START_DEFAULT = 'main-gate';

/**
 * 3D campus map. The scene itself is a three.js page served by the API
 * (public/campus/<id>/) inside a WebView; this screen owns everything native
 * around it — search, the place card, directions and the photo viewer — and
 * talks to the scene with postMessage.
 */
export default function CampusMapScreen({ navigation, route }) {
  const { t, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(t, isDark), [t, isDark]);
  const insets = useSafeAreaInsets();
  const campusId = route.params?.campus || DEFAULT_CAMPUS;
  const web = useRef(null);

  const [data, setData] = useState(null); // campus.json
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null); // place id
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(null);
  const [listOpen, setListOpen] = useState(false);
  const [pickStart, setPickStart] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null); // { from, to, metres }
  const [photos, setPhotos] = useState(null); // [names] open in the viewer
  const [reloadKey, setReloadKey] = useState(0);
  const [score, setScore] = useState(null);

  useEffect(() => {
    CampusApi.layout(campusId).then(setData).catch((e) => setError(e.message));
    ScoreApi.me().then((s) => setScore(s.total)).catch(() => setScore(0));
  }, [campusId, reloadKey]);

  // The scene repaints itself when the app theme flips.
  useEffect(() => { post({ type: 'theme', dark: isDark }); }, [isDark]); // eslint-disable-line react-hooks/exhaustive-deps

  // Opened with a target (e.g. from search or an event venue)?
  useEffect(() => {
    if (ready && route.params?.focus) focus(route.params.focus);
  }, [ready, route.params?.focus]); // eslint-disable-line react-hooks/exhaustive-deps

  function post(msg) {
    web.current?.postMessage(JSON.stringify(msg));
  }

  const places = data?.places || [];
  const byId = useCallback((id) => places.find((p) => p.id === id), [places]);
  const place = selected ? byId(selected) : null;

  function onMessage(e) {
    let msg;
    try { msg = JSON.parse(e.nativeEvent.data); } catch { return; }
    if (msg.type === 'ready') setReady(true);
    else if (msg.type === 'select') { setSelected(msg.id); if (msg.id) setRouteInfo(null); }
    else if (msg.type === 'route') setRouteInfo(msg.metres ? msg : null);
    else if (msg.type === 'error') setError(msg.message);
  }

  function focus(id) {
    setSelected(id);
    setRouteInfo(null);
    setListOpen(false);
    setQuery('');
    setCategory(null);
    Keyboard.dismiss();
    post({ type: 'focus', id });
  }

  function directions(fromId) {
    setPickStart(false);
    if (!selected) return;
    post({ type: 'route', from: fromId, to: selected });
  }

  function clearRoute() {
    setRouteInfo(null);
    post({ type: 'clearRoute' });
  }

  function reset() {
    setSelected(null);
    setRouteInfo(null);
    post({ type: 'reset' });
  }

  // Search + category filter over the layout, shown as a list over the map.
  const q = query.trim().toLowerCase();
  const filtered = places.filter((p) => (!category || p.category === category) && (!q || `${p.name} ${p.desc || ''} ${p.category}`.toLowerCase().includes(q)));
  const showList = listOpen || q.length > 0 || !!category;
  const catLabel = (key) => data?.categories?.find((c) => c.key === key)?.label || key;

  const uri = `${campusUrl(campusId)}?dark=${isDark ? 1 : 0}&v=${reloadKey}`;
  const bottomPad = insets.bottom + 12; // no tab bar on the map — sit just above the home indicator

  return (
    <View style={styles.safe}>
      {/* The scene */}
      <WebView
        key={reloadKey}
        ref={web}
        source={{ uri }}
        style={styles.web}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        setSupportMultipleWindows={false}
        allowsInlineMediaPlayback
        mixedContentMode="always"
        onMessage={onMessage}
        onError={(e) => setError(e.nativeEvent?.description || 'Could not load the map.')}
        onHttpError={(e) => setError(`Map not found on the server (HTTP ${e.nativeEvent?.statusCode}).`)}
      />

      {!ready && !error ? (
        <View style={[StyleSheet.absoluteFill, styles.loading]} pointerEvents="none">
          <ActivityIndicator size="large" color={t.primary} />
          <Text style={styles.loadingText}>Building the campus…</Text>
        </View>
      ) : null}

      {error ? (
        <View style={[StyleSheet.absoluteFill, styles.loading]}>
          <Ionicons name="map-outline" size={34} color={t.textMuted} />
          <Text style={styles.errTitle}>The map could not load</Text>
          <Text style={styles.errSub}>{error}</Text>
          <TouchableOpacity style={styles.retry} onPress={() => { setError(''); setReady(false); setReloadKey((k) => k + 1); }}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Header: title, search, chips */}
      <SafeAreaView edges={['top']} style={styles.top} pointerEvents="box-none">
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.roundBtn} onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Icon name="back" size={18} color={t.text} strokeWidth={2} />
          </TouchableOpacity>
          <View style={styles.searchBar}>
            <Icon name="search" size={15} color={t.textMuted} strokeWidth={1.9} />
            <TextInput
              style={styles.searchInput}
              placeholder={`Find a place in ${data?.short || 'campus'}`}
              placeholderTextColor={t.textMuted}
              value={query}
              onChangeText={setQuery}
              onFocus={() => setListOpen(true)}
              returnKeyType="search"
              autoCorrect={false}
            />
            {query ? (
              <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Icon name="plus" size={14} color={t.textMuted} strokeWidth={2.2} style={{ transform: [{ rotate: '45deg' }] }} />
              </TouchableOpacity>
            ) : null}
          </View>
          <TouchableOpacity style={styles.roundBtn} onPress={() => setListOpen((v) => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Icon name="list" size={18} color={t.text} strokeWidth={showList ? 2.4 : 1.9} />
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} keyboardShouldPersistTaps="handled">
          {(data?.categories || []).map((c) => {
            const on = category === c.key;
            return (
              <TouchableOpacity key={c.key} style={[styles.chip, on && styles.chipOn]} onPress={() => setCategory(on ? null : c.key)} activeOpacity={0.85}>
                <Ionicons name={CATEGORY_ION[c.key] || 'location-outline'} size={13} color={on ? t.onPrimary : t.textMuted} />
                <Text style={[styles.chipText, on && styles.chipTextOn]}>{c.label}</Text>
              </TouchableOpacity>
            );
          })}
          {data?.videos?.length ? (
            <TouchableOpacity style={styles.chip} onPress={() => navigation.navigate('Walkthrough', { campus: campusId })} activeOpacity={0.85}>
              <Ionicons name="play" size={12} color={t.text} />
              <Text style={[styles.chipText, { color: t.text }]}>Campus walks</Text>
            </TouchableOpacity>
          ) : null}
          {/* Your Campus Score, one tap from the map */}
          <TouchableOpacity style={styles.chip} onPress={() => navigation.getParent()?.navigate('More', { screen: 'CampusScore' })} activeOpacity={0.85}>
            <Ionicons name="trophy-outline" size={12} color={t.text} />
            <Text style={[styles.chipText, { color: t.text }]}>{score == null ? '…' : `${score} pts`}</Text>
          </TouchableOpacity>
        </ScrollView>

        {showList ? (
          <View style={styles.listPanel}>
            <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 320 }}>
              {filtered.length === 0 ? (
                <Text style={styles.listEmpty}>Nothing matches “{query}”.</Text>
              ) : (
                filtered.map((p, i) => (
                  <TouchableOpacity key={p.id} style={[styles.listRow, i < filtered.length - 1 && styles.listRowBorder]} onPress={() => focus(p.id)} activeOpacity={0.75}>
                    <View style={styles.listIcon}><Ionicons name={CATEGORY_ION[p.category] || 'location-outline'} size={17} color={t.primary} /></View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.listName} numberOfLines={1}>{p.name}</Text>
                      <Text style={styles.listSub} numberOfLines={1}>{catLabel(p.category)}{p.floors ? ` · ${p.floors} floors` : ''}{p.approx ? ' · location approx.' : ''}</Text>
                    </View>
                    <Icon name="chevronRight" size={16} color={t.textFaint} strokeWidth={2} />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
            <TouchableOpacity style={styles.listClose} onPress={() => { setListOpen(false); setQuery(''); setCategory(null); Keyboard.dismiss(); }}>
              <Text style={styles.listCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </SafeAreaView>

      {/* Reset view */}
      {ready && !showList ? (
        <TouchableOpacity style={[styles.fab, { bottom: bottomPad + (place || routeInfo ? 212 : 12) }]} onPress={reset} activeOpacity={0.85}>
          <Icon name="compass" size={19} color={t.text} strokeWidth={1.8} />
        </TouchableOpacity>
      ) : null}

      {/* Route banner */}
      {routeInfo ? (
        <View style={[styles.card, { bottom: bottomPad }]}>
          <View style={styles.routeRow}>
            <View style={styles.routeDot} />
            <Text style={styles.routeText} numberOfLines={1}>{byId(routeInfo.from)?.name}</Text>
          </View>
          <View style={styles.routeRow}>
            <View style={[styles.routeDot, { backgroundColor: t.primary }]} />
            <Text style={[styles.routeText, { fontWeight: '700' }]} numberOfLines={1}>{byId(routeInfo.to)?.name}</Text>
          </View>
          <View style={styles.routeMeta}>
            <Text style={styles.routeStat}>{routeInfo.metres} m</Text>
            <Text style={styles.routeStatSep}>·</Text>
            <Text style={styles.routeStat}>~{walkMinutes(routeInfo.metres)} min walk</Text>
            <View style={{ flex: 1 }} />
            <TouchableOpacity style={styles.smallBtn} onPress={() => setPickStart(true)}><Text style={styles.smallBtnText}>Change start</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.smallBtn, styles.smallBtnInk]} onPress={clearRoute}><Text style={[styles.smallBtnText, { color: t.onPrimary }]}>Done</Text></TouchableOpacity>
          </View>
        </View>
      ) : place ? (
        /* Place card */
        <View style={[styles.card, { bottom: bottomPad }]}>
          {place.photos?.length ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbs}>
              {place.photos.map((name, i) => (
                <TouchableOpacity key={name} onPress={() => setPhotos({ names: place.photos, index: i })} activeOpacity={0.9}>
                  <Image source={{ uri: campusThumb(name, campusId) }} style={styles.thumb} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : null}
          <View style={styles.cardBody}>
            <View style={styles.cardTitleRow}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.cardEyebrow}>{catLabel(place.category).toUpperCase()}{place.floors ? ` · ${place.floors} FLOORS` : ''}{place.approx ? ' · LOCATION APPROX.' : ''}</Text>
                <Text style={styles.cardTitle} numberOfLines={2}>{place.name}</Text>
              </View>
              <TouchableOpacity onPress={() => { setSelected(null); post({ type: 'focus', id: null }); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.cardClose}>
                <Icon name="plus" size={16} color={t.textMuted} strokeWidth={2.2} style={{ transform: [{ rotate: '45deg' }] }} />
              </TouchableOpacity>
            </View>
            {place.desc ? <Text style={styles.cardDesc} numberOfLines={3}>{place.desc}</Text> : null}
            <View style={styles.cardActions}>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => setPickStart(true)} activeOpacity={0.85}>
                <Icon name="plane" size={15} color={t.onPrimary} strokeWidth={2} />
                <Text style={styles.primaryBtnText}>Directions</Text>
              </TouchableOpacity>
              {place.photos?.length ? (
                <TouchableOpacity style={styles.secondaryBtn} onPress={() => setPhotos({ names: place.photos, index: 0 })} activeOpacity={0.85}>
                  <Icon name="image" size={15} color={t.text} strokeWidth={1.8} />
                  <Text style={styles.secondaryBtnText}>{place.photos.length} photo{place.photos.length === 1 ? '' : 's'}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </View>
      ) : null}

      {/* Start picker */}
      <Modal visible={pickStart} transparent animationType="fade" onRequestClose={() => setPickStart(false)}>
        <Pressable style={styles.backdrop} onPress={() => setPickStart(false)} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
          <Text style={styles.sheetTitle}>Start from</Text>
          <Text style={styles.sheetSub}>Where are you walking from to {place?.name}?</Text>
          <ScrollView style={{ maxHeight: 340 }}>
            {[byId(START_DEFAULT), ...places.filter((p) => p.id !== START_DEFAULT)].filter((p) => p && p.id !== selected).map((p, i, arr) => (
              <TouchableOpacity key={p.id} style={[styles.listRow, i < arr.length - 1 && styles.listRowBorder]} onPress={() => directions(p.id)} activeOpacity={0.75}>
                <View style={styles.listIcon}><Ionicons name={p.id === START_DEFAULT ? 'flag-outline' : CATEGORY_ION[p.category] || 'location-outline'} size={17} color={t.primary} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listName}>{p.name}</Text>
                  {p.id === START_DEFAULT ? <Text style={styles.listSub}>Most visitors start here</Text> : null}
                </View>
                <Icon name="chevronRight" size={16} color={t.textFaint} strokeWidth={2} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      <PhotoViewer photos={photos} onClose={() => setPhotos(null)} campusId={campusId} styles={styles} t={t} />
    </View>
  );
}

/** Full-screen, swipeable photos of a place. */
function PhotoViewer({ photos, onClose, campusId, styles, t }) {
  const { width, height } = useWindowDimensions();
  const [index, setIndex] = useState(photos?.index || 0);
  useEffect(() => { setIndex(photos?.index || 0); }, [photos]);
  if (!photos) return null;
  return (
    <Modal visible transparent={false} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.viewer}>
        <FlatList
          data={photos.names}
          keyExtractor={(n) => n}
          horizontal
          pagingEnabled
          initialScrollIndex={photos.index || 0}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <Image source={{ uri: campusPhoto(item, campusId) }} style={{ width, height }} resizeMode="contain" />
          )}
        />
        <SafeAreaView edges={['top']} style={styles.viewerTop} pointerEvents="box-none">
          <TouchableOpacity style={styles.viewerClose} onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Icon name="plus" size={18} color="#fff" strokeWidth={2.2} style={{ transform: [{ rotate: '45deg' }] }} />
          </TouchableOpacity>
          <Text style={styles.viewerCount}>{index + 1} / {photos.names.length}</Text>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function makeStyles(t, isDark) {
  // Android draws elevation as a dark rim around rounded/clipped views, which
  // read as borders over the scene - so the map chrome only casts shadows on iOS.
  const soft = Platform.OS === 'ios' ? shadow.soft : null;
  const card = Platform.OS === 'ios' ? shadow.card : null;
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: t.bg },
    web: { flex: 1, backgroundColor: isDark ? '#0B0B0B' : '#E9EAE9' },
    loading: { alignItems: 'center', justifyContent: 'center', backgroundColor: t.bg, padding: 30 },
    loadingText: { fontSize: 13, fontWeight: '600', color: t.textMuted, marginTop: 14 },
    errTitle: { fontSize: 16, fontWeight: '700', color: t.text, marginTop: 12 },
    errSub: { fontSize: 13, color: t.textMuted, textAlign: 'center', marginTop: 6, lineHeight: 18 },
    retry: { marginTop: 16, borderRadius: 999, backgroundColor: t.primary, paddingHorizontal: 18, paddingVertical: 10 },
    retryText: { color: t.onPrimary, fontWeight: '700', fontSize: 13 },

    top: { position: 'absolute', left: 0, right: 0, top: 0 },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingTop: 6 },
    // Solid pills like Home's search bar — no borders, a whisper of shadow so they read over the scene.
    roundBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: t.surface, alignItems: 'center', justifyContent: 'center', ...soft },
    searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, height: 40, borderRadius: 999, backgroundColor: t.surface, paddingHorizontal: 14, ...soft },
    searchInput: { flex: 1, fontSize: 15, color: t.text, paddingVertical: 0 },
    chips: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 6 },
    chip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, paddingVertical: 7, paddingHorizontal: 12, backgroundColor: t.surface, ...soft },
    chipOn: { backgroundColor: t.text },
    chipAccent: {},
    chipText: { fontSize: 12.5, fontWeight: '600', color: t.textMuted },
    chipTextOn: { color: t.surface },

    listPanel: { marginHorizontal: 12, marginTop: 4, backgroundColor: t.surface, borderRadius: 18, borderWidth: 1, borderColor: t.border, overflow: 'hidden', ...card },
    listRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 11 },
    listRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.border },
    listIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: t.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
    listName: { fontSize: 15, fontWeight: '600', color: t.text },
    listSub: { fontSize: 12.5, color: t.textMuted, marginTop: 2 },
    listEmpty: { fontSize: 13, color: t.textMuted, padding: 16 },
    listClose: { alignItems: 'center', paddingVertical: 11, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.border, backgroundColor: t.surfaceMuted },
    listCloseText: { fontSize: 13, fontWeight: '700', color: t.text },

    fab: { position: 'absolute', right: 14, width: 44, height: 44, borderRadius: 22, backgroundColor: t.surface, alignItems: 'center', justifyContent: 'center', ...card },

    card: { position: 'absolute', left: 12, right: 12, backgroundColor: t.surface, borderRadius: 18, borderWidth: 1, borderColor: t.border, overflow: 'hidden', ...card },
    thumbs: { gap: 6, paddingHorizontal: 12, paddingTop: 12 },
    thumb: { width: 96, height: 68, borderRadius: 10, backgroundColor: t.surfaceMuted },
    cardBody: { padding: 14 },
    cardTitleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
    cardEyebrow: { fontSize: 12, fontWeight: '600', color: t.textMuted },
    cardTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3, color: t.text, marginTop: 2 },
    cardClose: { width: 28, height: 28, borderRadius: 14, backgroundColor: t.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
    cardDesc: { fontSize: 13.5, color: t.textMuted, lineHeight: 19, marginTop: 6 },
    cardActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
    primaryBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, height: 42, borderRadius: 999, backgroundColor: t.primary },
    primaryBtnText: { color: t.onPrimary, fontWeight: '700', fontSize: 13.5 },
    secondaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, height: 42, paddingHorizontal: 16, borderRadius: 999, backgroundColor: t.surfaceMuted },
    secondaryBtnText: { color: t.text, fontWeight: '700', fontSize: 13 },

    routeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingTop: 10 },
    routeDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: t.ink },
    routeText: { flex: 1, fontSize: 14.5, color: t.text },
    routeMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 12, marginTop: 6, backgroundColor: t.surfaceMuted, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.border },
    routeStat: { fontSize: 12.5, fontWeight: '700', color: t.text },
    routeStatSep: { color: t.textFaint },
    smallBtn: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: t.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border },
    smallBtnInk: { backgroundColor: t.primary, borderColor: t.primary },
    smallBtnText: { fontSize: 12, fontWeight: '700', color: t.text },

    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
    sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: t.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 16, ...card },
    sheetTitle: { fontSize: 17, fontWeight: '700', color: t.text, paddingHorizontal: 18 },
    sheetSub: { fontSize: 13, color: t.textMuted, paddingHorizontal: 18, marginTop: 3, marginBottom: 8 },

    viewer: { flex: 1, backgroundColor: '#000' },
    viewerTop: { position: 'absolute', left: 0, right: 0, top: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingTop: 8 },
    viewerClose: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
    viewerCount: { color: '#fff', fontSize: 12.5, fontWeight: '700' },
  });
}
