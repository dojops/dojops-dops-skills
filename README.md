# dojops-dops-tools

[![CI](https://github.com/dojops/dojops-dops-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/dojops/dojops-dops-tools/actions/workflows/ci.yml)
[![Tools](https://img.shields.io/badge/tools-36-00e5ff)](https://github.com/dojops/dojops-dops-tools)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![DojOps](https://img.shields.io/badge/DojOps-v1.0.5-blue)](https://github.com/dojops/dojops)

Community collection of `.dops v2` tool files for [DojOps](https://github.com/dojops/dojops) — the AI DevOps automation engine.

## Overview

This repository contains 36 `.dops v2` tool files across 5 categories:

- **13 built-in tools** — Copies of the tools shipped with DojOps
- **24 community tools** — Additional DevOps tools for CI/CD, containers, monitoring, and security

## Tool Catalog

### Built-in (13)

| Tool | Description |
|------|-------------|
| `ansible` | Ansible playbook configurations |
| `docker-compose` | Docker Compose service definitions |
| `dockerfile` | Dockerfile container images |
| `github-actions` | GitHub Actions CI/CD workflows |
| `gitlab-ci` | GitLab CI/CD pipeline configurations |
| `helm` | Helm chart templates |
| `kubernetes` | Kubernetes deployment manifests |
| `makefile` | Makefile build automation |
| `nginx` | Nginx web server configurations |
| `prometheus` | Prometheus monitoring configurations |
| `systemd` | Systemd service unit files |
| `terraform` | Terraform infrastructure-as-code |

### CI/CD & Cloud (6)

| Tool | Description | Risk |
|------|-------------|------|
| `jenkins` | Declarative Jenkinsfile pipelines | LOW |
| `circleci` | CircleCI pipeline configurations | LOW |
| `azure-pipelines` | Azure DevOps pipeline definitions | LOW |
| `aws-cloudformation` | CloudFormation infrastructure templates | MEDIUM |
| `pulumi` | Pulumi IaC in TypeScript | MEDIUM |
| `argocd` | Argo CD GitOps application manifests | LOW |

### Containers & Orchestration (6)

| Tool | Description | Risk |
|------|-------------|------|
| `podman` | Podman pod and container YAML | MEDIUM |
| `docker-swarm` | Docker Swarm stack files | MEDIUM |
| `nomad` | HashiCorp Nomad job specifications | MEDIUM |
| `traefik` | Traefik reverse proxy configuration | MEDIUM |
| `caddy` | Caddy web server Caddyfile | MEDIUM |
| `haproxy` | HAProxy load balancer configuration | MEDIUM |

### Monitoring & Logging (6)

| Tool | Description | Risk |
|------|-------------|------|
| `grafana` | Grafana dashboard provisioning | LOW |
| `elasticsearch` | Elasticsearch index templates | LOW |
| `loki` | Grafana Loki log pipeline configuration | LOW |
| `datadog` | Datadog Agent integration config | LOW |
| `fluentd` | Fluentd log collector configuration | LOW |
| `jaeger` | Jaeger distributed tracing configuration | LOW |

### Security & Compliance (6)

| Tool | Description | Risk |
|------|-------------|------|
| `vault` | HashiCorp Vault server and policy config | HIGH |
| `opa` | OPA Rego admission policies | LOW |
| `falco` | Falco runtime security rules | LOW |
| `trivy-config` | Trivy scanner configuration | LOW |
| `sops` | SOPS encrypted secrets configuration | LOW |
| `cert-manager` | cert-manager Kubernetes TLS automation | LOW |

## Installation

### Install a single tool

```bash
dojops tools install dojops/dojops-dops-tools/ci-cd/jenkins.dops
```

### Install from local clone

```bash
git clone https://github.com/dojops/dojops-dops-tools.git
dojops tools install dojops-dops-tools/ci-cd/jenkins.dops
```

### Install from DojOps Hub

All tools in this repository are also published to [DojOps Hub](https://hub.dojops.ai). Browse, search, and install directly:

```bash
dojops tools install jenkins
```

### Copy to your project

```bash
cp ci-cd/jenkins.dops .dojops/tools/jenkins.dops
```

## Usage

Once installed, use with the DojOps CLI:

```bash
# Generate a Jenkinsfile
dojops "Create a Jenkins pipeline for a Node.js project"

# Generate Grafana dashboards
dojops "Create a Grafana dashboard for API latency metrics"

# Generate Vault policies
dojops "Create a Vault policy for the payments team"
```

## .dops v2 Format

Each tool is a `.dops` file with YAML frontmatter and markdown body:

```
---
dops: v2
kind: tool
meta:
  name: tool-name
  version: 2.0.0
  ...
context:
  technology: Tool Name
  bestPractices: [...]
  ...
---
## Prompt
...
## Keywords
...
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full format reference.

## Contributing

We welcome new tools! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on creating and submitting `.dops v2` tool files.

## License

[MIT](LICENSE)
