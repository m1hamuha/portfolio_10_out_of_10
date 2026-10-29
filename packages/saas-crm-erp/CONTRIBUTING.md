# Contributing to Unified CRM/ERP SaaS Platform

Thank you for your interest in contributing to the Unified CRM/ERP SaaS Platform! This document provides guidelines and instructions for contributing to this project.

## 📋 Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md) to help us maintain a respectful and inclusive community.

## 🚀 Getting Started

### Prerequisites
- Familiarity with Git and GitHub
- Node.js 18+ and npm/yarn
- Docker and Docker Compose (for local development)
- Basic understanding of TypeScript, NestJS, and Next.js

### Setting Up Development Environment
1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/m1hamuha/SaaS-platform-CRM-ERP-
   cd unified-crm-erp
   ```
3. Set up the development environment as described in the [README.md](README.md#getting-started)
4. Create a new branch for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 🔧 Development Workflow

### 1. Issue Tracking
- Check existing issues before creating new ones
- Use clear, descriptive titles for issues
- Include steps to reproduce for bug reports
- For feature requests, describe the use case and expected behavior

### 2. Branch Naming Convention
Use the following prefix patterns for branch names:
- `feature/` - New features or enhancements
- `bugfix/` - Bug fixes
- `hotfix/` - Critical production fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions or improvements
- `chore/` - Maintenance tasks

### 3. Code Style
- Follow TypeScript best practices
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused
- Write tests for new functionality

### 4. Testing
- Run existing tests before submitting changes:
  ```bash
  cd backend && npm test
  cd ../frontend && npm test
  ```
- Add unit tests for new features
- Update tests when modifying existing functionality
- Ensure all tests pass before creating a pull request

### 5. Commit Messages
Use conventional commit format:
```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Test additions or updates
- `chore`: Maintenance tasks

Example:
```
feat(auth): add refresh token rotation

- Implement refresh token rotation logic
- Add token blacklisting with Redis
- Update authentication tests

Closes #123
```

### 6. Pull Request Process
1. Ensure your branch is up to date with the main branch
2. Run all tests and linting checks
3. Create a pull request with a clear title and description
4. Link any related issues
5. Request review from maintainers
6. Address review feedback promptly
7. Once approved, maintainers will merge your PR

## 📁 Project Structure

### Backend (NestJS)
```
backend/
├── src/
│   ├── auth/          # Authentication & authorization
│   ├── config/        # Configuration management
│   ├── customers/     # Customer management
│   ├── organizations/ # Multi-tenant organization management
│   ├── users/         # User management
│   ├── database/      # Database configuration
│   └── middleware/    # HTTP middleware
└── test/              # Test files
```

### Frontend (Next.js)
```
frontend/
├── app/               # App Router pages and layouts
├── components/        # Reusable React components
├── lib/               # Utility functions and libraries
├── styles/            # CSS and styling
└── test/              # Test files
```

## 🧪 Testing Guidelines

### Backend Tests
- Unit tests: Test individual functions and classes
- Integration tests: Test API endpoints with database
- E2E tests: Test complete user flows
- Smoke tests: Verify basic functionality

### Frontend Tests
- Unit tests: Test React components and hooks
- Integration tests: Test component interactions
- E2E tests: Test user flows with Playwright

### Running Tests
```bash
# Backend tests
cd backend
npm test              # Run unit tests
npm run test:e2e      # Run end-to-end tests
npm run test:smoke    # Run smoke tests

# Frontend tests
cd frontend
npm test              # Run unit tests
npm run test:e2e      # Run end-to-end tests
```

## 📝 Documentation

### Updating Documentation
- Keep README.md up to date with new features
- Document API changes in relevant files
- Update configuration examples when adding new environment variables
- Add comments for complex algorithms or business logic

### Creating New Documentation
- Use clear, concise language
- Include code examples where helpful
- Add diagrams for complex workflows
- Keep documentation in the `/docs` directory

## 🐛 Bug Reports

When reporting bugs, please include:
1. Clear description of the issue
2. Steps to reproduce
3. Expected vs actual behavior
4. Environment details (OS, Node version, etc.)
5. Screenshots or error logs if applicable

## 💡 Feature Requests

When suggesting features, please include:
1. Problem statement
2. Proposed solution
3. Use cases
4. Potential implementation approach
5. Any alternatives considered

## 🔍 Code Review Guidelines

### As a Reviewer
- Be constructive and respectful
- Focus on code quality and maintainability
- Check for security vulnerabilities
- Ensure tests are adequate
- Verify documentation is updated

### As an Author
- Be open to feedback
- Address all review comments
- Explain design decisions when needed
- Keep PRs focused and manageable

## 🏆 Recognition

Contributors will be recognized in:
- GitHub contributors list
- Release notes
- Project documentation (for significant contributions)

## ❓ Getting Help

- Check existing documentation first
- Search existing issues and discussions
- Ask questions in GitHub Discussions
- Join community channels (if available)

## 📄 License

By contributing, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).

---

Thank you for contributing to making this project better! 🙏
