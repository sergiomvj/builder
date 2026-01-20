import fetch from 'node-fetch';

async function testDiceBearVersions() {
  const versions = ['9.x', '8.x', '6.x', '5.x'];
  const styles = ['avataaars', 'personas', 'big-smile', 'fun-emoji'];
  
  for (const version of versions) {
    for (const style of styles) {
      const url = `https://api.dicebear.com/${version}/${style}/svg?seed=John`;
      
      try {
        const response = await fetch(url);
        if (response.ok) {
          console.log(`✅ WORKING: ${version}/${style} - Status: ${response.status}`);
          return; // Para no primeiro que funcionar
        } else {
          console.log(`❌ ${version}/${style} - Status: ${response.status}`);
        }
      } catch (error) {
        console.log(`❌ ${version}/${style} - Error: ${error.message}`);
      }
    }
  }
}

testDiceBearVersions();