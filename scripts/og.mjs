import sharp from "sharp";

await sharp("src/assets/images/fachada.png")
  .rotate()
  .resize(1200, 630, { fit: "cover", position: "centre" })
  .jpeg({ quality: 74, mozjpeg: true })
  .toFile("public/og.jpg");
