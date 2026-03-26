# Contributing to dojops-dops-skills

Thank you for contributing to the DojOps community skill collection!

## Prerequisites

- [Node.js](https://nodejs.org/) >= 20
- [DojOps CLI](https://github.com/dojops/dojops) (for testing skills)
- Familiarity with the [.dops v2 format](https://github.com/dojops/dojops/blob/main/docs/skills.md)

## Categories

Place your skill in the appropriate directory:

| Directory | Description |
|-----------|-------------|
| `ci-cd/` | CI/CD pipelines, cloud deployment, GitOps |
| `containers/` | Container runtimes, orchestration, reverse proxies |
| `monitoring/` | Metrics, logging, tracing, alerting |
| `security/` | Secrets, policies, scanning, compliance |

## Creating a new skill

### 1. Scaffold

Create `<category>/<skill-name>.dops` following the v2 format:

```yaml
---
dops: v2
kind: tool

meta:
  name: my-skill         # lowercase, hyphens only
  version: 2.0.0
  description: "Generate <skill> configurations"
  author: your-github-username
  license: MIT
  tags: [relevant, tags]

context:
  technology: Tool Name
  fileFormat: yaml       # yaml, json, hcl, raw, toml
  outputGuidance: |
    Generate valid configuration.
    Output raw content directly — do NOT wrap in JSON or code fences.
  bestPractices:         # At least 5 entries
    - Practice one
    - Practice two
    - Practice three
    - Practice four
    - Practice five
  context7Libraries:
    - name: library-name
      query: "relevant documentation query"

files:
  - path: "output/path/file.ext"
    format: raw

detection:
  paths: ["pattern/*.ext"]
  updateMode: true

verification:
  structural:
    - path: "required.key"
      required: true
      message: "Missing required key"

permissions:
  filesystem: write
  child_process: none
  network: none

scope:
  write: ["output/path/*"]

risk:
  level: LOW             # LOW, MEDIUM, or HIGH
  rationale: "Why this risk level"

execution:
  mode: generate
  deterministic: false
  idempotent: true

update:
  strategy: replace
  inputSource: file
  injectAs: existingContent
---
```

### 2. Markdown Body

After the frontmatter, include these required sections:

- **`## Prompt`** — Expert role description with template variables: `{outputGuidance}`, `{bestPractices}`, `{context7Docs}`, `{projectContext}`
- **`## Keywords`** — Technology name and aliases for agent routing

> **Note:** Update mode is handled automatically by the v2 prompt compiler. Best practices and constraints should be defined in `context.bestPractices` in the frontmatter.

### 3. Validate

```bash
npm install js-yaml
node scripts/validate.mjs
```

### 4. Test with DojOps CLI

```bash
dojops skills validate <category>/<skill-name>.dops
dojops --skill <category>/<skill-name>.dops "test prompt"
```

## Quality Checklist

- [ ] `meta.name` matches filename (without `.dops` extension)
- [ ] `meta.version` is `2.0.0`
- [ ] `context.bestPractices` has at least 7 entries (include both best practices and constraints)
- [ ] `verification` section uses structural or binary checks
- [ ] `risk.level` has an accurate `rationale`
- [ ] `## Keywords` includes the skill name and common aliases
- [ ] `node scripts/validate.mjs` passes

## Pull Request Naming

Use the format: `skills(<category>): add <skill-name>`

Examples:
- `skills(ci-cd): add jenkins`
- `skills(monitoring): add grafana`
- `skills(security): add vault`

## Code of Conduct

Be respectful and constructive. Focus on quality skills that help the community.
