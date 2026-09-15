import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Animated,
  Keyboard,
} from 'react-native';
import { Text } from '../../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Field } from '../../components/ui';
import { Ghost } from '../../components/Mascot';
import useKeyboard, { scrollInputAboveKeyboard } from '../../hooks/useKeyboard';
import { useAuth } from '../../context/AuthContext';
import { spacing, fontFor } from '../../theme';
import { useTheme, useStyles } from '../../context/ThemeContext';

export default function LoginScreen({ navigation }) {
  const { t: colors } = useTheme();
  const styles = useStyles(makeStyles);
  const { login, celebrate } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hiding, setHiding] = useState(false); // ghost looks away while you type your password
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const scrollRef = useRef(null);
  const focusedRef = useRef(null); // whichever input currently has focus
  const scrollOffset = useRef(0);
  const [bottomBarH, setBottomBarH] = useState(0);
  const [verified, setVerified] = useState(false); // true once login succeeded (celebration playing)

  // When the keyboard opens, collapse the mascot header so both fields and the
  // Log in button stay visible above it.
  const { visible: kbOpen, height: kbHeight, progress: kb } = useKeyboard();
  const ghostScale = kb.interpolate({ inputRange: [0, 1], outputRange: [1, 0.7] });
  const ghostHeight = kb.interpolate({ inputRange: [0, 1], outputRange: [115, 80] }); // 96px ghost is 115 tall
  const headerGap = kb.interpolate({ inputRange: [0, 1], outputRange: [spacing.xxl, spacing.xl] });

  // Once the keyboard is up, make sure the focused field sits right above it.
  useEffect(() => {
    if (!kbOpen) return;
    const t = setTimeout(
      () => scrollInputAboveKeyboard({ inputRef: focusedRef, scrollRef, keyboardHeight: kbHeight, reserved: bottomBarH, offset: scrollOffset.current }),
      Platform.OS === 'android' ? 80 : 0 // let the resized layout settle first
    );
    return () => clearTimeout(t);
  }, [kbOpen, kbHeight, bottomBarH]);

  async function onLogin() {
    Keyboard.dismiss();
    setError('');
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      // Hold the session swap until the success animation has played.
      const { user, finish } = await login(email.trim(), password, { autoLogin: false });
      setVerified(true);
      celebrate({ title: `Welcome back, ${user.name.split(' ')[0]}!`, subtitle: 'Good to see you again 👋', finish });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Android is edge-to-edge (SDK 54+), so the window no longer resizes for the
          keyboard — 'padding' is needed on both platforms. */}
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[styles.container, kbOpen && styles.containerKb]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onScroll={(e) => (scrollOffset.current = e.nativeEvent.contentOffset.y)}
          scrollEventThrottle={32}
        >
          <Animated.View style={[styles.header, { marginBottom: headerGap }]}>
            {/* looks away while you type your password; shrinks while the keyboard is up */}
            <Animated.View style={{ height: ghostHeight, alignItems: 'center', justifyContent: 'flex-end' }}>
              <Animated.View style={{ transform: [{ scale: ghostScale }], transformOrigin: 'bottom' }}>
                <Ghost width={96} variant={error ? 'sad' : hiding ? 'cool' : 'smile'} />
              </Animated.View>
            </Animated.View>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Log in to your campus account.</Text>
          </Animated.View>

          <Field
            ref={emailRef}
            label="VGU email"
            placeholder="enrollment@vgu.ac.in"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            onFocus={() => (focusedRef.current = emailRef.current)}
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => passwordRef.current?.focus()}
          />
          <Field
            ref={passwordRef}
            label="Password"
            placeholder="Your password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            onFocus={() => {
              focusedRef.current = passwordRef.current;
              setHiding(true);
            }}
            onBlur={() => setHiding(false)}
            returnKeyType="go"
            onSubmitEditing={onLogin}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScrollView>

        {/* Pinned to the bottom of the screen */}
        <View style={styles.bottom} onLayout={(e) => setBottomBarH(e.nativeEvent.layout.height)}>
          <Button title="Log in" onPress={onLogin} loading={loading} disabled={verified} />

          <TouchableOpacity
            style={styles.footer}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={fontFor(colors).bodyMuted}>New here? </Text>
            <Text style={styles.link}>Create an account</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (colors, isDark) => {
  const font = fontFor(colors);
  return StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.xl, paddingBottom: spacing.md, flexGrow: 1, justifyContent: 'center' },
  // Keyboard up: anchor the form to the bottom so the fields hug the button / keyboard.
  containerKb: { justifyContent: 'flex-end' },
  bottom: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.lg, backgroundColor: colors.bg },
  header: { alignItems: 'center' },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, marginTop: spacing.md },
  subtitle: { ...font.bodyMuted, marginTop: 6, textAlign: 'center' },
  error: { color: colors.danger, marginBottom: spacing.md },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg },
  link: { color: colors.accent, fontWeight: '700' },
});
};
