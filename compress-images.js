// compress-images.js
// Run from the root of follisense-web:
//
//   npm init -y                (only if there is no package.json yet)
//   npm install sharp --save-dev
//   node compress-images.js
//
// Writes to ./compressed/ — it never overwrites your originals. Check the
// output looks right, then copy the files over the originals and commit.
//
// Sizes below are based on how each image is ACTUALLY displayed on the page,
// at 2x for retina. There is no point shipping a 1170px screenshot into a
// frame that is 290px wide.

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const OUT = path.join(__dirname, 'compressed');

// filename → max width in pixels
const TARGETS = {
  // App screenshots. Frame is 290px wide on desktop, 186px on mobile.
  'shot-home.png':     600,
  'shot-photos.png':   600,
  'shot-progress.png': 600,
  'shot-knowit.png':   600,
  'shot-learn.png':    600,
  'shot-products.png': 600,
  'shot-foli.png':     600,
  'shot-routine.png':  600,

  // Hair type portraits. Displayed at 340px, 250px on mobile.
  'type1.jpg':   700,
  'type2.jpg':   700,
  'type3.jpg':   700,
  'type4.jpg':   700,
  'locs.jpg':    700,
  'relaxed.jpg': 700,

  // Matched comparison pair. Two columns inside a 440px block, so ~214px each.
  'compare-a.jpg': 480,
  'compare-b.jpg': 480,

  // Wide photo panels. Displayed at 440px, 300px on mobile.
  'men.jpg':   900,
  'style.jpg': 900,

  // Full-bleed hero background. This one genuinely needs to be large.
  'hero.jpg': 2400,
};

const kb = (bytes) => (bytes / 1024).toFixed(0) + ' KB';

async function run() {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT);

  let before = 0;
  let after = 0;
  let done = 0;
  const missing = [];

  for (const [file, maxWidth] of Object.entries(TARGETS)) {
    const src = path.join(__dirname, file);

    if (!fs.existsSync(src)) {
      missing.push(file);
      continue;
    }

    const srcSize = fs.statSync(src).size;
    const ext = path.extname(file).toLowerCase();
    const dest = path.join(OUT, file);

    let pipeline = sharp(src).resize({
      width: maxWidth,
      withoutEnlargement: true, // never upscale a small original
    });

    if (ext === '.png') {
      // UI screenshots are flat colour, so a quantised palette is a huge win
      // with no visible difference.
      pipeline = pipeline.png({ palette: true, quality: 80, compressionLevel: 9 });
    } else {
      // mozjpeg gives noticeably smaller files at the same visual quality.
      pipeline = pipeline.jpeg({ quality: 78, mozjpeg: true, progressive: true });
    }

    await pipeline.toFile(dest);

    const destSize = fs.statSync(dest).size;
    before += srcSize;
    after += destSize;
    done++;

    const saved = Math.round((1 - destSize / srcSize) * 100);
    console.log(
      `${file.padEnd(20)} ${kb(srcSize).padStart(9)} → ${kb(destSize).padStart(9)}  (${saved}% smaller)`
    );
  }

  console.log('');
  console.log(`${done} file(s) processed`);
  console.log(`Total: ${kb(before)} → ${kb(after)}`);

  if (missing.length) {
    console.log('');
    console.log('Not found, skipped:');
    missing.forEach((f) => console.log('  ' + f));
  }

  console.log('');
  console.log('Output is in ./compressed/ — check it, then copy over the originals.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});