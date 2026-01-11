
import { supabaseAdmin } from '@/lib/supabase';

async function checkDB() {
    console.log('Checking Professional Users...');
    const { data: pro, error: proError } = await supabaseAdmin
        .schema('professional')
        .from('users')
        .select('*')
        .limit(1);

    if (proError) {
        console.error('Professional API Error:', proError);
    } else {
        console.log('Professional User Found:', pro ? pro.length : 0);
        if (pro && pro.length > 0) {
            console.log('Sample Professional Keys:', Object.keys(pro[0]));
        }
    }

    console.log('\nChecking Employer Companies...');
    const { data: emp, error: empError } = await supabaseAdmin
        .schema('employer')
        .from('companies')
        .select('*')
        .limit(1);

    if (empError) {
        console.error('Employer API Error:', empError);
    } else {
        console.log('Employer Company Found:', emp ? emp.length : 0);
        if (emp && emp.length > 0) {
            console.log('Sample Employer Keys:', Object.keys(emp[0]));
        }
    }
}

checkDB();
