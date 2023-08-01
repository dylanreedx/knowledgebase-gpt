import {createClient} from '@supabase/supabase-js';

export const supabaseClient = async (supabaseAccessToken: string) => {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY as string;
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    global: {headers: {Authorization: `Bearer ${supabaseAccessToken}`}},
  });
  // set Supabase JWT on the client object,
  // so it is sent up with all Supabase requests
  return supabase;
};
