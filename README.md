# dojops-dops-skills

[![CI](https://github.com/dojops/dojops-dops-skills/actions/workflows/ci.yml/badge.svg)](https://github.com/dojops/dojops-dops-skills/actions/workflows/ci.yml)
[![Skills](https://img.shields.io/badge/skills-63-00e5ff)](https://github.com/dojops/dojops-dops-skills)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![DojOps](https://img.shields.io/badge/DojOps-v1.2.2-blue)](https://github.com/dojops/dojops)

Community collection of `.dops v2` skill files for [DojOps](https://github.com/dojops/dojops) — the AI DevOps automation engine.

## Overview

This repository contains 63 `.dops v2` skill files across 5 categories:

- **38 built-in skills** — Synced from `packages/runtime/skills/` in the DojOps monorepo (v1.2.2)
- **25 community skills** — Additional DevOps skills for CI/CD, containers, monitoring, and security

## Skill catalog

### Built-in (38)

| Skill | Description |
|--------|-------------|
| `ansible` | Ansible playbook configurations |
| `argocd` | Argo CD GitOps application manifests |
| `aws-cdk` | AWS CDK infrastructure definitions |
| `aws-codepipeline` | AWS CodePipeline CI/CD configurations |
| `azure-devops` | Azure DevOps pipeline definitions |
| `bitbucket-pipelines` | Bitbucket Pipelines CI/CD configurations |
| `cert-manager` | cert-manager Kubernetes TLS automation |
| `circleci` | CircleCI pipeline configurations |
| `cloudformation` | CloudFormation infrastructure templates |
| `crossplane` | Crossplane cloud resource compositions |
| `docker-compose` | Docker Compose service definitions |
| `dockerfile` | Dockerfile container images |
| `eks` | Amazon EKS cluster configurations |
| `falco` | Falco runtime security rules |
| `flux` | Flux GitOps toolkit configurations |
| `github-actions` | GitHub Actions CI/CD workflows |
| `gitlab-ci` | GitLab CI/CD pipeline configurations |
| `grafana` | Grafana dashboard provisioning |
| `helm` | Helm chart templates |
| `istio` | Istio service mesh configurations |
| `jenkinsfile` | Declarative Jenkinsfile pipelines |
| `kubernetes` | Kubernetes deployment manifests |
| `kustomize` | Kustomize overlay configurations |
| `makefile` | Makefile build automation |
| `nginx` | Nginx web server configurations |
| `opa-gatekeeper` | OPA Gatekeeper admission policies |
| `otel-collector` | OpenTelemetry Collector configurations |
| `packer` | HashiCorp Packer machine image definitions |
| `powershell` | PowerShell automation scripts |
| `prometheus` | Prometheus monitoring configurations |
| `pulumi` | Pulumi IaC in TypeScript |
| `python` | Python automation scripts |
| `shell` | Shell/Bash automation scripts |
| `systemd` | Systemd service unit files |
| `terraform` | Terraform infrastructure-as-code |
| `terragrunt` | Terragrunt wrapper configurations |
| `trivy-operator` | Trivy Operator security scanning |
| `vault` | HashiCorp Vault server and policy config |

### CI/CD & Cloud (6)

| Skill | Description | Risk |
|--------|-------------|------|
| `jenkins` | Declarative Jenkinsfile pipelines | LOW |
| `circleci` | CircleCI pipeline configurations | LOW |
| `azure-pipelines` | Azure DevOps pipeline definitions | LOW |
| `aws-cloudformation` | CloudFormation infrastructure templates | MEDIUM |
| `pulumi` | Pulumi IaC in TypeScript | MEDIUM |
| `argocd` | Argo CD GitOps application manifests | LOW |

### Containers & Orchestration (6)

| Skill | Description | Risk |
|--------|-------------|------|
| `podman` | Podman pod and container YAML | MEDIUM |
| `docker-swarm` | Docker Swarm stack files | MEDIUM |
| `nomad` | HashiCorp Nomad job specifications | MEDIUM |
| `traefik` | Traefik reverse proxy configuration | MEDIUM |
| `caddy` | Caddy web server Caddyfile | MEDIUM |
| `haproxy` | HAProxy load balancer configuration | MEDIUM |

### Monitoring & Logging (7)

| Skill | Description | Risk |
|--------|-------------|------|
| `grafana` | Grafana dashboard provisioning | LOW |
| `elasticsearch` | Elasticsearch index templates | LOW |
| `loki` | Grafana Loki log pipeline configuration | LOW |
| `datadog` | Datadog Agent integration config | LOW |
| `fluentd` | Fluentd log collector configuration | LOW |
| `jaeger` | Jaeger distributed tracing configuration | LOW |
| `otel-collector` | OpenTelemetry Collector configurations | LOW |

### Security & Compliance (6)

| Skill | Description | Risk |
|--------|-------------|------|
| `vault` | HashiCorp Vault server and policy config | HIGH |
| `opa` | OPA Rego admission policies | LOW |
| `falco` | Falco runtime security rules | LOW |
| `trivy-config` | Trivy scanner configuration | LOW |
| `sops` | SOPS encrypted secrets configuration | LOW |
| `cert-manager` | cert-manager Kubernetes TLS automation | LOW |

## Installation

### Install a single skill

```bash
dojops skills install dojops/dojops-dops-skills/ci-cd/jenkins.dops
```

### Install from local clone

```bash
git clone https://github.com/dojops/dojops-dops-skills.git
dojops skills install dojops-dops-skills/ci-cd/jenkins.dops
```

### Install from DojOps Hub

All skills in this repository are also published to [DojOps Hub](https://hub.dojops.ai). Browse, search, and install directly:

```bash
dojops skills install jenkins
```

### Copy to your project

```bash
cp ci-cd/jenkins.dops .dojops/skills/jenkins.dops
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

## .dops v2 format

Each skill is a `.dops` file with YAML frontmatter and a markdown body:

```
---
dops: v2
kind: skill
meta:
  name: skill-name
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

We welcome new skills! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on creating and submitting `.dops v2` skill files.

## License

[MIT](LICENSE)
