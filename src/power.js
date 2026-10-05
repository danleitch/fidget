const { execFile } = require("child_process");
const { log } = require("./logger");

// Each platform has its own way of suspending; none of them need elevation.
function sleepCommand() {
  if (process.platform === "win32") {
    return ["rundll32.exe", ["powrprof.dll,SetSuspendState", "0,1,0"]];
  }
  if (process.platform === "darwin") {
    return ["pmset", ["sleepnow"]];
  }
  return ["systemctl", ["suspend"]];
}

// Resolves once the suspend command has returned, whether or not it worked.
function suspendMachine() {
  const [command, args] = sleepCommand();
  log("😴", "Putting the machine to sleep.");

  return new Promise((resolve) => {
    execFile(command, args, (error) => {
      if (error) {
        log("⚠️", `Could not sleep the machine: ${error.message}`);
      }
      resolve();
    });
  });
}

module.exports = { suspendMachine };
