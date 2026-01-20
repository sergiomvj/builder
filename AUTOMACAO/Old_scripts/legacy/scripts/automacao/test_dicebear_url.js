import fetch from 'node-fetch';

async function testDiceBearUrl() {
  const name = 'Robert Davis';
  const url = `https://api.dicebear.com/7.x/professional/svg?seed=${encodeURIComponent(name)}&backgroundColor=e3f2fd&clothingColor=1976d2`;
  
  console.log('URL:', url);
  
  try {
    const response = await fetch(url);
    console.log('Status:', response.status);
    console.log('Content-Type:', response.headers.get('content-type'));
    
    if (response.ok) {
      const content = await response.text();
      console.log('Content length:', content.length);
      console.log('First 200 chars:', content.substring(0, 200));
    } else {
      console.log('Error response:', await response.text());
    }
  } catch (error) {
    console.error('Fetch error:', error.message);
  }
}

testDiceBearUrl();