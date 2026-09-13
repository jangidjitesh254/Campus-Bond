import React, { useRef, useState, useEffect, useCallback, cloneElement } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Ghost } from './Mascot';

const TRIGGER = 72; // pull distance (px) that starts a refresh
const MAX = 150; // how far the pull can go
const HOLD = 76; // where the list sits while refreshing
const SLOP = 8; // finger travel before a pull starts

/**
 * Pull-to-refresh with the ghost mascot as the indicator.
 *
 * Wrap a FlatList/ScrollView and pass its "at top" state. Pulling down while
 * at the top stretches the mascot like elastic; release past the threshold to
 * run `onRefresh` (the mascot winks while it waits), then everything springs
 * back. Uses gesture-handler so the pan runs *alongside* the native scroll
 * (a plain PanResponder loses to Android's ScrollView).
 *
 *   <PullToRefresh top={<Header/>} atTop={atTop} onRefresh={load}>
 *     <FlatList bounces={false} overScrollMode="never" onScroll={…setAtTop} />
 *   </PullToRefresh>
 */
export default function PullToRefresh({ onRefresh, atTop, children, top, ghostSize = 30, ghostTop = 9 }) {
  const pull = useRef(new Animated.Value(0)).current;
  const lid = useRef(new Animated.Value(0)).current;
  const [refreshing, setRefreshing] = useState(false);
  const [pulling, setPulling] = useState(false);
  const refreshingRef = useRef(false);
  const pullingRef = useRef(false);
  const atTopRef = useRef(atTop);
  atTopRef.current = atTop;

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

  const settle = useCallback((to) => Animated.spring(pull, { toValue: to, friction: 6, tension: 60, useNativeDriver: true }), [pull]);

  const runRefresh = useCallback(async () => {
    refreshingRef.current = true;
    setRefreshing(true);
    settle(HOLD).start();
    try {
      await onRefresh?.();
    } finally {
      // Let the wink land, then bounce back.
      setTimeout(() => {
        refreshingRef.current = false;
        setRefreshing(false);
        settle(0).start();
      }, 250);
    }
  }, [onRefresh, settle]);

  // Rubber-band: the further you pull, the less it moves.
  const eased = (dy) => MAX * (1 - Math.exp(-Math.max(0, dy) / 110));

  const setPull = (on) => {
    pullingRef.current = on;
    setPulling(on); // freezes the list while pulling so it can't scroll underneath
  };

  // The pan runs simultaneously with the list's native scroll. It only "does"
  // anything when the list is at the top and the finger is moving down.
  const native = useRef(Gesture.Native()).current;
  const pan = useRef(
    Gesture.Pan()
      .simultaneousWithExternalGesture(native)
      .activeOffsetY([-SLOP, SLOP])
      .runOnJS(true)
      .onUpdate((e) => {
        if (refreshingRef.current) return;
        if (!pullingRef.current) {
          if (!atTopRef.current || e.translationY <= SLOP) return;
          setPull(true);
        }
        pull.setValue(eased(e.translationY - SLOP));
      })
      .onEnd((e) => {
        if (!pullingRef.current) return;
        setPull(false);
        if (eased(e.translationY - SLOP) >= TRIGGER) runRefresh();
        else settle(0).start();
      })
      .onFinalize(() => {
        // Gesture cancelled mid-pull (e.g. system took over): snap back.
        if (pullingRef.current) {
          setPull(false);
          settle(0).start();
        }
      })
  ).current;

  // Mascot: hangs down with the pull and stretches like elastic (taller than wide).
  const ghostY = pull.interpolate({ inputRange: [0, MAX], outputRange: [0, MAX * 0.55] });
  const scaleX = pull.interpolate({ inputRange: [0, TRIGGER, MAX], outputRange: [1, 1.55, 1.9] });
  const scaleY = pull.interpolate({ inputRange: [0, TRIGGER, MAX], outputRange: [1, 1.9, 2.5] });

  const list = React.isValidElement(children) ? cloneElement(children, { scrollEnabled: !pulling && !refreshing }) : children;

  return (
    <GestureDetector gesture={pan}>
      <View style={styles.root}>
        {/* Fixed header/tabs (leave an empty slot where the mascot goes) */}
        {top}

        {/* The list moves down with the pull; the mascot stretches into the gap */}
        <View style={styles.listWrap}>
          <Animated.View style={[styles.list, { transform: [{ translateY: pull }] }]}>
            <GestureDetector gesture={native}>{list}</GestureDetector>
          </Animated.View>
        </View>

        <Animated.View pointerEvents="none" style={[styles.ghost, { top: ghostTop, transform: [{ translateY: ghostY }, { scaleX }, { scaleY }] }]}>
          <Ghost width={ghostSize} lid={lid} />
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  listWrap: { flex: 1, overflow: 'hidden' },
  list: { flex: 1 },
  ghost: { position: 'absolute', alignSelf: 'center', zIndex: 2 },
});
