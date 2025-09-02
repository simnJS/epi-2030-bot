# Contributing to Epitech 2030 Bot

Thank you for your interest in contributing to the Epitech 2030 Bot! This project is a collaborative effort for the 2030 Epitech Lyon promo, and we welcome contributions from everyone.

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (version 18 or higher)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [Git](https://git-scm.com/)

### Setting Up the Development Environment

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/simnJS/epi-2030-bot.git
   cd epi-2030-bot
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Create a `.env` file** in the root directory:
   ```env
   DISCORD_TOKEN="your_discord_token_here"
   OPENAI_API_KEY="your_openai_token_here"
   ```

5. **Start the development server**:
   ```bash
   npm run watch:start
   ```

## Development Guidelines

### Code Style

This project uses Prettier for code formatting. Before submitting, run:
```bash
npm run format
```

### Project Structure

- `src/commands/` - Discord slash commands
- `src/listeners/` - Event listeners
- `src/index.ts` - Main application entry point

### TypeScript

This project is written in TypeScript. Make sure your code:
- Has proper type annotations
- Compiles without errors (`npm run build`)
- Follows the existing code patterns

## Contributing Process

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Your Changes

- Write clean, well-documented code
- Follow the existing code style
- Test your changes thoroughly

### 3. Commit Your Changes

Use clear, descriptive commit messages:
```bash
git add .
git commit -m "feat: add new channel naming feature"
```

### 4. Push and Create a Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub with:
- A clear title describing your changes
- A detailed description of what you've added/changed
- Screenshots or examples if applicable

## Types of Contributions

### Commands
Add new Discord slash commands in `src/commands/`:
- Follow the Sapphire Framework patterns
- Include proper error handling
- Add helpful descriptions and examples

### Listeners
Add event listeners in `src/listeners/`:
- Organize by event type (guilds, channels, etc.)
- Handle errors gracefully
- Keep logic focused and modular

### Bug Fixes
- Reference the issue number in your commit message
- Include tests if possible
- Document any breaking changes

## Code Review Process

1. All contributions require review
2. Reviewers will check for:
   - Code quality and style
   - Functionality and testing
   - Documentation completeness
3. Address feedback promptly
4. Once approved, your PR will be merged

## Getting Help

- Check existing issues before creating new ones
- Ask questions in the project discussions
- Reach out to maintainers if you're stuck

## Recognition

All contributors will be acknowledged in the project. Thank you for helping make this bot better for the Epitech 2030 Lyon community!

## License

By contributing to this project, you agree that your contributions will be licensed under the [Unlicense](https://unlicense.org/), the same as the project itself.