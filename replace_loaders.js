const fs = require('fs');
const path = require('path');

const srcDir = path.join('c:', 'Users', 'Zunera Kamran', 'Desktop', 'elearning-frontend', 'src');

function findAndReplace(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            findAndReplace(fullPath);
        } else if (fullPath.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            // Replace <p ...>Loading...</p> patterns
            const regex = /<p[^>]*>Loading([^<]*)<\/p>/gi;
            
            if (regex.test(content) && fullPath.indexOf('Loader.jsx') === -1) {
                // If it has a Loading tag, make sure Loader is imported
                if (!content.includes("import Loader from")) {
                    const depth = fullPath.substring(srcDir.length).split(path.sep).length - 2;
                    let relPath = '../'.repeat(Math.max(0, depth)) + 'components/Loader';
                    if (depth < 0) relPath = './components/Loader';
                    
                    // Insert import after the last import statement
                    const importRegex = /import\s+.*?;?\n/g;
                    let lastIndex = 0;
                    let match;
                    while ((match = importRegex.exec(content)) !== null) {
                        lastIndex = importRegex.lastIndex;
                    }
                    content = content.slice(0, lastIndex) + `import Loader from '${relPath}';\n` + content.slice(lastIndex);
                }

                content = content.replace(regex, (match, p1) => {
                    const text = `Loading${p1}`.trim();
                    return `<Loader text="${text}" />`;
                });
                modified = true;
            }

            if (modified) {
                fs.writeFileSync(fullPath, content);
                console.log(`Updated ${fullPath}`);
            }
        }
    }
}

findAndReplace(srcDir);
