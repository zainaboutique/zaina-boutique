// Makes the admin Products list fast: shows 30 products at a time, with a
// search box and a "Show more" button, instead of drawing all of them at once.
// Run from the sky-store folder:  node scripts/patch-products-list.js
const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", "app", "admin", "products", "page.tsx");
let text = fs.readFileSync(file, "utf8");
const crlf = text.includes("\r\n");
text = text.replace(/\r\n/g, "\n");

if (text.includes("visibleProducts")) {
  console.log("Already done. Nothing to do.");
  process.exit(0);
}

const stateAnchor = "  const csvInputRef = useRef<HTMLInputElement>(null);\n";
const returnAnchor = '  return (\n    <div>\n      <div className="flex flex-wrap items-center justify-between gap-3">';
const wrapperAnchor = '<div className="bg-white rounded-2xl shadow-card mt-6 overflow-x-auto">';
const mapAnchor = "products.map((p) => (";
const tbodyAnchor = "</tbody>";

for (const [name, a] of [["state line", stateAnchor], ["return line", returnAnchor], ["table wrapper", wrapperAnchor], ["product rows", mapAnchor], ["table end", tbodyAnchor]]) {
  if (!text.includes(a)) {
    console.log(`Could not find the ${name}. app/admin/products/page.tsx was NOT modified.`);
    console.log("Send me a screenshot of this message.");
    process.exit(1);
  }
}

text = text
  .replace(stateAnchor, stateAnchor +
`  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(30);
`)
  .replace(returnAnchor,
`  // Search by name, then show only the first few — a long list of rows with
  // photos is what makes this page slow.
  const searchTerm = search.trim().toLowerCase();
  const filteredProducts = searchTerm
    ? products.filter((p) => p.title.toLowerCase().includes(searchTerm) || (p.slug || "").toLowerCase().includes(searchTerm))
    : products;
  const visibleProducts = filteredProducts.slice(0, visibleCount);

` + returnAnchor)
  .replace(wrapperAnchor,
`<div className="mt-6 flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setVisibleCount(30); }}
          placeholder="Search products by name..."
          aria-label="Search products"
          className="flex-1 min-w-[220px] bg-white shadow-card rounded-full px-4 py-2.5 text-sm outline-none"
        />
        <span className="text-xs text-gray-400">
          {loading ? "" : \`Showing \${Math.min(visibleCount, filteredProducts.length)} of \${filteredProducts.length}\`}
        </span>
      </div>

      ` + wrapperAnchor.replace('mt-6 ', 'mt-3 '))
  .replace(mapAnchor, "visibleProducts.map((p) => (")
  .replace(tbodyAnchor,
`{!loading && filteredProducts.length > visibleProducts.length && (
              <tr>
                <td colSpan={7} className="px-4 py-4 text-center">
                  <button onClick={() => setVisibleCount((n) => n + 30)} className="bg-bg font-semibold text-sm px-6 py-2.5 rounded-full">
                    Show more
                  </button>
                </td>
              </tr>
            )}
          </tbody>`);

if (crlf) text = text.replace(/\n/g, "\r\n");
fs.writeFileSync(file, text, "utf8");
console.log("Done. app/admin/products/page.tsx was updated.");
