import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, useTheme, Avatar } from 'react-native-paper';
import { useAuth } from '../src/context/AuthContext';
import { supabase } from '../src/lib/supabase';

export default function AccountScreen() {
    const { session } = useAuth();
    const theme = useTheme();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.profileSection}>
                <Avatar.Icon size={80} icon="account" style={{ backgroundColor: theme.colors.primary }} />
                <Text variant="headlineSmall" style={styles.email}>
                    {session?.user.email}
                </Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.secondary }}>
                    User ID: {session?.user.id.slice(0, 8)}...
                </Text>
            </View>

            <Button
                mode="contained"
                onPress={handleSignOut}
                style={styles.signOutButton}
                buttonColor={theme.colors.error}
            >
                Sign Out
            </Button>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileSection: {
        alignItems: 'center',
        marginBottom: 40,
    },
    email: {
        marginTop: 16,
        marginBottom: 8,
        fontWeight: 'bold',
    },
    signOutButton: {
        width: '100%',
        maxWidth: 300,
    }
});
