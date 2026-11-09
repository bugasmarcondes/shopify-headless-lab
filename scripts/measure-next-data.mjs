// Prints the size of a page's __NEXT_DATA__ script.
// Usage: node scripts/measure-next-data.mjs [url]
const url = process.argv[2] ?? "http://localhost:3000/products/the-complete-snowboard";

const res = await fetch(url);
if (!res.ok) {
  console.error(`HTTP ${res.status} for ${url}`);
  process.exit(1);
}

const html = await res.text();
const match = html.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s);
if (!match) {
  console.error(`No __NEXT_DATA__ found in ${url}`);
  process.exit(1);
}

const kB = Buffer.byteLength(match[1], "utf8") / 1024;
console.log(`${url}  __NEXT_DATA__: ${kB.toFixed(2)} kB`);
