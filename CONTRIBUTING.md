# Contributing to double-elimination

Thank you for your interest in contributing to `double-elimination`! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the [issue list](https://github.com/nadersafa1/double-elimination/issues) to see if the problem has already been reported. If not, create a new issue with:

- **Clear title**: Brief description of the issue
- **Description**: Detailed explanation of the bug
- **Steps to reproduce**: How to reproduce the issue
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Environment**: Node.js version, package version, etc.
- **Code example**: Minimal code example that demonstrates the issue

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- **Clear title**: Brief description of the enhancement
- **Use case**: Why this enhancement would be useful
- **Proposed solution**: How you envision it working
- **Alternatives**: Other solutions you've considered

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Make your changes** following the coding standards below
3. **Add tests** for any new functionality
4. **Update documentation** if needed
5. **Ensure all tests pass** (`npm test`)
6. **Commit your changes** with clear commit messages
7. **Push to your fork** and submit a pull request

### Pull Request Process

- Ensure your code follows the existing style
- Update the CHANGELOG.md with your changes
- Add tests for new features
- Ensure all tests pass
- Request review from maintainers

## Development Setup

1. Clone your fork:

```bash
git clone https://github.com/YOUR_USERNAME/double-elimination.git
cd double-elimination
```

2. Install dependencies:

```bash
npm install
```

3. Build the project:

```bash
npm run build
```

4. Run tests:

```bash
npm test
```

5. Run tests in watch mode:

```bash
npm run test:watch
```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Follow existing code style and patterns
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

### Testing

- Write tests for all new features
- Ensure tests cover edge cases
- Use descriptive test names
- Follow existing test patterns

### Commit Messages

Use clear, descriptive commit messages:

- Use present tense ("Add feature" not "Added feature")
- Use imperative mood ("Fix bug" not "Fixes bug")
- First line should be concise (50 chars or less)
- Add detailed explanation if needed

Examples:

```
Add support for custom bracket sizes

Implement new option to allow custom bracket sizes
beyond power of 2 constraints.
```

```
Fix seeding bug for 32+ participants

Correct seed placement algorithm to ensure seeds 1 and 2
are in opposite halves for large brackets.
```

## Project Structure

```
double-elimination/
├── src/              # Source TypeScript files
├── dist/             # Compiled JavaScript (generated)
├── tests/            # Test files
├── package.json      # Package configuration
├── tsconfig.json     # TypeScript configuration
└── README.md         # Documentation
```

## Areas for Contribution

- **Bug fixes**: Fix reported issues
- **Performance**: Optimize bracket generation algorithms
- **Documentation**: Improve README, add examples, write tutorials
- **Testing**: Increase test coverage
- **Features**: Implement requested enhancements
- **TypeScript**: Improve type definitions

## Questions?

If you have questions about contributing, please:

- Open an issue with the `question` label
- Check existing issues and discussions
- Review the README.md for documentation

Thank you for contributing to `double-elimination`! 🎉
