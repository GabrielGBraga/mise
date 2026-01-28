import { Stack, useRouter, useSegments } from 'expo-router';
import { useColorScheme, View } from 'react-native';
import { PaperProvider, ActivityIndicator, IconButton } from 'react-native-paper';
import { LightScheme, DarkScheme } from '../src/constants/Colors';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { useEffect } from 'react';

function AuthGuard() {
    const { session, loading } = useAuth();
    const segments = useSegments();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = colorScheme === 'dark' ? DarkScheme : LightScheme;

    useEffect(() => {
        if (loading) return;

        const inAuthGroup = segments[0] === 'auth';

        if (!session && !inAuthGroup) {
            router.replace('/auth');
        } else if (session && inAuthGroup) {
            router.replace('/');
        }
    }, [session, loading, segments]);

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }



    return (
        <Stack
            screenOptions={{
                headerStyle: { backgroundColor: theme.colors.primary },
                headerTintColor: theme.colors.onPrimary,
                headerRight: () => (
                    <IconButton
                        icon="account-circle"
                        iconColor={theme.colors.onPrimary}
                        onPress={() => router.push('/account')}
                    />
                ),
            }}
        >
            <Stack.Screen name="index" options={{ title: 'Recipes' }} />
            <Stack.Screen name="create-recipe" options={{ title: 'New Recipe' }} />
            <Stack.Screen name="account" options={{ title: 'Account', presentation: 'modal' }} />
            <Stack.Screen name="auth" options={{ title: 'Welcome', headerShown: false }} />
        </Stack>
    );
}

export default function RootLayout() {
    const colorScheme = useColorScheme();
    const theme = colorScheme === 'dark' ? DarkScheme : LightScheme;

    return (
        <PaperProvider theme={theme}>
            <AuthProvider>
                <AuthGuard />
            </AuthProvider>
        </PaperProvider>
    );
}
