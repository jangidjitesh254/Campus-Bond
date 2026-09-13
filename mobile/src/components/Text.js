import React, { forwardRef } from 'react';
import { Text as RNText, TextInput as RNTextInput, StyleSheet } from 'react-native';
import { FONT } from '../theme';

/**
 * Text and TextInput in Manrope.
 *
 * Every screen imports these instead of React Native's own, so the hundreds
 * of existing `fontWeight: '700'` styles keep working: the weight picks the
 * Manrope file, and the weight itself is dropped so Android does not
 * fake-bold on top of an already-bold cut. A style that names a Manrope
 * file explicitly is respected.
 */
const BY_WEIGHT = {
  100: FONT.weights[400], 200: FONT.weights[400], 300: FONT.weights[400],
  normal: FONT.weights[400], 400: FONT.weights[400],
  500: FONT.weights[500],
  600: FONT.weights[600],
  bold: FONT.weights[700], 700: FONT.weights[700],
  800: FONT.weights[800], 900: FONT.weights[800],
};

export function manrope(style) {
  const flat = StyleSheet.flatten(style) || {};
  const named = typeof flat.fontFamily === 'string' && flat.fontFamily.startsWith(FONT.family);
  const family = named ? flat.fontFamily : BY_WEIGHT[flat.fontWeight] || FONT.weights[400];
  return [style, { fontFamily: family, fontWeight: undefined }];
}

export const Text = forwardRef(({ style, ...props }, ref) => <RNText ref={ref} {...props} style={manrope(style)} />);
Text.displayName = 'Text';

export const TextInput = forwardRef(({ style, ...props }, ref) => <RNTextInput ref={ref} {...props} style={manrope(style)} />);
TextInput.displayName = 'TextInput';
