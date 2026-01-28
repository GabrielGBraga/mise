import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image, Platform } from 'react-native';
import { TextInput, Button, useTheme, Text, HelperText } from 'react-native-paper';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import IngredientInput from '../src/components/IngredientInput';
import { supabase } from '../src/lib/supabase';
import { useAuth } from '../src/context/AuthContext';
import { decode } from 'base64-arraybuffer';

const ingredientSchema = z.object({
    element: z.any().refine((val) => val != null, { message: "Ingredient is required" }),
    quantity: z.string().min(1, "Quantity is required"),
    unit: z.string().min(1, "Unit is required"),
});

const formSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    description: z.string().optional(),
    prep_time: z.string().regex(/^\d+$/, "Must be a number (minutes)"),
    servings: z.string().regex(/^\d+$/, "Must be a number"),
    difficulty: z.string().min(1, "Difficulty is required"),
    video_url: z.string().url("Must be a valid URL").optional().or(z.literal('')),
    ingredients: z.array(ingredientSchema).min(1, "At least one ingredient is required"),
    steps: z.array(z.object({ instruction: z.string().min(5, "Instruction too short") })).min(1, "At least one step is required"),
});

type FormData = z.infer<typeof formSchema>;

export default function CreateRecipeScreen() {
    const theme = useTheme();
    const router = useRouter();
    const { session } = useAuth();
    const [submitting, setSubmitting] = useState(false);
    const [image, setImage] = useState<string | null>(null);

    const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: '',
            description: '',
            prep_time: '',
            servings: '',
            difficulty: 'Easy',
            video_url: '',
            ingredients: [],
            steps: [{ instruction: '' }],
        },
    });

    const { fields: ingredientFields, append: appendIngredient, remove: removeIngredient } = useFieldArray({
        control,
        name: "ingredients",
    });

    const { fields: stepFields, append: appendStep, remove: removeStep } = useFieldArray({
        control,
        name: "steps",
    });

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
            base64: true,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const uploadImage = async (uri: string) => {
        try {
            // For web, we might need different handling, but keeping it simple for now as requested
            // Extract file extension
            const ext = uri.substring(uri.lastIndexOf('.') + 1);
            const fileName = `${Date.now()}.${ext}`;

            let fileData;
            if (Platform.OS === 'web') {
                // on web the uri is a blob or base64 already often suitable, but let's fetch it to blob
                const res = await fetch(uri);
                fileData = await res.blob();
            } else {
                // For native, we need to read file or use base64. 
                // Since we requested base64 in picker:
                // We need to re-read the result from picker if we didn't save base64
                // But let's assume standard uri upload for supabase which often needs Blob or ArrayBuffer
                const response = await fetch(uri);
                fileData = await response.blob();
            }


            const { data, error } = await supabase.storage
                .from('images')
                .upload(fileName, fileData, {
                    contentType: 'image/jpeg', // simplified, ideally detect type
                });

            if (error) throw error;
            return fileName; // Return the path/filename saved in bucket
        } catch (e) {
            console.error("Upload failed", e);
            throw e;
        }
    };

    const onSubmit = async (data: FormData) => {
        console.log(data);
        if (!session?.user) {
            Alert.alert("Error", "You must be logged in to create a recipe");
            return;
        }

        setSubmitting(true);
        try {
            let imagePath = '';
            if (image) {
                imagePath = await uploadImage(image);
            }

            // 1. Insert Recipe
            const { data: recipeData, error: recipeError } = await supabase
                .from('recipes')
                .insert({
                    user_id: session.user.id,
                    title: data.title,
                    description: data.description || '',
                    prep_time: parseInt(data.prep_time),
                    servings: parseInt(data.servings),
                    difficulty: data.difficulty,
                    imageFileName: imagePath, // Correct column name per user
                    video_url: data.video_url || '',
                })
                .select()
                .single();

            if (recipeError) throw recipeError;
            if (!recipeData) throw new Error("No recipe data returned");

            const recipeId = recipeData.id;

            // 2. Insert Ingredients
            if (data.ingredients.length > 0) {
                const ingredientsLoad = data.ingredients.map(ing => ({
                    recipe_id: recipeId,
                    element_id: ing.element.id,
                    quantity: parseFloat(ing.quantity),
                    unit: ing.unit
                }));
                const { error: ingError } = await supabase.from('ingredients').insert(ingredientsLoad);
                if (ingError) throw ingError;
            }

            // 3. Insert Steps (Instructions)
            const stepsLoad = data.steps.map((step, index) => ({
                recipe_id: recipeId,
                description: step.instruction, // Column is named 'description' in instructions table
                step_number: index + 1
            }));

            const { error: stepsError } = await supabase.from('instructions').insert(stepsLoad);
            if (stepsError) throw stepsError;

            Alert.alert("Success", "Recipe created!");
            router.back();

        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to create recipe");
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Controller
                control={control}
                name="title"
                render={({ field: { onChange, value } }) => (
                    <TextInput
                        label="Recipe Title"
                        value={value}
                        onChangeText={onChange}
                        mode="outlined"
                        style={styles.input}
                        error={!!errors.title}
                    />
                )}
            />
            <HelperText type="error" visible={!!errors.title}>{errors.title?.message}</HelperText>

            <Controller
                control={control}
                name="description"
                render={({ field: { onChange, value } }) => (
                    <TextInput
                        label="Description"
                        value={value}
                        onChangeText={onChange}
                        mode="outlined"
                        numberOfLines={3}
                        multiline
                        style={styles.input}
                    />
                )}
            />

            <View style={styles.imageContainer}>
                <Button mode="elevated" onPress={pickImage} icon="camera">
                    {image ? 'Change Image' : 'Pick Image'}
                </Button>
                {image && <Image source={{ uri: image }} style={styles.previewImage} />}
            </View>

            <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                    <Controller control={control} name="prep_time" render={({ field: { onChange, value } }) => (
                        <TextInput label="Prep Time (mins)" value={value} onChangeText={onChange} mode="outlined" keyboardType="numeric" error={!!errors.prep_time} />
                    )} />
                    <HelperText type="error" visible={!!errors.prep_time}>{errors.prep_time?.message}</HelperText>
                </View>
                <View style={{ flex: 1 }}>
                    <Controller control={control} name="servings" render={({ field: { onChange, value } }) => (
                        <TextInput label="Servings" value={value} onChangeText={onChange} mode="outlined" keyboardType="numeric" error={!!errors.servings} />
                    )} />
                    <HelperText type="error" visible={!!errors.servings}>{errors.servings?.message}</HelperText>
                </View>
            </View>

            <Controller control={control} name="difficulty" render={({ field: { onChange, value } }) => (
                <TextInput label="Difficulty" value={value} onChangeText={onChange} mode="outlined" style={styles.input} error={!!errors.difficulty} />
            )} />
            <HelperText type="error" visible={!!errors.difficulty}>{errors.difficulty?.message}</HelperText>

            <Controller control={control} name="video_url" render={({ field: { onChange, value } }) => (
                <TextInput label="Video URL" value={value || ''} onChangeText={onChange} mode="outlined" style={styles.input} error={!!errors.video_url} />
            )} />
            <HelperText type="error" visible={!!errors.video_url}>{errors.video_url?.message}</HelperText>


            <Text variant="titleMedium" style={styles.sectionTitle}>Ingredients</Text>
            {ingredientFields.map((field, index) => (
                <View key={field.id} style={styles.card}>
                    <Controller
                        control={control}
                        name={`ingredients.${index}`}
                        render={({ field: { onChange, value } }) => (
                            <IngredientInput
                                value={value || { element: null, quantity: '', unit: '' }}
                                onChange={onChange}
                            />
                        )}
                    />
                    <Button onPress={() => removeIngredient(index)} textColor={theme.colors.error}>Remove Ingredient</Button>
                    {errors.ingredients?.[index] && <HelperText type="error">Invalid Ingredient</HelperText>}
                </View>
            ))}
            <Button mode="outlined" onPress={() => appendIngredient({ element: null, quantity: '', unit: '' })} style={styles.addButton}>
                + Add Ingredient
            </Button>
            {errors.ingredients?.message && <HelperText type="error">{errors.ingredients.message}</HelperText>}


            <Text variant="titleMedium" style={styles.sectionTitle}>Steps</Text>
            {stepFields.map((field, index) => (
                <View key={field.id} style={styles.card}>
                    <Controller
                        control={control}
                        name={`steps.${index}.instruction`}
                        render={({ field: { onChange, value } }) => (
                            <TextInput
                                label={`Step ${index + 1}`}
                                value={value}
                                onChangeText={onChange}
                                mode="outlined"
                                multiline
                            />
                        )}
                    />
                    <Button onPress={() => removeStep(index)} textColor={theme.colors.error}>Remove Step</Button>
                </View>
            ))}
            <Button mode="outlined" onPress={() => appendStep({ instruction: '' })} style={styles.addButton}>
                + Add Step
            </Button>
            {errors.steps?.message && <HelperText type="error">{errors.steps.message}</HelperText>}

            <Button
                mode="contained"
                onPress={handleSubmit(onSubmit, (errors) => console.log(errors))}
                loading={submitting}
                style={styles.submitButton}
            >
                Create Recipe
            </Button>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    input: {
        marginBottom: 4,
    },
    row: {
        flexDirection: 'row',
    },
    sectionTitle: {
        marginTop: 24,
        marginBottom: 8,
    },
    addButton: {
        marginTop: 8,
    },
    submitButton: {
        marginTop: 32,
        marginBottom: 48,
    },
    card: {
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#eee',
        padding: 8,
        borderRadius: 8
    },
    imageContainer: {
        alignItems: 'center',
        marginBottom: 16,
        marginTop: 8,
    },
    previewImage: {
        width: 200,
        height: 150,
        marginTop: 10,
        borderRadius: 8,
    }
});
