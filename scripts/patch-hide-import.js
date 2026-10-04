// Hides the "Import CSV" button from staff accounts (owner still sees it).
// Run from the sky-store folder:  node scripts/patch-hide-import.js
const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", "app", "admin", "products", "page.tsx");
let text = fs.readFileSync(file, "utf8");
const crlf = text.includes("\r\n");
text = text.replace(/\r\n/g, "\n");

if (text.includes("const { isOwner } = useAdminAuth();")) {
  console.log("Already fixed. Nothing to do.");
  process.exit(0);
}

const importAnchor = 'import type { Product, Audience, Badge, ProductColor } from "@/lib/types";\n';
const stateAnchor = "  const csvInputRef = useRef<HTMLInputElement>(null);\n";
const oldButton =
`          <button
            onClick={() => csvInputRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-1.5 bg-white shadow-card text-sm font-semibold px-4 py-2.5 rounded-full disabled:opacity-50"
          >
            <FileUp size={16} /> {importing ? "Importing..." : "Import CSV"}
          </button>
          <input ref={csvInputRef} type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && handleCsvImport(e.target.files[0])} />
`;
const newButton =
`          {isOwner && (
            <>
              <button
                onClick={() => csvInputRef.current?.click()}
                disabled={importing}
                className="flex items-center gap-1.5 bg-white shadow-card text-sm font-semibold px-4 py-2.5 rounded-full disabled:opacity-50"
              >
                <FileUp size={16} /> {importing ? "Importing..." : "Import CSV"}
              </button>
              <input ref={csvInputRef} type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && handleCsvImport(e.target.files[0])} />
            </>
          )}
`;

for (const [name, s] of [["import line", importAnchor], ["state line", stateAnchor], ["Import CSV button", oldButton]]) {
  if (!text.includes(s)) {
    console.log(`Could not find the ${name}. app/admin/products/page.tsx was NOT modified.`);
    console.log("Send me a screenshot of this message.");
    process.exit(1);
  }
}

text = text
  .replace(importAnchor, importAnchor + 'import { useAdminAuth } from "@/lib/use-admin-auth";\n')
  .replace(stateAnchor, stateAnchor + "  const { isOwner } = useAdminAuth(); // staff accounts don't see Import CSV\n")
  .replace(oldButton, newButton);

if (crlf) text = text.replace(/\n/g, "\r\n");
fs.writeFileSync(file, text, "utf8");
console.log("Done. app/admin/products/page.tsx was updated.");
