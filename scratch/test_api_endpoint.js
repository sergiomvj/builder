import fetch from 'node-fetch';

async function testApi() {
  console.log('Testing /api/analyze-idea...');
  try {
    const response = await fetch('http://localhost:3001/api/analyze-idea', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idea: 'Um portal para brasileiros nos EUA que oferece serviços de imigração e notícias.',
      }),
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Fetch Error:', error.message);
  }
}

testApi();
