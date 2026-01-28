import React, { useCallback, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, FAB, useTheme, Searchbar, Card, Chip, ActivityIndicator, Button } from 'react-native-paper';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../src/lib/supabase';
import { useAuth } from '../src/context/AuthContext';

type Recipe = {
    id: string;
    title: string;
    description: string;
    prep_time: number;
    servings: number;
    difficulty: string;
    imageFileName: string | null;
    video_url: string | null;
};

export default function RecipeListScreen() {
    const theme = useTheme();
    const router = useRouter();
    const { session } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const fetchRecipes = async () => {
        setLoading(true);
        let query = supabase.from('recipes').select('*').order('created_at', { ascending: false });

        if (searchQuery) {
            query = query.ilike('title', `%${searchQuery}%`);
        }

        const { data, error } = await query;
        if (error) {
            console.error(error);
        } else {
            setRecipes(data || []);
        }
        setLoading(false);
    };

    useFocusEffect(
        useCallback(() => {
            fetchRecipes();
        }, [searchQuery])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchRecipes();
        setRefreshing(false);
    }

    const getImageUrl = (path: string | null) => {
        if (!path) return null;
        const { data } = supabase.storage.from('images').getPublicUrl(path);
        return data.publicUrl;
    }



    const renderItem = ({ item }: { item: Recipe }) => {
        const imageUrl = getImageUrl(item.imageFileName);

        return (
            <Card style={styles.card} onPress={() => router.push(`/recipe/${item.id}`)}>
                {imageUrl && <Card.Cover source={{ uri: imageUrl }} />}
                <Card.Title title={item.title} subtitle={`${item.servings} Servings • ${item.prep_time} mins`} />
                <Card.Content>
                    {item.description ? <Text variant="bodyMedium" numberOfLines={2} style={{ marginBottom: 8 }}>{item.description}</Text> : null}
                    <View style={styles.cardContent}>
                        <Chip icon="chef-hat" style={styles.chip}>{item.difficulty}</Chip>
                    </View>
                </Card.Content>
            </Card>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.header}>
                <Searchbar
                    placeholder="Search recipes..."
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={styles.searchbar}
                    elevation={1}
                />
            </View>

            {loading && !refreshing && <ActivityIndicator animating={true} style={{ marginTop: 20 }} />}

            <FlatList
                data={recipes}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={!loading ? <Text style={styles.empty}>No recipes found.</Text> : null}
            />

            <FAB
                icon="plus"
                style={[styles.fab, { backgroundColor: theme.colors.primary }]}
                color={theme.colors.onPrimary}
                onPress={() => router.push('/create-recipe')}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        alignItems: 'flex-start'
    },
    searchbar: {
        marginVertical: 16,
        flex: 1,
    },
    list: {
        paddingHorizontal: 16,
        paddingBottom: 80,
    },
    card: {
        marginBottom: 12,
    },
    cardContent: {
        flexDirection: 'row',
        marginTop: 4
    },
    chip: {
        marginRight: 8
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
    },
    empty: {
        textAlign: 'center',
        marginTop: 20,
        opacity: 0.6
    }
});
