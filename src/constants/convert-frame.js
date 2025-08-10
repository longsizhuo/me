// convert-frame.js
import fs from "fs";
import Jimp from "jimp";

const asciiRamp = '@#W$9876543210?!abc;:+=-,._ ';

export async function convertImageToAscii(path, outPath) {
  const img = await Jimp.read(path);
  img.resize(80, 60).grayscale();
  let ascii = '';

  for (let y = 0; y < img.bitmap.height; y++) {
    for (let x = 0; x < img.bitmap.width; x++) {
      const pixel = img.getPixelColor(x, y);
      const { r } = Jimp.intToRGBA(pixel);
      const char = asciiRamp[Math.floor(r / 256 * asciiRamp.length)];
      ascii += char;
    }
    ascii += '\n';
  }

  fs.writeFileSync(outPath, ascii);
}