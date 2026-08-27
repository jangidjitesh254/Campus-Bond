import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { G, Path, Rect, Circle } from 'react-native-svg';

const C = 'rgba(124,192,61,0.12)'; // very faint apple green

function Sparkle({ x, y, s = 10 }) {
  return (
    <Path
      d={`M${x} ${y - s} C ${x + 1} ${y - 1.5} ${x + 1.5} ${y - 1} ${x + s} ${y} C ${x + 1.5} ${y + 1} ${x + 1} ${y + 1.5} ${x} ${y + s} C ${x - 1} ${y + 1.5} ${x - 1.5} ${y + 1} ${x - s} ${y} C ${x - 1.5} ${y - 1} ${x - 1} ${y - 1.5} ${x} ${y - s} Z`}
      fill={C}
      stroke="none"
    />
  );
}

/** Chat bubbles, paper plane, backpack, graduation cap — the original set. */
function FeedMotifs() {
  return (
    <>
      {/* Chat bubbles */}
      <Rect x={38} y={300} width={96} height={58} rx={18} />
      <Path d="M60 358 l0 16 -16 -16" />
      <Rect x={244} y={430} width={78} height={48} rx={16} />
      <Path d="M306 478 l0 14 14 -14" />

      {/* Paper plane */}
      <Path d="M262 292 l64 -26 -20 62 -16 -20 -18 12 2 -22 -12 -6Z" />
      <Path d="M290 308 l16 -42" />

      {/* Backpack */}
      <Rect x={54} y={560} width={72} height={82} rx={20} />
      <Path d="M74 560 a16 16 0 0 1 32 0" />
      <Rect x={70} y={600} width={40} height={30} rx={10} />
      <Path d="M82 600 v30 M98 600 v30" />

      {/* Graduation cap */}
      <Path d="M300 548 l38 16 -38 16 -38 -16 38 -16Z" />
      <Path d="M320 572 v20 a6 6 0 0 1 -12 0" />
      <Path d="M338 564 v18" />

      {/* Dashed swoosh trail */}
      <Path d="M40 200 C 130 150 260 250 350 190" strokeDasharray="2 12" />
      <Path d="M30 690 C 120 640 250 720 360 660" strokeDasharray="2 12" />
    </>
  );
}

/** Extra motifs layered over the feed set on the Post tab. */
function PostMotifs() {
  return (
    <>
      {/* Lightbulb */}
      <Path d="M52 74 a17 17 0 0 1 10 30 v6 H42 v-6 a17 17 0 0 1 10 -30 Z" />
      <Path d="M43 116 h18 M45 122 h14" />

      {/* Pencil */}
      <Path d="M344 68 l12 12 -44 44 -16 4 4 -16 44 -44 Z" />
      <Path d="M336 76 l12 12" />

      {/* Trophy */}
      <Path d="M30 446 h30 v12 a15 15 0 0 1 -30 0 Z" />
      <Path d="M30 450 h-8 a8 8 0 0 0 8 8" />
      <Path d="M60 450 h8 a8 8 0 0 1 -8 8" />
      <Path d="M45 473 v8 M35 486 h20" />

      {/* Open book */}
      <Path d="M344 608 c 8 -5 16 -5 22 0 v30 c -6 -5 -14 -5 -22 0 Z" />
      <Path d="M366 608 c 6 -5 14 -5 20 0 v30 c -6 -5 -14 -5 -20 0 Z" />

      {/* Hashtag */}
      <Path d="M168 630 l-6 30 M184 630 l-6 30 M158 640 h32 M156 652 h32" />
    </>
  );
}

/** A distinct campus/study set for the Home dashboard. */
function HomeMotifs() {
  return (
    <>
      {/* Open book */}
      <Path d="M18 60 C 30 52 42 52 52 60 C 62 52 74 52 86 60 L 86 92 C 74 84 62 84 52 92 C 42 84 30 84 18 92 Z" />
      <Path d="M52 60 v32" />

      {/* Lightbulb */}
      <Path d="M320 46 a18 18 0 0 1 11 32 v6 h-22 v-6 a18 18 0 0 1 11 -32 Z" />
      <Path d="M311 90 h18 M313 96 h14" />

      {/* Trophy */}
      <Path d="M30 286 h34 v14 a17 17 0 0 1 -34 0 Z" />
      <Path d="M30 290 h-9 a9 9 0 0 0 9 9" />
      <Path d="M64 290 h9 a9 9 0 0 1 -9 9" />
      <Path d="M47 317 v10 M36 331 h22" />

      {/* Map pin */}
      <Path d="M336 286 a16 16 0 0 1 16 16 c0 12 -16 26 -16 26 s-16 -14 -16 -26 a16 16 0 0 1 16 -16 Z" />
      <Circle cx={336} cy={302} r={6} />

      {/* Music note */}
      <Path d="M344 452 l22 -6" />
      <Path d="M344 452 v40 M366 446 v40" />
      <Circle cx={338} cy={494} r={7} />
      <Circle cx={360} cy={488} r={7} />

      {/* Coffee cup */}
      <Rect x={24} y={508} width={44} height={40} rx={8} />
      <Path d="M68 518 h10 a9 9 0 0 1 0 18 h-10" />
      <Path d="M34 494 q6 -8 0 -14 M48 494 q6 -8 0 -14" />

      {/* Rocket */}
      <Path d="M334 644 c 12 10 17 25 15 40 l -15 8 -15 -8 c -2 -15 3 -30 15 -40 Z" />
      <Path d="M321 676 l -9 13 13 -5" />
      <Path d="M347 676 l 9 13 -13 -5" />
      <Circle cx={334} cy={666} r={5} />

      {/* Calendar */}
      <Rect x={26} y={684} width={56} height={50} rx={8} />
      <Path d="M26 700 h56 M42 678 v10 M66 678 v10" />
      <Path d="m44 714 5 5 12 -12" />

      {/* Dashed swoosh trails */}
      <Path d="M20 200 C 110 160 250 240 370 190" strokeDasharray="2 12" />
      <Path d="M24 600 C 120 560 250 630 366 586" strokeDasharray="2 12" />
    </>
  );
}

const SPARKLES = {
  feed: [
    { x: 66, y: 240, s: 11 },
    { x: 330, y: 360, s: 9 },
    { x: 126, y: 470, s: 8 },
    { x: 210, y: 200, s: 7 },
    { x: 300, y: 690, s: 10 },
  ],
  post: [
    { x: 66, y: 240, s: 11 },
    { x: 330, y: 360, s: 9 },
    { x: 126, y: 470, s: 8 },
    { x: 210, y: 200, s: 7 },
    { x: 300, y: 690, s: 10 },
    { x: 190, y: 500, s: 8 },
    { x: 355, y: 300, s: 7 },
  ],
  home: [
    { x: 200, y: 120, s: 9 },
    { x: 110, y: 250, s: 7 },
    { x: 300, y: 220, s: 8 },
    { x: 60, y: 410, s: 7 },
    { x: 150, y: 560, s: 8 },
    { x: 250, y: 740, s: 10 },
  ],
};

/**
 * Faint decorative doodle background — absolute-fill, non-interactive.
 * `variant` picks the motif set: 'feed' (default, also used by Chat),
 * 'post' (feed set plus a few extras) or 'home' (its own campus set).
 */
export default function Doodles({ style, variant = 'feed' }) {
  return (
    <View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 390 780" preserveAspectRatio="xMidYMid slice">
        <G stroke={C} strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round">
          {variant === 'home' ? (
            <HomeMotifs />
          ) : (
            <>
              <FeedMotifs />
              {variant === 'post' ? <PostMotifs /> : null}
            </>
          )}
        </G>
        {(SPARKLES[variant] || SPARKLES.feed).map((s, i) => (
          <Sparkle key={i} x={s.x} y={s.y} s={s.s} />
        ))}
      </Svg>
    </View>
  );
}
