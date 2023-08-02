'use client';

import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {SignOutButton, useAuth} from '@clerk/nextjs';
import Link from 'next/link';
import {useState} from 'react';

export default function Chat() {
  const {isSignedIn} = useAuth();
  const [url, setUrl] = useState<string>('');

  return (
    <main className='max-w-3xl mx-auto'>
      <header className='flex justify-between items-center py-6'>
        {!isSignedIn ? (
          <Link href='/sign-up'>
            <Button>Sign In</Button>
          </Link>
        ) : (
          <SignOutButton />
        )}
      </header>

      <section>
        <h1 className='text-5xl font-bold text-center'>
          YouTube is the best way to learn in 2023. Understand videos faster.
        </h1>
        <div className='space-y-2'>
          <Label>YouTube video link</Label>
          <div className='flex items-center space-x-2'>
            <Input
              placeholder='https://www.youtube.com/watch?v=TGGwCG6AFz4'
              onChange={(e) => setUrl(e.target.value)}
              value={url}
            />
            <Button className='whitespace-nowrap' disabled={url.length < 5}>
              <Link href={`/sign-up?video=${url}`}>Get Started</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
