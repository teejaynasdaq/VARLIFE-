const fs = require('fs');
const path = require('path');

const walk = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.git') && !file.includes('.expo')) {
        results = results.concat(walk(file));
      }
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.json')) {
        results.push(file);
      }
    }
  });
  return results;
};

const files = walk('c:/Users/TeeJay Shabangu/Downloads/node projects/uber-main/uber-main/app').concat(
  walk('c:/Users/TeeJay Shabangu/Downloads/node projects/uber-main/uber-main/lib'),
  walk('c:/Users/TeeJay Shabangu/Downloads/node projects/uber-main/uber-main/components'),
  walk('c:/Users/TeeJay Shabangu/Downloads/node projects/uber-main/uber-main/context'),
  walk('c:/Users/TeeJay Shabangu/Downloads/node projects/uber-main/uber-main/hooks')
);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content;
  
  // Replace supabase imports
  newContent = newContent.replace(/@\/lib\/supabase/g, '@/lib/database');
  
  // Replace supabase variable
  newContent = newContent.replace(/\bsupabase\b/g, 'database');
  newContent = newContent.replace(/\bSupabase\b/g, 'Database');
  newContent = newContent.replace(/\bsupabaseWithAuth\b/g, 'databaseWithAuth');
  
  // Clerk refs
  newContent = newContent.replace(/\.clerk_id\b/g, '.id');
  newContent = newContent.replace(/\bclerk_id\b/g, 'id');
  newContent = newContent.replace(/\bclerkIdToUuid\b/g, 'ensureUuid');
  
  if (content !== newContent) {
    fs.writeFileSync(file, newContent);
    console.log('Updated: ' + file);
  }
});
