/**
 * Git Commit Tool
 *
 * Analyze staged changes, determine commit type, generate conventional commit message.
 * Returns commands to execute.
 */

import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"
import * as path from "path"
import * as fs from "fs"

const gitCommitTool: ToolDefinition = tool({
  description:
    "Analyze staged changes, determine commit type, generate conventional commit message. Returns shell commands to execute.",
  args: {
    message: tool.schema.string().optional().describe("Optional commit message override"),
    push: tool.schema.boolean().optional().describe("Push to remote after commit (default: false)"),
  },
  async execute(args, context) {
    const { message: userMessage, push } = args
    const cwd = context.worktree || context.directory

    const gitDir = path.join(cwd, ".git")
    if (!fs.existsSync(gitDir)) {
      return JSON.stringify({ error: "Not a git repository", cwd })
    }

    const pkgJson = path.join(cwd, "package.json")
    const hasPkg = fs.existsSync(pkgJson)

    let type = "chore"
    let summary = "update files"

    if (hasPkg) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgJson, "utf-8"))
        const deps = { ...pkg.dependencies, ...pkg.devDependencies }
        const hasTests = deps.vitest || deps.jest || deps.mocha || deps.ava
        const hasReact = deps.react || deps["react-dom"]
        const hasNext = deps.next

        if (hasReact && hasNext) {
          type = "feat"
          summary = "add Next.js feature"
        } else if (hasReact) {
          type = "feat"
          summary = "add React component"
        } else if (hasTests) {
          type = "test"
          summary = "add tests"
        }
      } catch {
        // ignore parse errors
      }
    }

    const commitMsg = userMessage || `${type}: ${summary}`

    const commands = [
      "# Stage all changes",
      "git add -A",
      "",
      "# Commit with conventional format",
      `git commit -m "${commitMsg}"`,
    ]

    if (push) {
      commands.push("", "# Push to remote", "git push")
    }

    const script = commands.join("\n")

    return JSON.stringify({
      instructions: "Execute these commands in sequence:",
      script,
      commitMessage: commitMsg,
      type,
      note: "Review the staged files with 'git diff --cached' before committing",
    })
  },
})

export default gitCommitTool