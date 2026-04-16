const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => process.stdout.write("\n=== PAGE ERROR ===\n" + (e.stack || e.message) + "\n===\n"));
  page.on("console", (msg) => {
    if (msg.type() === "error") process.stdout.write("\n=== CONSOLE ERROR ===\n" + msg.text() + "\n===\n");
  });
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.click("button:has-text('Manifest Life')");
  await page.waitForTimeout(7500);
  await page.click("button:has-text('Work')");
  await page.waitForTimeout(600);
  await page.click("button:has(h3:has-text('Create sprint plan'))");
  await page.waitForTimeout(4500);
  await page.screenshot({ path: "/tmp/work-crash.png" });
  await browser.close();
  process.stdout.write("DONE\n");
})();
