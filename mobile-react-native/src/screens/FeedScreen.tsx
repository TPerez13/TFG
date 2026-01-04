import React from 'react';
import { Button, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type FeedScreenProps = NativeStackScreenProps<RootStackParamList, 'Feed'>;

export default function FeedScreen({ route, navigation }: FeedScreenProps) {
  const { user } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Feed</Text>
        <View style={{ height: 12 }} />
        <Text style={styles.status}>Welcome, {user.username}.</Text>
        <View style={{ height: 24 }} />
        <Text style={styles.status}>This is a placeholder for the user feed.</Text>
        <View style={{ height: 24 }} />
        <Button title="Log out" onPress={() => navigation.replace('Login')} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  status: {
    fontSize: 14,
    color: '#222',
  },
});
