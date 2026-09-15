import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
  Keyboard,
} from 'react-native';
import { Text } from '../../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button, Field, ProgressBar } from '../../components/ui';
import { Ghost } from '../../components/Mascot';
import { useAuth } from '../../context/AuthContext';
import useKeyboard, { scrollInputAboveKeyboard } from '../../hooks/useKeyboard';
import { spacing, radius, fontFor } from '../../theme';
import { useTheme, useStyles } from '../../context/ThemeContext';

const BRANCHES = ['CSE', 'IT', 'ECE', 'EE', 'ME', 'CE', 'AI/ML', 'Other'];
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

const STEPS = [
  { title: 'About you', subtitle: 'Tell us your name and VGU email.' },
  { title: 'Set a password', subtitle: 'At least 6 characters. Make it a good one.' },
  { title: 'Your campus', subtitle: 'So we can show you the right people and posts.' },
];

/** Selectable pill used for branch / semester. */
function Option({ label, selected, onPress, style }) {
  const styles = useStyles(makeStyles);
  return (
    <TouchableOpacity
      style={[styles.option, selected && styles.optionSelected, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function RegisterScreen({ navigation }) {
  const { t: colors } = useTheme();
  const styles = useStyles(makeStyles);
  const { register } = useAuth();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name: '', email: '', password: '', branch: '', branchOther: '', semester: null });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hiding, setHiding] = useState(false); // ghost looks away while you type your password

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const last = step === STEPS.length - 1;

  // Keyboard handling: shrink the header, anchor the form to the bottom, and
  // keep whichever input is focused sitting just above the keyboard.
  const refs = { name: useRef(null), email: useRef(null), password: useRef(null), branchOther: useRef(null) };
  const scrollRef = useRef(null);
  const focusedRef = useRef(null);
  const scrollOffset = useRef(0);
  const [bottomBarH, setBottomBarH] = useState(0);
  const { visible: kbOpen, height: kbHeight, progress: kb } = useKeyboard();
  const ghostScale = kb.interpolate({ inputRange: [0, 1], outputRange: [1, 0.7] });
  const ghostHeight = kb.interpolate({ inputRange: [0, 1], outputRange: [86, 60] }); // 72px ghost is 86 tall
  const focus = (key) => () => (focusedRef.current = refs[key].current);

  useEffect(() => {
    if (!kbOpen) return;
    const t = setTimeout(
      () => scrollInputAboveKeyboard({ inputRef: focusedRef, scrollRef, keyboardHeight: kbHeight, reserved: bottomBarH, offset: scrollOffset.current }),
      80
    );
    return () => clearTimeout(t);
  }, [kbOpen, kbHeight, bottomBarH]);

  // Slide + fade each step in.
  const slide = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    slide.setValue(0);
    Animated.timing(slide, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [step, slide]);
  const slideX = slide.interpolate({ inputRange: [0, 1], outputRange: [40, 0] });

  // Back button in the header walks back through steps before leaving the screen.
  useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', (e) => {
      if (step === 0) return;
      e.preventDefault();
      setError('');
      setStep((s) => s - 1);
    });
    return unsub;
  }, [navigation, step]);

  function validate() {
    if (step === 0) {
      if (!form.name.trim()) return 'Please enter your name.';
      if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return 'Enter a valid VGU email.';
    }
    if (step === 1 && form.password.length < 6) return 'Password must be at least 6 characters.';
    if (step === 2) {
      if (!form.branch || (form.branch === 'Other' && !form.branchOther.trim())) return 'Pick your branch.';
      if (!form.semester) return 'Pick your semester.';
    }
    return '';
  }

  async function onNext() {
    Keyboard.dismiss();
    const err = validate();
    setError(err);
    if (err) return;
    if (!last) return setStep((s) => s + 1);

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        branch: form.branch === 'Other' ? form.branchOther.trim() : form.branch,
        semester: form.semester,
      };
      await register(payload);
      navigation.navigate('Otp', { email: payload.email });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const ghost = error ? 'sad' : hiding ? 'cool' : step === 2 ? 'glasses' : form.name ? 'happy' : 'smile';
  const firstName = form.name.trim().split(' ')[0];

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[styles.container, kbOpen && styles.containerKb]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onScroll={(e) => (scrollOffset.current = e.nativeEvent.contentOffset.y)}
          scrollEventThrottle={32}
        >
          <ProgressBar steps={STEPS.length} active={step} />
          <Text style={styles.stepLabel}>
            Step {step + 1} of {STEPS.length}
          </Text>

          <View style={styles.header}>
            <Animated.View style={{ height: ghostHeight, alignItems: 'center', justifyContent: 'flex-end' }}>
              <Animated.View style={{ transform: [{ scale: ghostScale }], transformOrigin: 'bottom' }}>
                <Ghost width={72} variant={ghost} />
              </Animated.View>
            </Animated.View>
            <Text style={styles.title}>{step === 2 && firstName ? `Almost there, ${firstName}` : STEPS[step].title}</Text>
            <Text style={styles.subtitle}>{STEPS[step].subtitle}</Text>
          </View>

          <Animated.View style={{ opacity: slide, transform: [{ translateX: slideX }] }}>
            {step === 0 && (
              <>
                <Field
                  ref={refs.name}
                  label="Full name"
                  placeholder="Jitesh Jangir"
                  value={form.name}
                  onChangeText={set('name')}
                  onFocus={focus('name')}
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => refs.email.current?.focus()}
                  autoFocus
                />
                <Field
                  ref={refs.email}
                  label="VGU email"
                  placeholder="enrollment@vgu.ac.in"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={form.email}
                  onChangeText={set('email')}
                  onFocus={focus('email')}
                  returnKeyType="next"
                  onSubmitEditing={onNext}
                />
              </>
            )}

            {step === 1 && (
              <View>
                <Field
                  ref={refs.password}
                  label="Password"
                  placeholder="At least 6 characters"
                  secureTextEntry={!showPassword}
                  value={form.password}
                  onChangeText={set('password')}
                  onFocus={() => {
                    focus('password')();
                    setHiding(true);
                  }}
                  onBlur={() => setHiding(false)}
                  returnKeyType="next"
                  onSubmitEditing={onNext}
                  autoFocus
                  inputStyle={{ paddingRight: 52 }}
                />
                <TouchableOpacity style={styles.eye} onPress={() => setShowPassword((v) => !v)} hitSlop={10}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            )}

            {step === 2 && (
              <>
                <Text style={styles.fieldLabel}>Branch</Text>
                <View style={styles.wrap}>
                  {BRANCHES.map((b) => (
                    <Option key={b} label={b} selected={form.branch === b} onPress={() => set('branch')(b)} />
                  ))}
                </View>
                {form.branch === 'Other' ? (
                  <Field
                    ref={refs.branchOther}
                    placeholder="Type your branch, e.g. B.Pharm"
                    autoCapitalize="characters"
                    value={form.branchOther}
                    onChangeText={set('branchOther')}
                    onFocus={focus('branchOther')}
                    returnKeyType="done"
                    style={{ marginTop: spacing.sm }}
                    autoFocus
                  />
                ) : null}

                <Text style={[styles.fieldLabel, { marginTop: spacing.lg }]}>Semester</Text>
                <View style={styles.semGrid}>
                  {SEMESTERS.map((n) => (
                    <Option key={n} label={String(n)} selected={form.semester === n} onPress={() => set('semester')(n)} style={styles.semOption} />
                  ))}
                </View>
              </>
            )}
          </Animated.View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScrollView>

        {/* Pinned to the bottom of the screen */}
        <View style={styles.bottom} onLayout={(e) => setBottomBarH(e.nativeEvent.layout.height)}>
          <Button
            title={last ? 'Send verification code' : 'Continue'}
            onPress={onNext}
            loading={loading}
            iconRight={!last ? <Ionicons name="arrow-forward" size={20} color={colors.onPrimary} /> : null}
          />
          {step === 0 ? (
            <TouchableOpacity style={styles.footer} onPress={() => navigation.navigate('Login')}>
              <Text style={fontFor(colors).bodyMuted}>Already have an account? </Text>
              <Text style={styles.link}>Log in</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.footer} onPress={() => { setError(''); setStep((s) => s - 1); }}>
              <Text style={styles.link}>Back</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (colors, isDark) => {
  const font = fontFor(colors);
  return StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.md, flexGrow: 1 },
  // Keyboard up: anchor the form to the bottom so the fields hug the button / keyboard.
  containerKb: { justifyContent: 'flex-end' },
  stepLabel: { ...font.small, marginTop: spacing.sm, color: colors.textFaint },
  header: { alignItems: 'center', marginTop: spacing.lg, marginBottom: spacing.xl },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, marginTop: spacing.md, textAlign: 'center' },
  subtitle: { ...font.bodyMuted, marginTop: 6, textAlign: 'center', maxWidth: 300 },
  eye: { position: 'absolute', right: 16, top: 24 + 18 },
  fieldLabel: { ...font.label, fontSize: 14.5, marginBottom: spacing.sm },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: {
    paddingHorizontal: 16,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  optionText: { fontSize: 15, fontWeight: '700', color: colors.text },
  optionTextSelected: { color: colors.onPrimary },
  semGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  semOption: { width: '22%', flexGrow: 1, paddingHorizontal: 0, height: 48, borderRadius: radius.md },
  error: { color: colors.danger, marginTop: spacing.sm },
  bottom: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.lg, backgroundColor: colors.bg },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg },
  link: { color: colors.accent, fontWeight: '700' },
});
};
