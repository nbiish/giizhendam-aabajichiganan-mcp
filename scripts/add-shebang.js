#!/usr/bin/env node
/**
 * Post-build script to add shebang line to dist/index.js
 * This ensures the file can be executed directly when installed via npm/npx
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const indexJsPath = path.join(rootDir, 'dist', 'index.js');

// Read the current content of the file
fs.readFile(indexJsPath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading file:', err);
    process.exit(1);
  }

  // Add shebang line if it doesn't already exist
  if (!data.startsWith('#!/usr/bin/env node')) {
    const modifiedContent = `#!/usr/bin/env node\n${data}`;
    
    // Write the modified content back to the file
    fs.writeFile(indexJsPath, modifiedContent, 'utf8', (err) => {
      if (err) {
        console.error('Error writing file:', err);
        process.exit(1);
      }
      console.log('✅ Shebang line added to dist/index.js');
      
      // Ensure the file is executable
      try {
        fs.chmodSync(indexJsPath, '755');
        console.log('✅ Executable permissions set on dist/index.js');
      } catch (err) {
        console.error('Error setting permissions:', err);
        process.exit(1);
      }
    });
  } else {
    console.log('✅ Shebang line already exists in dist/index.js');
  }
}); 