import { spawn } from "bun";
import { mkdir } from "node:fs/promises";

// Tailwind's --watch exits when stdin closes. Bun.spawn does not keep stdin
// open, so --watch=always is what keeps the CSS rebuild running.
await mkdir("client/dist", { recursive: true });
await Bun.write("client/dist/index.html", Bun.file("client/index.html"));

const server = spawn(["bun", "--hot", "server/src/index.ts"], {
  stdout: "inherit",
  stderr: "inherit",
  env: { ...process.env },
});

const builder = spawn(
  ["bun", "build", "--watch", "client/src/main.tsx", "--outdir", "client/dist", "--sourcemap=inline"],
  { stdout: "inherit", stderr: "inherit", env: { ...process.env } }
);

const css = spawn(
  ["bunx", "tailwindcss", "--watch=always", "-i", "src/index.css", "-o", "dist/index.css"],
  { cwd: "client", stdout: "inherit", stderr: "inherit", env: { ...process.env } }
);

process.on("SIGINT", () => {
  server.kill();
  builder.kill();
  css.kill();
  process.exit(0);
});

process.on("SIGTERM", () => { server.kill(); builder.kill(); css.kill(); process.exit(0); });

await Promise.all([server.exited, builder.exited, css.exited]);
