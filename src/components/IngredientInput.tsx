import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, List, Modal, Portal, Button, Text, TouchableRipple, useTheme } from 'react-native-paper';
import { supabase } from '../lib/supabase';

type Element = {
    id: string;
    name: string;
    units: string[];
};

type IngredientInputProps = {
    value: { element: Element | null; quantity: string; unit: string };
    onChange: (value: { element: Element | null; quantity: string; unit: string }) => void;
};

export default function IngredientInput({ value, onChange }: IngredientInputProps) {
    const [query, setQuery] = useState('');
    const [elements, setElements] = useState<Element[]>([]);
    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const theme = useTheme();

    const searchElements = async (text: string) => {
        setQuery(text);
        if (text.length < 2) {
            setElements([]);
            return;
        }
        setLoading(true);
        const { data, error } = await supabase
            .from('elements')
            .select()
            .ilike('name', `%${text}%`)
            .limit(10);

        if (!error && data) {
            setElements(data);
            console.log(data);
        }
        setLoading(false);
    };

    const selectElement = (element: Element) => {
        onChange({ ...value, element, unit: element.units[0] || '' });
        setVisible(false);
        setQuery('');
    };

    const UnitSelector = () => {
        if (!value.element || !value.element.units.length) return null;

        return (
            <View style={styles.unitContainer}>
                {value.element.units.map((u) => (
                    <TouchableRipple
                        key={u}
                        onPress={() => onChange({ ...value, unit: u })}
                        style={[
                            styles.unitChip,
                            { backgroundColor: value.unit === u ? theme.colors.primaryContainer : theme.colors.surfaceVariant }
                        ]}
                    >
                        <Text style={{ color: value.unit === u ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant }}>{u}</Text>
                    </TouchableRipple>
                ))}
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <Button mode="outlined" onPress={() => setVisible(true)}>
                {value.element ? value.element.name : 'Select Ingredient'}
            </Button>

            <Portal>
                <Modal visible={visible} onDismiss={() => setVisible(false)} contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}>
                    <TextInput
                        label="Search Ingredient"
                        value={query}
                        onChangeText={(value) => searchElements(value)}
                        autoFocus
                    />
                    <ScrollView style={styles.list}>
                        {elements.map((el) => (
                            <List.Item
                                key={el.id}
                                title={el.name}
                                onPress={() => selectElement(el)}
                            />
                        ))}
                    </ScrollView>
                </Modal>
            </Portal>

            <View style={styles.row}>
                <TextInput
                    label="Quantity"
                    value={value.quantity}
                    onChangeText={(t) => onChange({ ...value, quantity: t })}
                    keyboardType="numeric"
                    style={{ flex: 1, marginRight: 8 }}
                />
                <View style={{ flex: 1, justifyContent: 'center' }}>
                    <UnitSelector />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    modal: {
        padding: 20,
        margin: 20,
        borderRadius: 8,
        height: '50%',
    },
    list: {
        marginTop: 10,
    },
    row: {
        flexDirection: 'row',
        marginTop: 8,
    },
    unitContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4
    },
    unitChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginRight: 4,
    }
});
