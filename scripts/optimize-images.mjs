import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';

const PUBLIC_DIR = new URL('../public/', import.meta.url).pathname;
const MAX_WIDTH = 1600;
const WEBP_QUALITY = 80;

const files = await readdir(PUBLIC_DIR);
const jpgFiles = files.filter((f) => /\.jpe?g$/i.test(f));

console.log(`Found ${jpgFiles.length} JPEG files in public/\n`);

for (const file of jpgFiles) {
	const inputPath = join(PUBLIC_DIR, file);
	const outputPath = join(PUBLIC_DIR, file.replace(/\.jpe?g$/i, '.webp'));

	const image = sharp(inputPath);
	const metadata = await image.metadata();
	const needsResize = metadata.width && metadata.width > MAX_WIDTH;

	const pipeline = needsResize ? image.resize({ width: MAX_WIDTH, withoutEnlargement: true }) : image;

	await pipeline.webp({ quality: WEBP_QUALITY }).toFile(outputPath);

	const origSize = ((metadata.size || 0) / 1024).toFixed(0);
	const { size: newSize } = await sharp(outputPath).metadata();
	const webpSize = ((newSize || 0) / 1024).toFixed(0);
	const saved = origSize > 0 ? ((1 - webpSize / origSize) * 100).toFixed(0) : '?';

	console.log(
		`${file} → .webp  |  ${origSize}KB → ${webpSize}KB  (${saved}% smaller)${needsResize ? '  [resized to ' + MAX_WIDTH + 'px]' : ''}`
	);
}

console.log(`\nDone! Generated ${jpgFiles.length} WebP files.`);
