import { readFile } from "node:fs/promises";
import sharp from "sharp";

const source = process.argv[2] || "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_land.geojson";
const output = process.argv[3] || "public/assets/textures/earth_land_mask_2048.webp";
const width = 2048;
const height = 1024;

const geojson = source.startsWith("http")
  ? await fetch(source).then((response) => {
      if (!response.ok) throw new Error(`Unable to download land geometry: ${response.status}`);
      return response.json();
    })
  : JSON.parse(await readFile(source, "utf8"));

const project = ([longitude, latitude]) => [
  ((longitude + 180) / 360) * width,
  ((90 - latitude) / 180) * height,
];

const ringPath = (ring) => ring.map((coordinate, index) => {
  const [x, y] = project(coordinate);
  return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
}).join("") + "Z";

const polygonPath = (polygon) => polygon.map(ringPath).join("");
const paths = geojson.features.map(({ geometry }) => {
  if (!geometry) return "";
  if (geometry.type === "Polygon") return polygonPath(geometry.coordinates);
  if (geometry.type === "MultiPolygon") return geometry.coordinates.map(polygonPath).join("");
  return "";
}).join("");

const svg = Buffer.from(`
  <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="100%" height="100%" fill="black"/>
    <path d="${paths}" fill="white" fill-rule="evenodd"/>
  </svg>
`);

await sharp(svg, { density: 144 })
  .resize(width, height, { fit: "fill" })
  .webp({ lossless: true, effort: 6 })
  .toFile(output);

console.log(`Generated ${output} from Natural Earth 1:50m land geometry.`);
