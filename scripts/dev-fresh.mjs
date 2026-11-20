// Restarts a clean dev server. Kills any existing dev processes for this project,
// removes the stale .next output, then starts exactly one server.
import { execFileSync, spawn } from "node:child_process";
import { rmSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const isWindows = process.platform === "win32";

function killProjectProcesses() {
  if (isWindows) {
    const script = `Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" | Where-Object { $_.CommandLine -like "*${root}*" } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }`;
    try {
      execFileSync("powershell.exe", ["-NoProfile", "-Command", script], { stdio: "ignore" });
    } catch {
      // nothing to kill
    }
  } else {
    try {
      execFileSync("pkill", ["-f", root], { stdio: "ignore" });
    } catch {
      // nothing to kill
    }
  }
}

function cleanBuild() {
  rmSync(join(root, ".next"), { recursive: true, force: true });
}

function startServer() {
  const child = spawn("npm", ["run", "dev"], {
    cwd: root,
    stdio: "inherit",
    shell: isWindows,
  });
  child.on("exit", (code) => process.exit(code ?? 0));
}

killProjectProcesses();
cleanBuild();
console.log("Cleared stale dev servers and .next. Starting one dev server…");
startServer();
