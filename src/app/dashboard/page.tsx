'use client';
import {useEffect} from 'react';
import {useAuth, useUser} from '@clerk/nextjs';
import axios from 'axios';

export default function Dashboard() {
  const {user} = useUser();
  const {getToken} = useAuth();

  const uploadAudio = async (videoUrl: string) => {
    const token = await getToken({template: 'supabase'});

    await axios.post('/api/video', {
      video: videoUrl,
      token: token,
    });
  };

  useEffect(() => {
    if (user) {
      const videoUrl = window.sessionStorage.getItem('videoUrl');
      console.log(videoUrl);
      if (videoUrl) {
        uploadAudio(videoUrl);
      }
    }
  }, [user]);
  return (
    <main className='min-h-screen w-full grid place-items-center'>
      <h1>Dashboard</h1>
    </main>
  );
}
