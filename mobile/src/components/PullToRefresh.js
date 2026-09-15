import React, { useRef, useState, useEffect, useCallback, cloneElement } from 'react';
import { View, Animated, StyleSheet, Platform, Easing } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { Ghost, MascotDecor } from './Mascot';

const TRIGGER = 72; // pull distance (px) that starts a refresh
const MAX = 150; // how far the pull can go
const HOLD = 76; // where the list sits while refreshing
const SLOP = 6; // finger travel before a pull starts
const SOFT = 140; // rubber-band constant — bigger = softer
const STRETCH = 2.4; // mascot is drawn this many times larger and scaled *down*, so it never blurs

/** Rubber-band: finger travel → list offset. */
const ease = (dy) => MAX * (1 - Math.exp(-Math.max(0, dy - SLOP) / SOFT));
/** Inverse: which finger travel gives this offset (used to spring to HOLD). */
const unease = (y) => SLOP - SOFT * Math.log(1 - y / MAX);

// Sample the curve so the native driver can interpolate it (no JS per frame).
const CURVE_IN = [-1, 0, SLOP, 20, 40, 60, 90, 120, 160, 220, 300, 450, 700];
const CURVE_OUT = CURVE_IN.map(ease);

/**
 * Pull-to-refresh with the ghost mascot as the indicator.
 *
 * Wrap a FlatList/ScrollView and pass its "at top" state. Pulling down while
 * at the top stretches the mascot like elastic; release past the threshold to
 * run `onRefresh` (the mascot winks while it waits), then everything springs
 * back.
 *
 * The finger drives an Animated value on the *native* thread (Animated.event
 * + useNativeDriver), so the pull stays smooth even when JS is busy laying
 * out the feed. The pan runs alongside the list's native scroll and is only
 * enabled while the list is at the top. The child must be gesture-handler's
 * FlatList/ScrollView (it receives `simultaneousHandlers` so both can run).
 *
 *   import { FlatList } from 'react-native-gesture-handler';
 *   <PullToRefresh header={<Header/>} top={<Tabs/>} atTop={atTop} onRefresh={load}>
 *     <FlatList bounces={false} overScrollMode="never" onScroll={…setAtTop} />
 *   </PullToRefresh>
 *
 * On web (preview only) the gesture is skipped and the list renders plainly.
 */
/**
 * `topHidden` (Animated 0→1, native-driven) folds the `top` row away: the
 * tabs+list block slides up by `topHeight` and is made that much taller so
 * no gap appears underneath.
 */
export default function PullToRefresh({ onRefresh, atTop, children, header, top, ghostSize = 30, ghostTop = 9, ghostScale = 1, topHidden, topHeight = 0, mood, variant, ghostShiftX = 0 }) {
  const drag = useRef(new Animated.Value(0)).current; // raw finger travel
  const lid = useRef(new Animated.Value(0)).current;
  const [refreshing, setRefreshing] = useState(false);
  const pan = useRef(null);

  // Idle: a slow bob, so the mascot always feels alive in the header.
  const bob = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [bob]);
  const bobY = bob.interpolate({ inputRange: [0, 1], outputRange: [-2.5, 2.5] });

  // Wink loop while refreshing.
  useEffect(() => {
    if (!refreshing) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(lid, { toValue: 1, duration: 110, useNativeDriver: true }),
        Animated.delay(120),
        Animated.timing(lid, { toValue: 0, duration: 140, useNativeDriver: true }),
        Animated.delay(500),
      ])
    );
    loop.start();
    return () => {
      loop.stop();
      lid.setValue(0);
    };
  }, [refreshing, lid]);

  const settle = useCallback((to) => Animated.spring(drag, { toValue: to, friction: 9, tension: 40, useNativeDriver: true }), [drag]);

  const runRefresh = useCallback(async () => {
    setRefreshing(true);
    settle(unease(HOLD)).start();
    try {
      await onRefresh?.();
    } finally {
      // Let the wink land, then bounce back.
      setTimeout(() => {
        setRefreshing(false);
        settle(0).start();
      }, 250);
    }
  }, [onRefresh, settle]);

  const onGestureEvent = useRef(Animated.event([{ nativeEvent: { translationY: drag } }], { useNativeDriver: true })).current;

  function onHandlerStateChange({ nativeEvent }) {
    const { state, translationY } = nativeEvent;
    if (state !== State.END && state !== State.CANCELLED && state !== State.FAILED) return;
    if (state === State.END && ease(translationY) >= TRIGGER) runRefresh();
    else settle(0).start();
  }

  // List offset and mascot motion all derive from the finger, natively.
  const pull = drag.interpolate({ inputRange: CURVE_IN, outputRange: CURVE_OUT, extrapolate: 'clamp' });
  const ghostY = pull.interpolate({ inputRange: [0, MAX], outputRange: [0, MAX * 0.55] });
  const scaleX = pull.interpolate({ inputRange: [0, TRIGGER, MAX], outputRange: [1 / STRETCH, 1.5 / STRETCH, 1.8 / STRETCH] });
  const scaleY = pull.interpolate({ inputRange: [0, TRIGGER, MAX], outputRange: [1 / STRETCH, 1.8 / STRETCH, 1] });
  // The big ghost is scaled about its centre, so shift it up to keep the small one's position.
  const bigW = ghostSize * STRETCH;
  const bigH = (bigW * 120) / 100;
  const smallH = (ghostSize * 120) / 100;
  const ghostOffset = ghostTop - (bigH - smallH) / 2;

  const list = React.isValidElement(children) ? cloneElement(children, { scrollEnabled: !refreshing, simultaneousHandlers: pan }) : children;

  // Folding the top row: shift up by its height and extend the block by the same amount.
  const fold = topHidden ? topHidden.interpolate({ inputRange: [0, 1], outputRange: [0, -topHeight] }) : 0;
  const foldStyle = topHidden ? { marginBottom: -topHeight } : null;

  if (Platform.OS === 'web') {
    return (
      <View style={styles.root}>
        {header}
        <View style={styles.listWrap}>
          <Animated.View style={[styles.list, foldStyle, { transform: [{ translateY: fold }] }]}>
            {top}
            {children}
          </Animated.View>
        </View>
        <Animated.View pointerEvents="none" style={[styles.ghost, { top: ghostTop, transform: [{ translateX: ghostShiftX }, { translateY: bobY }, { scale: ghostScale }] }]}>
          <Ghost width={ghostSize} variant={variant} />
          <MascotDecor mood={mood} size={ghostSize} />
        </Animated.View>
      </View>
    );
  }

  return (
    <PanGestureHandler
      ref={pan}
      enabled={atTop && !refreshing}
      activeOffsetY={[-SLOP, SLOP]}
      shouldCancelWhenOutside={false}
      onGestureEvent={onGestureEvent}
      onHandlerStateChange={onHandlerStateChange}
    >
      {/* Must be an Animated.View — that is what lets Animated.event receive the native gesture events */}
      <Animated.View style={styles.root} collapsable={false}>
        {/* Fixed header (leave an empty slot where the mascot goes) */}
        {header}

        {/* Tabs + list move down together with the pull; the mascot stretches into the gap */}
        <View style={styles.listWrap}>
          <Animated.View style={[styles.list, foldStyle, { transform: [{ translateY: topHidden ? Animated.add(pull, fold) : pull }] }]}>
            {top}
            {list}
          </Animated.View>
        </View>

        <Animated.View pointerEvents="none" style={[styles.ghost, { top: ghostOffset, transform: [{ translateX: ghostShiftX }, { translateY: Animated.add(ghostY, bobY) }, { scaleX }, { scaleY }, { scale: ghostScale }] }]}>
          <Ghost width={bigW} lid={lid} variant={variant} />
          <MascotDecor mood={mood} size={bigW} />
        </Animated.View>
      </Animated.View>
    </PanGestureHandler>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  listWrap: { flex: 1, overflow: 'hidden' },
  list: { flex: 1 },
  ghost: { position: 'absolute', alignSelf: 'center', zIndex: 2 },
});
