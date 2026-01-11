import { promises as fs } from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const pagesDir = path.join(rootDir, 'src', 'pages');
const outputDir = path.join(rootDir, 'dist');
const assetsDir = path.join(rootDir, 'assets');

const resolveIncludes = async (html) => {
  const includePattern = /<include\s+src="([^"]+)"\s*><\/include>/g;
  let match = includePattern.exec(html);
  while (match) {
    const includePath = path.join(rootDir, match[1]);
    const partial = await fs.readFile(includePath, 'utf8');
    const resolvedPartial = await resolveIncludes(partial);
    html = html.replace(match[0], resolvedPartial);
    match = includePattern.exec(html);
  }
  return html;
};

await fs.rm(outputDir, { recursive: true, force: true });
await fs.mkdir(outputDir, { recursive: true });
await fs.cp(assetsDir, path.join(outputDir, 'assets'), { recursive: true });

const entries = await fs.readdir(pagesDir);
const htmlFiles = entries.filter((file) => file.endsWith('.html'));

await Promise.all(
  htmlFiles.map(async (file) => {
    const sourcePath = path.join(pagesDir, file);
    const html = await fs.readFile(sourcePath, 'utf8');
    const resolved = await resolveIncludes(html);
    const outputPath = path.join(outputDir, file);
    await fs.writeFile(outputPath, resolved);
  })
);
