# 💡 Basic Development DevPod

This branch contains a ready-to-use development environment with Docker-in-Docker and Node.js support.

## 🚀 Quick Start with devpod.sh

```bash
devpod up https://github.com/jedarden/agentists-quickstart --branch workspace/basic
```

## 📦 What's Included

- **🖼️ Base Image**: Debian-based development container
- **🐳 Docker-in-Docker**: Build and run containers within your development environment
- **🟢 Node.js**: Full Node.js development environment
- **🐍 Python**: Python development environment
- **🛠️ Development Tools** (auto-installed on container creation):
  - tmux: Terminal multiplexer for managing multiple sessions
  - claude-code: Anthropic's official CLI for Claude
  - GitHub CLI (gh): Command-line interface for GitHub
- **🧬 VS Code Extensions**:
  - Roo Cline: AI-powered coding assistant
  - GistFS: Access GitHub Gists directly in VS Code
  - GitHub Copilot: AI pair programming
  - GitHub Copilot Chat: Conversational AI assistance
  - Claude Code: Anthropic's official VS Code extension for Claude
  - Claude Code Extension: Enhanced Claude Code cost tracking and features

## ✨ Features

- Runs with privileged access to support Docker operations
- Configured for the `vscode` user
- Persistent container (won't shutdown on disconnect)
- Automatic tool installation with graceful fallback and detailed installation report
- Installation report saved to `.devcontainer/installation-report.md` for troubleshooting

## 📋 Requirements

- [DevPod CLI](https://devpod.sh/docs/getting-started/install)
- Docker Desktop or Docker Engine
- Active GitHub Copilot subscription (for Copilot features)

## 🔧 Manual VS Code Usage

If you prefer to use VS Code directly:

1. Clone this branch: `git clone -b workspace/basic https://github.com/jedarden/agentists-quickstart`
2. Open in VS Code
3. Install the Dev Containers extension
4. Click "Reopen in Container" when prompted

## 📚 Learn More

For more information about the Agentists project, visit the [main branch](https://github.com/jedarden/agentists-quickstart).