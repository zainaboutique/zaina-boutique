// Replaces the raw "auth/popup-blocked" message with a friendly one.
// Run from the sky-store folder:  node scripts/patch-google-error.js
const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", "app", "account", "AccountClient.tsx");
let text = fs.readFileSync(file, "utf8");
const crlf = text.includes("\r\n");
text = text.replace(/\r\n/g, "\n");

if (text.includes("blocked the Google sign-in window")) {
  console.log("Already fixed. Nothing to do.");
  process.exit(0);
}

const oldBlock =
`      setProfile(upserted);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed.");
    }`;
const newBlock =
`      setProfile(upserted);
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === "auth/popup-blocked") {
        setError(
          "Your browser or an ad blocker blocked the Google sign-in window. Allow pop-ups for this site (or pause your ad blocker), or sign in with your email and password above."
        );
      } else if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        setError("");
      } else {
        setError(err instanceof Error ? err.message : "Sign-in failed.");
      }
    }`;

if (!text.includes(oldBlock)) {
  console.log("Could not find the lines to change. AccountClient.tsx was NOT modified.");
  console.log("Send me a screenshot of this message.");
  process.exit(1);
}

text = text.replace(oldBlock, newBlock);
if (crlf) text = text.replace(/\n/g, "\r\n");
fs.writeFileSync(file, text, "utf8");
console.log("Done. app/account/AccountClient.tsx was updated.");
