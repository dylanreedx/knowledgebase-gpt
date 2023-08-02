'use client';
import {SignUp} from '@clerk/nextjs';
import {useRouter, useSearchParams} from 'next/navigation';
import {useEffect} from 'react';

export default function Page() {
  const searchParams = useSearchParams();
  const videoUrl = searchParams.get('video');

  useEffect(() => {
    if (videoUrl) {
      // Store the video URL in the user's session or in a cookie
      window.sessionStorage.setItem('videoUrl', videoUrl);
    }
  }, [videoUrl]);
  return (
    <main className='min-h-screen w-full grid place-items-center'>
      <SignUp />;
    </main>
  );
}
