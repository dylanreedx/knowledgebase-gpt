import cp from 'child_process';
import fs from 'fs';
import ytdl from 'ytdl-core';
import path from 'path';

export async function POST(req: Request) {
  const {video} = await req.json();
  ytdl.getInfo(video).then((info) => {
    const format = ytdl.chooseFormat(info.formats, {quality: 'highestaudio'});
    const start = Date.now();

    const ffmpegProcess = cp.spawn(
      'ffmpeg',
      [
        '-i',
        'pipe:3',
        '-map',
        '0:a', // map only audio stream
        '-f',
        'segment',
        '-segment_time',
        '30', // split every 30 seconds
        '-c:a',
        'libmp3lame', // use libmp3lame codec for audio
        path.join('chunks', 'output%03d.mp3'), // output pattern
      ],
      {
        windowsHide: true,
        stdio: [
          /* Standard: stdin, stdout, stderr */
          'inherit',
          'inherit',
          'inherit',
          /* Custom: pipe:3, pipe:4 */
          'pipe',
          'pipe',
        ],
      }
    );

    ffmpegProcess.on('close', () => {
      console.log(`\ndone, thanks - ${(Date.now() - start) / 1000}s`);
    });

    ytdl
      .downloadFromInfo(info, {format: format})
      .pipe(ffmpegProcess.stdio[3] as any);
  });
}
