
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ypvzqbhjesrxikftgqkr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_UwI0SXZN3WxZtF0hrVc5Rg_qd5TLQOU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
