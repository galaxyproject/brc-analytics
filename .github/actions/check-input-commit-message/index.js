const core = require("@actions/core");

async function runCommitlint(message) {
  const { default: load } = await import("@commitlint/load");
  const { default: lint } = await import("@commitlint/lint");
  const { default: format } = await import("@commitlint/format");

  console.log("Checking for Conventional Commits format");

  const config = await load();
  const report = await lint(message, config.rules, {
    parserOpts: config.parserPreset?.parserOpts,
  });
  const reportMessage = format({ results: [report] }, { verbose: true });

  if (report.valid) console.log(reportMessage + "\n");
  else console.error(reportMessage + "\n");

  return report.valid;
}

async function checkMessage() {
  const message = core.getInput("message");
  const failedChecks = [];
  if (!(await runCommitlint(message)))
    failedChecks.push("Conventional Commits");
  if (failedChecks.length > 0)
    core.setFailed(
      `Failed ${failedChecks.join(" and ")} check${failedChecks.length > 1 ? "s" : ""}`
    );
}

checkMessage().catch((e) => core.setFailed(e.message));
