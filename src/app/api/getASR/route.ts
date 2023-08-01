import {HfInference} from '@huggingface/inference';
import fs from 'fs';
import path from 'path';

const Hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

export async function POST() {
  // get audio from video
  const dir = fs.opendirSync('chunks');
  let dirent;
  while ((dirent = dir.readSync()) !== null) {
    const buffer = fs.readFileSync(path.join('chunks', dirent.name));
    const arrayBuffer = Uint8Array.from(buffer).buffer;
    try {
      const text = Hf.automaticSpeechRecognition({
        model: 'jonatasgrosman/wav2vec2-large-xlsr-53-english',
        data: arrayBuffer,
      });

      text
        .then((text) => {
          console.log('text: -------', text);
        })
        .catch((err) => {
          console.log('error: -------', err);
        });
    } catch (error) {
      console.log(error);
    }
  }
  dir.closeSync();
}
