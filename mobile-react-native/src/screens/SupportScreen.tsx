import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type {
  SupportFaqItem,
  SupportFaqResponse,
  SupportTicketResponse,
  SupportTicketType,
  UserSummary,
} from '@muchasvidas/shared';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../components/layout/Screen';
import type { ProfileStackParamList } from '../navigation/types';
import { colors, fontSizes, spacing } from '../theme/tokens';
import { apiFetch } from '../services/api';
import { useAuth } from '../navigation/AuthContext';

type SupportScreenProps = NativeStackScreenProps<ProfileStackParamList, 'HelpSupport'>;
type ScreenState = 'loading' | 'success' | 'error';
type SubmitState = 'idle' | 'loading' | 'success' | 'error';

const bugKinds = [
  { id: 'ui', label: 'UI' },
  { id: 'datos', label: 'Datos' },
  { id: 'rendimiento', label: 'Rendimiento' },
  { id: 'crash', label: 'Cierre inesperado' },
];
const appConfig = require('../../app.json');

export default function SupportScreen({ navigation }: SupportScreenProps) {
  const { signOut } = useAuth();
  const [screenState, setScreenState] = useState<ScreenState>('loading');
  const [faqs, setFaqs] = useState<SupportFaqItem[]>([]);
  const [contactEmail, setContactEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [reportExpanded, setReportExpanded] = useState(false);
  const [bugType, setBugType] = useState('ui');
  const [bugDescription, setBugDescription] = useState('');
  const [ticketState, setTicketState] = useState<SubmitState>('idle');
  const [feedback, setFeedback] = useState<string | null>(null);

  const appVersion = appConfig?.expo?.version ?? '0.0.0';
  const appBuild = String(appConfig?.expo?.android?.versionCode ?? appConfig?.expo?.ios?.buildNumber ?? 'dev');

  const deviceInfo = useMemo(
    () => ({
      platform: Platform.OS,
      platformVersion: Platform.Version,
      appVersion,
      appBuild,
      runtimeVersion: appConfig?.expo?.runtimeVersion ?? null,
    }),
    [appBuild, appVersion]
  );

  const load = async () => {
    try {
      setScreenState('loading');
      setFeedback(null);
      const [faqRes, meRes] = await Promise.all([apiFetch('/support/faq'), apiFetch('/users/me')]);

      if (faqRes.status === 401 || meRes.status === 401) {
        await signOut();
        return;
      }

      if (!faqRes.ok || !meRes.ok) {
        throw new Error('No se pudo cargar la informacion de soporte.');
      }

      const faqPayload = (await faqRes.json()) as SupportFaqResponse;
      const mePayload = (await meRes.json()) as { user?: UserSummary };
      setFaqs(faqPayload.items ?? []);
      setContactEmail(mePayload.user?.correo ?? '');
      setScreenState('success');
    } catch (_error) {
      setScreenState('error');
      setFeedback('No se pudo cargar ayuda y soporte.');
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const createTicket = async (payload: {
    asunto: string;
    descripcion: string;
    tipo: SupportTicketType;
    contactoEmail?: string;
    includeDeviceInfo?: boolean;
  }) => {
    try {
      setTicketState('loading');
      setFeedback(null);
      const res = await apiFetch('/support/tickets', {
        method: 'POST',
        body: JSON.stringify({
          asunto: payload.asunto,
          descripcion: payload.descripcion,
          tipo: payload.tipo,
          contactoEmail: payload.contactoEmail ?? contactEmail ?? null,
          deviceInfo: payload.includeDeviceInfo ? deviceInfo : null,
        }),
      });

      if (res.status === 401) {
        await signOut();
        return;
      }
      if (!res.ok) {
        throw new Error('No se pudo crear el ticket.');
      }

      const ticket = (await res.json()) as SupportTicketResponse;
      setTicketState('success');
      setFeedback(`Ticket creado: ${ticket.ticketNumber}`);
      Alert.alert('Solicitud enviada', `Tu ticket ${ticket.ticketNumber} se registro correctamente.`);
    } catch (_error) {
      setTicketState('error');
      setFeedback('Error al enviar ticket de soporte.');
    }
  };

  const sendContact = async () => {
    if (subject.trim().length < 3 || description.trim().length < 10) {
      setFeedback('Completa asunto (3+) y descripcion (10+) para enviar.');
      setTicketState('error');
      return;
    }
    await createTicket({
      asunto: subject.trim(),
      descripcion: description.trim(),
      tipo: 'consulta',
      contactoEmail: contactEmail.trim(),
    });
    setSubject('');
    setDescription('');
  };

  const sendBugReport = async () => {
    if (bugDescription.trim().length < 10) {
      setFeedback('Describe el error con al menos 10 caracteres.');
      setTicketState('error');
      return;
    }

    const selectedBug = bugKinds.find((item) => item.id === bugType)?.label ?? bugType;
    await createTicket({
      asunto: `Reporte de error - ${selectedBug}`,
      descripcion: bugDescription.trim(),
      tipo: 'bug',
      contactoEmail: contactEmail.trim(),
      includeDeviceInfo: true,
    });
    setBugDescription('');
  };

  return (
    <Screen>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Ayuda y Soporte</Text>
          <View style={styles.headerSpacer} />
        </View>

        {screenState === 'loading' ? (
          <ActivityIndicator size="large" color={colors.textAccent} style={styles.loading} />
        ) : null}

        {screenState === 'error' ? (
          <View style={styles.statusCard}>
            <Text style={styles.statusTitle}>No se pudo cargar soporte</Text>
            <Text style={styles.statusSubtitle}>Comprueba la conexion y vuelve a intentarlo.</Text>
            <Pressable style={styles.retryButton} onPress={() => void load()}>
              <Text style={styles.retryText}>Reintentar</Text>
            </Pressable>
          </View>
        ) : null}

        {screenState === 'success' ? (
          <>
            {feedback ? (
              <View
                style={[
                  styles.feedback,
                  ticketState === 'error' ? styles.feedbackError : styles.feedbackSuccess,
                ]}
              >
                <Text style={styles.feedbackText}>{feedback}</Text>
              </View>
            ) : null}

            <Text style={styles.sectionTitle}>Preguntas frecuentes (FAQ)</Text>
            <View style={styles.card}>
              {faqs.map((item) => (
                <View key={item.id} style={styles.faqItem}>
                  <Text style={styles.faqQuestion}>{item.pregunta}</Text>
                  <Text style={styles.faqAnswer}>{item.respuesta}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Contactar soporte</Text>
            <View style={styles.card}>
              <TextInput
                style={styles.input}
                value={subject}
                onChangeText={setSubject}
                placeholder="Asunto"
                placeholderTextColor={colors.placeholder}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe tu consulta"
                placeholderTextColor={colors.placeholder}
                multiline
              />
              <TextInput
                style={styles.input}
                value={contactEmail}
                onChangeText={setContactEmail}
                placeholder="Email de contacto (opcional)"
                placeholderTextColor={colors.placeholder}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <Pressable
                style={[styles.primaryButton, ticketState === 'loading' ? styles.buttonDisabled : null]}
                disabled={ticketState === 'loading'}
                onPress={() => void sendContact()}
              >
                <Text style={styles.primaryButtonText}>
                  {ticketState === 'loading' ? 'Enviando...' : 'Enviar'}
                </Text>
              </Pressable>
            </View>

            <Text style={styles.sectionTitle}>Reportar un error</Text>
            <View style={styles.card}>
              <Pressable style={styles.secondaryButton} onPress={() => setReportExpanded((value) => !value)}>
                <Text style={styles.secondaryButtonText}>
                  {reportExpanded ? 'Ocultar formulario rapido' : 'Abrir formulario rapido'}
                </Text>
              </Pressable>
              {reportExpanded ? (
                <>
                  <View style={styles.chipWrap}>
                    {bugKinds.map((kind) => (
                      <Pressable
                        key={kind.id}
                        onPress={() => setBugType(kind.id)}
                        style={[styles.chip, bugType === kind.id ? styles.chipActive : null]}
                      >
                        <Text style={[styles.chipText, bugType === kind.id ? styles.chipTextActive : null]}>
                          {kind.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={bugDescription}
                    onChangeText={setBugDescription}
                    placeholder="Descripcion breve del error"
                    placeholderTextColor={colors.placeholder}
                    multiline
                  />
                  <Text style={styles.helper}>
                    Se adjuntara automaticamente info del dispositivo y version ({appVersion}/{appBuild}).
                  </Text>
                  <Pressable
                    style={[styles.primaryButton, ticketState === 'loading' ? styles.buttonDisabled : null]}
                    disabled={ticketState === 'loading'}
                    onPress={() => void sendBugReport()}
                  >
                    <Text style={styles.primaryButtonText}>Enviar reporte</Text>
                  </Pressable>
                </>
              ) : null}
            </View>

            <Text style={styles.sectionTitle}>Politica / Terminos</Text>
            <View style={styles.card}>
              <PlaceholderLink
                title="Politica de privacidad"
                onPress={() => navigation.navigate('PrivacyPolicy')}
              />
              <View style={styles.divider} />
              <PlaceholderLink
                title="Terminos de uso"
                onPress={() => navigation.navigate('TermsOfUse')}
              />
            </View>
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function PlaceholderLink({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable style={styles.linkRow} onPress={onPress}>
      <Text style={styles.linkText}>{title}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  container: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.contentTop,
    paddingBottom: spacing.contentBottom + 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 36,
    height: 36,
  },
  loading: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  faqItem: {
    marginBottom: spacing.md,
  },
  faqQuestion: {
    fontSize: fontSizes.base,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  faqAnswer: {
    fontSize: fontSizes.md,
    color: colors.textMuted,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.textOnAccent,
    fontSize: fontSizes.base,
    fontWeight: '700',
  },
  secondaryButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginBottom: spacing.sm,
    backgroundColor: colors.surfaceMuted,
  },
  secondaryButtonText: {
    color: colors.textPrimary,
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
  },
  chipActive: {
    borderColor: colors.accent,
    backgroundColor: colors.brandSoft,
  },
  chipText: {
    color: colors.textMuted,
    fontSize: fontSizes.sm,
  },
  chipTextActive: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  helper: {
    fontSize: fontSizes.sm,
    color: colors.textSubtle,
    marginBottom: spacing.sm,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  linkText: {
    color: colors.textPrimary,
    fontSize: fontSizes.base,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
  },
  statusCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: spacing.lg,
  },
  statusTitle: {
    fontSize: fontSizes.base,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  statusSubtitle: {
    fontSize: fontSizes.md,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  retryButton: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  retryText: {
    color: colors.textOnAccent,
    fontWeight: '700',
  },
  feedback: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
  },
  feedbackSuccess: {
    backgroundColor: colors.brandSoft,
    borderColor: colors.accent,
  },
  feedbackError: {
    backgroundColor: '#fff0f0',
    borderColor: '#ffb3b3',
  },
  feedbackText: {
    color: colors.textPrimary,
    fontSize: fontSizes.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
