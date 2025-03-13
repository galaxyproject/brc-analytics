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

function checkIssueNumber(message) {
  console.log(
    "Checking for a '#xxx' reference to a corresponding GitHub issue"
  );
  if (/#[0-9]/.test(message)) {
    console.log("Successfully found issue number\n");
    return true;
  } else {
    console.error("Issue number missing\n");
    return false;
  }
}

async function checkMessage() {
  const message = core.getInput("message");
  const failedChecks = [];
  if (!checkIssueNumber(message)) failedChecks.push("issue number");
  if (!(await runCommitlint(message)))
    failedChecks.push("Conventional Commits");
  if (failedChecks.length > 0)
    core.setFailed(
      `Failed ${failedChecks.join(" and ")} check${failedChecks.length > 1 ? "s" : ""}`
    );
}

checkMessage().catch((e) => core.setFailed(e.message));
