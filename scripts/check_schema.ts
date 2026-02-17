
// scripts/check_schema.ts
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseSecret = process.env.SUPABASE_SECRET_KEY!;

const supabase = createClient(supabaseUrl, supabaseSecret);

async function main() {
    console.log('--- Checking Schema ---');


    const tablesToCheck = ['company_users', 'users', 'members', 'employees'];
    let finalOutput = '';

    for (const table of tablesToCheck) {
        console.log(`\n--- employer.${table} ---`);
        const { data, error } = await supabase
            .schema('employer')
            .from(table)
            .select('*')
            .limit(1);

        if (data && data.length > 0) {
            finalOutput += `
--- employer.${table} ---
Columns: ${Object.keys(data[0]).join(', ')}
Sample: ${JSON.stringify(data[0], null, 2)}
            `;
        } else {
            console.log(`Error/Empty for ${table}:`, error || 'No rows');
            finalOutput += `\n--- employer.${table} --- Error: ${JSON.stringify(error)}`;
        }
    }

    console.log(finalOutput);
    fs.writeFileSync('schema_output.txt', finalOutput, 'utf8');
}

main();
