const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const resDir = path.resolve(__dirname, '../android/app/src/main/res');
const logoSvgPath = path.resolve(__dirname, '../public/logo.svg');
const svgBuffer = fs.readFileSync(logoSvgPath);

async function generate() {
  console.log('Generating Android icons and splash from logo.svg...');

  // Target specs
  const mipmaps = [
    { folder: 'mipmap-mdpi', iconSize: 48, fgSize: 108 },
    { folder: 'mipmap-hdpi', iconSize: 72, fgSize: 162 },
    { folder: 'mipmap-xhdpi', iconSize: 96, fgSize: 216 },
    { folder: 'mipmap-xxhdpi', iconSize: 144, fgSize: 324 },
    { folder: 'mipmap-xxxhdpi', iconSize: 192, fgSize: 432 },
  ];

  for (const m of mipmaps) {
    const targetDir = path.join(resDir, m.folder);

    // 1. ic_launcher_foreground.png (transparent background, logo in center 65%)
    const fgLogoSize = Math.round(m.fgSize * 0.65);
    const fgLogo = await sharp(svgBuffer)
      .resize(fgLogoSize, fgLogoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    await sharp({
      create: {
        width: m.fgSize,
        height: m.fgSize,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
      .composite([{ input: fgLogo, gravity: 'center' }])
      .png()
      .toFile(path.join(targetDir, 'ic_launcher_foreground.png'));

    // 2. ic_launcher.png (White background with slight rounded rect mask, logo in center 72%)
    const iconLogoSize = Math.round(m.iconSize * 0.72);
    const iconLogo = await sharp(svgBuffer)
      .resize(iconLogoSize, iconLogoSize, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .toBuffer();

    const radius = Math.round(m.iconSize * 0.18);
    const roundedMask = Buffer.from(
      `<svg width="${m.iconSize}" height="${m.iconSize}"><rect x="0" y="0" width="${m.iconSize}" height="${m.iconSize}" rx="${radius}" ry="${radius}" fill="#fff"/></svg>`
    );

    const baseSquare = await sharp({
      create: {
        width: m.iconSize,
        height: m.iconSize,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
      .composite([{ input: iconLogo, gravity: 'center' }])
      .png()
      .toBuffer();

    await sharp(baseSquare)
      .composite([{ input: roundedMask, blend: 'dest-in' }])
      .png()
      .toFile(path.join(targetDir, 'ic_launcher.png'));

    // 3. ic_launcher_round.png (Circular mask on white background)
    const circleMask = Buffer.from(
      `<svg width="${m.iconSize}" height="${m.iconSize}"><circle cx="${m.iconSize/2}" cy="${m.iconSize/2}" r="${m.iconSize/2}" fill="#fff"/></svg>`
    );

    await sharp(baseSquare)
      .composite([{ input: circleMask, blend: 'dest-in' }])
      .png()
      .toFile(path.join(targetDir, 'ic_launcher_round.png'));

    console.log(`Generated icons for ${m.folder}`);
  }

  // 4. Splashes
  const splashes = [
    { file: 'drawable/splash.png', w: 480, h: 320 },
    { file: 'drawable-land-mdpi/splash.png', w: 480, h: 320 },
    { file: 'drawable-land-hdpi/splash.png', w: 800, h: 480 },
    { file: 'drawable-land-xhdpi/splash.png', w: 1280, h: 720 },
    { file: 'drawable-land-xxhdpi/splash.png', w: 1600, h: 960 },
    { file: 'drawable-land-xxxhdpi/splash.png', w: 1920, h: 1280 },
    { file: 'drawable-port-mdpi/splash.png', w: 320, h: 480 },
    { file: 'drawable-port-hdpi/splash.png', w: 480, h: 800 },
    { file: 'drawable-port-xhdpi/splash.png', w: 720, h: 1280 },
    { file: 'drawable-port-xxhdpi/splash.png', w: 960, h: 1600 },
    { file: 'drawable-port-xxxhdpi/splash.png', w: 1280, h: 1920 },
  ];

  for (const s of splashes) {
    const targetPath = path.join(resDir, s.file);
    const minDim = Math.min(s.w, s.h);
    const splashLogoSize = Math.max(80, Math.round(minDim * 0.32));

    const logo = await sharp(svgBuffer)
      .resize(splashLogoSize, splashLogoSize, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .toBuffer();

    await sharp({
      create: {
        width: s.w,
        height: s.h,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
      .composite([{ input: logo, gravity: 'center' }])
      .png()
      .toFile(targetPath);

    console.log(`Generated splash for ${s.file}`);
  }

  console.log('All Android assets generated successfully!');
}

generate().catch(err => {
  console.error('Failed to generate android assets:', err);
  process.exit(1);
});
