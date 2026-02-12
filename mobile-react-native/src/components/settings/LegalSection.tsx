import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSizes, spacing } from '../../theme/tokens';

type LegalSectionProps = {
  title: string;
  body: string | string[];
};

const toParagraphs = (body: string | string[]): string[] => (Array.isArray(body) ? body : [body]);

export function LegalSection({ title, body }: LegalSectionProps) {
  const paragraphs = toParagraphs(body);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {paragraphs.map((paragraph, index) => (
        <Text key={`${title}-${index}`} style={styles.paragraph}>
          {paragraph}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
  },
  title: {
    fontSize: fontSizes.base,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  paragraph: {
    fontSize: fontSizes.md,
    lineHeight: 20,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
});
