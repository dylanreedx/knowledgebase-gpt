'use client';

import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {SignIn, SignUp, UserButton, useAuth} from '@clerk/nextjs';
import Link from 'next/link';

export default function Chat() {
  const {getToken, isSignedIn} = useAuth();
  const fetchData = async () => {
    const supabaseAccessToken = await getToken({template: 'supabase'});
    console.log(supabaseAccessToken);
  };

  fetchData();
  return (
    <main className='max-w-3xl mx-auto'>
      <header className='flex justify-between items-center py-6'>
        {!isSignedIn && (
          <Link href='/sign-in'>
            <Button>Sign In</Button>
          </Link>
        )}
      </header>

      <section>
        <h1 className='text-5xl font-bold text-center'>
          YouTube is the best way to learn in 2023. Understand videos faster.
        </h1>
        <div className='space-y-2'>
          <Label>YouTube video link</Label>
          <div className='flex items-center space-x-2'>
            <Input placeholder='https://www.youtube.com/watch?v=TGGwCG6AFz4' />
            <Link href='/sign-in'>
              <Button className='whitespace-nowrap'>Get Started</Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
