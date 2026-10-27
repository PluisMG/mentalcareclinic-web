import sharp from "sharp";

await sharp("src/assets/images/fachada.png")
  .rotate()
  .jpeg({ quality: 74, mozjpeg: true })
  .toFile("public/og.jpg");
