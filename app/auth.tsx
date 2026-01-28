import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Text, useTheme } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../src/lib/supabase';
import { useRouter } from 'expo-router';

const authSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

type AuthData = z.infer<typeof authSchema>;

export default function AuthScreen() {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const theme = useTheme();
    const router = useRouter();

    const { control, handleSubmit, formState: { errors } } = useForm<AuthData>({
        resolver: zodResolver(authSchema),
        defaultValues: { email: '', password: '' },
    });

    const onSubmit = async (data: AuthData) => {
        setLoading(true);
        const { email, password } = data;
        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                // Navigation is handled by layout/auth state listener but we can push
            } else {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                Alert.alert("Success", "Account created! Please check your email for verification if needed, or login.");
                setIsLogin(true);
            }
        } catch (error: any) {
            Alert.alert("Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Text variant="headlineMedium" style={styles.title}>{isLogin ? 'Welcome Back' : 'Create Account'}</Text>

            <Controller
                control={control}
                name="email"
                render={({ field: { onChange, value } }) => (
                    <TextInput
                        label="Email"
                        value={value}
                        onChangeText={onChange}
                        mode="outlined"
                        style={styles.input}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        error={!!errors.email}
                    />
                )}
            />
            {errors.email && <Text style={{ color: theme.colors.error }}>{errors.email.message}</Text>}

            <Controller
                control={control}
                name="password"
                render={({ field: { onChange, value } }) => (
                    <TextInput
                        label="Password"
                        value={value}
                        onChangeText={onChange}
                        mode="outlined"
                        secureTextEntry
                        style={styles.input}
                        error={!!errors.password}
                    />
                )}
            />
            {errors.password && <Text style={{ color: theme.colors.error }}>{errors.password.message}</Text>}

            <Button
                mode="contained"
                onPress={handleSubmit(onSubmit)}
                loading={loading}
                style={styles.button}
            >
                {isLogin ? 'Sign In' : 'Sign Up'}
            </Button>

            <Button onPress={() => setIsLogin(!isLogin)} style={styles.switchButton}>
                {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
            </Button>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
    },
    title: {
        textAlign: 'center',
        marginBottom: 24,
    },
    input: {
        marginBottom: 12,
    },
    button: {
        marginTop: 12,
        paddingVertical: 6,
    },
    switchButton: {
        marginTop: 12,
    }
});
