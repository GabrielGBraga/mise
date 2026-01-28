import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Image } from 'react-native';
import { Text, ActivityIndicator, List, useTheme, Chip, Surface } from 'react-native-paper';
import { useLocalSearchParams, Stack } from 'expo-router';
import { supabase } from '../../src/lib/supabase';

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

type Ingredient = {
    id: string;
    quantity: number;
    unit: string;
    element: {
        name: string;
    } | null;
};

type Instruction = {
    id: string;
    description: string;
    step_number: number;
};

export default function RecipeDetailScreen() {
    const { id } = useLocalSearchParams();
    const theme = useTheme();
    const [recipe, setRecipe] = useState<Recipe | null>(null);
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [instructions, setInstructions] = useState<Instruction[]>([]);
    const [loading, setLoading] = useState(true);
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            fetchRecipeDetails(id.toString());
        }
    }, [id]);

    const fetchRecipeDetails = async (recipeId: string) => {
        setLoading(true);
        try {
            // 1. Fetch Recipe
            const { data: recipeData, error: recipeError } = await supabase
                .from('recipes')
                .select('*')
                .eq('id', recipeId)
                .single();

            if (recipeError) throw recipeError;
            setRecipe(recipeData);

            if (recipeData.imageFileName) {
                const { data: imgData } = supabase.storage.from('images').getPublicUrl(recipeData.imageFileName);
                setImageUrl(imgData.publicUrl);
            }

            // 2. Fetch Ingredients
            const { data: ingData, error: ingError } = await supabase
                .from('ingredients')
                .select('id, quantity, unit, element:elements(name)')
                .eq('recipe_id', recipeId);

            if (ingError) throw ingError;

            // Fix: Supabase might return element as array or object depending on inference. 
            // We map it to ensure it fits our Ingredient type.
            const formattedIngredients: Ingredient[] = (ingData as any[]).map(item => ({
                id: item.id,
                quantity: item.quantity,
                unit: item.unit,
                element: Array.isArray(item.element) ? item.element[0] : item.element
            }));

            setIngredients(formattedIngredients);

            // 3. Fetch Instructions
            const { data: instData, error: instError } = await supabase
                .from('instructions')
                .select('*')
                .eq('recipe_id', recipeId)
                .order('step_number', { ascending: true });

            if (instError) throw instError;
            setInstructions(instData || []);

        } catch (error) {
            console.error("Error fetching details:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    if (!recipe) {
        return (
            <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
                <Text>Recipe not found.</Text>
            </View>
        );
    }

    return (
        <>
            <Stack.Screen options={{ title: recipe.title }} />
            <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
                {imageUrl && (
                    <Image source={{ uri: imageUrl }} style={styles.image} />
                )}

                <View style={styles.content}>
                    <Text variant="headlineMedium" style={styles.title}>{recipe.title}</Text>

                    <View style={styles.statsRow}>
                        <Chip icon="clock-outline" style={styles.chip}>{recipe.prep_time} mins</Chip>
                        <Chip icon="account-group" style={styles.chip}>{recipe.servings} servings</Chip>
                        <Chip icon="chef-hat" style={styles.chip}>{recipe.difficulty}</Chip>
                    </View>

                    {recipe.description ? (
                        <Text variant="bodyMedium" style={styles.description}>
                            {recipe.description}
                        </Text>
                    ) : null}

                    <Surface style={styles.section} elevation={1}>
                        <Text variant="titleLarge" style={styles.sectionHeader}>Ingredients</Text>
                        {ingredients.map((ing) => (
                            <List.Item
                                key={ing.id}
                                title={`${ing.element?.name || 'Unknown'}`}
                                description={`${ing.quantity} ${ing.unit}`}
                                left={props => <List.Icon {...props} icon="food-variant" />}
                            />
                        ))}
                        {ingredients.length === 0 && <Text style={styles.emptyText}>No ingredients listed.</Text>}
                    </Surface>

                    <Surface style={styles.section} elevation={1}>
                        <Text variant="titleLarge" style={styles.sectionHeader}>Instructions</Text>
                        {instructions.map((step) => (
                            <List.Item
                                key={step.id}
                                title={`Step ${step.step_number}`}
                                description={step.description}
                                descriptionNumberOfLines={10}
                                left={props => <List.Icon {...props} icon="numeric" />}
                            />
                        ))}
                        {instructions.length === 0 && <Text style={styles.emptyText}>No instructions listed.</Text>}
                    </Surface>
                </View>
            </ScrollView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: '100%',
        height: 250,
        resizeMode: 'cover',
    },
    content: {
        padding: 16,
        paddingBottom: 40,
    },
    title: {
        fontWeight: 'bold',
        marginBottom: 16,
    },
    statsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    chip: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#ccc',
    },
    description: {
        marginBottom: 24,
        lineHeight: 22,
    },
    section: {
        marginBottom: 24,
        padding: 16,
        borderRadius: 12,
    },
    sectionHeader: {
        marginBottom: 12,
        fontWeight: 'bold',
    },
    emptyText: {
        fontStyle: 'italic',
        opacity: 0.6,
    }
});
