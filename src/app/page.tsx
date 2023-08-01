'use client';

import {SignIn, SignUp, UserButton, useAuth} from '@clerk/nextjs';
import Link from 'next/link';

export default function Chat() {
  const {getToken} = useAuth();
  const fetchData = async () => {
    const supabaseAccessToken = await getToken({template: 'supabase'});
    console.log(supabaseAccessToken);
  };

  fetchData();
  return (
    <main>
      <h1>YouTube Whisperer</h1>
      <Link href='/sign-in'>Sign in</Link>
      <UserButton />
    </main>
  );
}
