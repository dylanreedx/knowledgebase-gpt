// import {} from 'ai';
// import {} from 'langchain/';
import axios from 'axios';

async function search(query: string) {
  const serperApiKey = process.env.SERP_API_KEY;
  const url = 'https://google.serper.dev/search';

  const payload = {
    q: query,
  };

  const headers = {
    'X-API-KEY': serperApiKey,
    'Content-Type': 'application/json',
  };

  try {
    const response = await axios.post(url, payload, {headers: headers});
    return response.data;
  } catch (error) {
    console.log(error);
  }
}

export async function GET(req: Request) {
  console.log(await search('Why is threads so popular so fast?'));
}
