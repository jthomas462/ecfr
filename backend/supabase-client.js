import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabaseUrl = 'https://krdmxioxgrokztooixxr.supabase.co'
const supabaseKey = process.env.SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;