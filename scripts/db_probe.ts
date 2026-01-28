import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function probe() {
    console.log("Probing 'recipes' table...");

    // 1. Try to fetch one row to see columns
    const { data: rows, error: fetchError } = await supabase.from('recipes').select('*').limit(1);
    if (fetchError) {
        console.error("Fetch Error:", fetchError.message);
    } else if (rows && rows.length > 0) {
        console.log("Existing columns:", Object.keys(rows[0]));
    } else {
        console.log("No rows found. Attempting inserts...");
    }

    const dummy = {
        title: 'Probe Recipe',
        prep_time: 10,
        servings: 2,
        difficulty: 'Easy',
        // Excluding image fields first
    };

    // 2. Try Insert with NO image field
    console.log("Attempting Insert WITHOUT image field...");
    const { data: d1, error: e1 } = await supabase.from('recipes').insert(dummy).select();
    if (e1) console.error("Insert Basic Error:", e1.message);
    else console.log("Insert Basic Success:", d1?.[0]?.id);

    // 3. Try Insert with image_url
    console.log("Attempting Insert WITH image_url...");
    const { error: e2 } = await supabase.from('recipes').insert({ ...dummy, image_url: 'test.jpg' });
    if (e2) console.error("Insert image_url Error:", e2.message);
    else console.log("Insert image_url Success");

    // 4. Try Insert with image_filename
    console.log("Attempting Insert WITH image_filename...");
    const { error: e3 } = await supabase.from('recipes').insert({ ...dummy, image_filename: 'test.jpg' });
    if (e3) console.error("Insert image_filename Error:", e3.message);
    else console.log("Insert image_filename Success");

    // Cleanup
    if (d1?.[0]?.id) {
        await supabase.from('recipes').delete().eq('id', d1[0].id);
    }
}

probe();
