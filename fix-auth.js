const fs = require('fs');
const path = require('path');

const servicesDir = path.join(__dirname, 'src', 'services');

function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Replace getUser() with getSession()
    const oldPattern = /const \{ data: \{ user \} \} = await supabase\.auth\.getUser\(\);/g;
    const newCode = `const { data: { session } } = await supabase.auth.getSession();\n        const user = session?.user;`;

    content = content.replace(oldPattern, newCode);

    fs.writeFileSync(filePath, content, 'utf8');
}

// Get all .service.ts files
const serviceFiles = fs.readdirSync(servicesDir)
    .filter(file => file.endsWith('.service.ts'))
    .map(file => path.join(servicesDir, file));

console.log(`Found ${serviceFiles.length} service files`);

serviceFiles.forEach(file => {
    console.log(`Processing: ${path.basename(file)}`);
    replaceInFile(file);
});

console.log('✅ All files updated!');
