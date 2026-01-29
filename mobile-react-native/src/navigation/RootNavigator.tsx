import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AuthStack } from './AuthStack';
import { AppTabs } from './AppTabs';
import { useAuth } from './AuthContext';
import { colors } from '../theme/tokens';

export function RootNavigator() {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.textAccent} />
      </View>
    );
  }

  return token ? <AppTabs /> : <AuthStack />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
});
