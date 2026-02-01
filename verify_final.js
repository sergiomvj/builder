async function checkApi() {
    try {
        const res = await fetch('http://localhost:3001/api/projects');
        const text = await res.text();
        try {
            const data = JSON.parse(text);
            if (data.projects) {
                console.log(`Success! Found ${data.projects.length} projects.`);
                if (data.projects.length > 0) {
                    console.log('Project Keys:', Object.keys(data.projects[0]));
                    console.log('Sample created_at:', data.projects[0].created_at);
                }
            } else {
                console.log('Failed: No projects field', data);
            }
        } catch (e) {
            console.log('Failed to parse JSON:', text.substring(0, 100));
        }
    } catch (e) {
        console.error('Connection failed:', e.message);
    }
}
checkApi();
