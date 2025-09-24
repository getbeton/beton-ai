# Contributing to Beton-AI

Thank you for your interest in contributing to Beton-AI! This document provides guidelines and information for contributors.

## 🚀 Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/<your-username>/beton-ai.git
   cd beton-ai
   git remote add upstream https://github.com/getbeton/beton-ai.git
   ```
3. **Set up the development environment** following the [Setup Guide](setup.md)
4. **Create a new branch** for your feature/fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 📋 Development Workflow

### Before You Start

1. Check existing [issues](https://github.com/getbeton/beton-ai/issues) to see if your idea is already being worked on
2. Create a new issue if you're planning a significant change
3. Join our discussions to coordinate with other contributors

### Making Changes

1. **Follow the coding standards**:
   - Use TypeScript for all new code
   - Follow the existing code style and conventions
   - Add proper type annotations
   - Write meaningful commit messages

2. **Test your changes**:
   ```bash
   # Run linting
   cd frontend && npm run lint
   cd backend && npm run type-check
   
   # Test the application manually
   ./dev.sh
   ```

3. **Keep your branch updated**:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

### Code Style Guidelines

#### Frontend (Next.js + TypeScript)
- Use functional components with hooks
- Prefer `const` over `let` when possible
- Use meaningful component and variable names
- Add proper TypeScript types for props and state
- Use TailwindCSS for styling
- Follow the component structure in existing files

#### Backend (Express + TypeScript)
- Use async/await instead of callbacks
- Add proper error handling with try/catch
- Validate input data using Zod schemas
- Follow RESTful API conventions
- Add proper TypeScript interfaces
- Use meaningful function and variable names

#### Database (Prisma)
- Follow existing schema naming conventions
- Add proper relationships and constraints
- Write clear migration files
- Test database changes thoroughly

## 📝 Commit Message Format

Use conventional commits format:

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
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(api): add API key encryption
fix(auth): resolve login redirect issue
docs(readme): update setup instructions
```

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Clear description** of the issue
2. **Steps to reproduce** the bug
3. **Expected behavior** vs actual behavior
4. **Environment information**:
   - OS and version
   - Node.js version
   - Browser (if frontend issue)
5. **Screenshots** or error logs (if applicable)

Use the bug report template when creating issues.

## 💡 Feature Requests

For feature requests, please provide:

1. **Clear description** of the proposed feature
2. **Use case** - why is this feature needed?
3. **Detailed requirements** or specifications
4. **Mockups or examples** (if applicable)
5. **Potential implementation approach**

## 🔍 Code Review Process

1. **Create a Pull Request** with:
   - Clear title and description
   - Reference to related issues
   - Screenshots for UI changes
   - List of changes made

2. **PR Requirements**:
   - All tests must pass
   - Code must follow style guidelines
   - No linting errors
   - Proper TypeScript types
   - Clear commit history

3. **Review Process**:
   - At least one maintainer review required
   - Address all feedback before merge
   - Squash commits if requested
   - Keep PR scope focused and small

## 🏗️ Project Structure

```
beton-ai/
├── backend/              # Express.js API
│   ├── src/
│   │   ├── routes/      # API endpoints
│   │   ├── middleware/  # Custom middleware
│   │   ├── types/       # TypeScript definitions
│   │   └── services/    # Business logic
│   └── prisma/          # Database schema
├── frontend/            # Next.js application
│   ├── src/
│   │   ├── app/        # App router pages
│   │   ├── components/ # Reusable components
│   │   └── lib/        # Utilities and configs
└── docs/               # Documentation
```

## 🧪 Testing Guidelines

### Manual Testing
- Test all authentication flows
- Verify API key CRUD operations
- Check responsive design
- Test error scenarios

### Automated Testing (Future)
We're planning to add:
- Unit tests for utilities and services
- Integration tests for API endpoints
- E2E tests for critical user flows

## 📚 Documentation

When adding features:

1. **Update relevant documentation**
2. **Add code comments** for complex logic
3. **Update API documentation** for backend changes
4. **Add examples** for new features

## 🌟 Recognition

Contributors will be:
- Listed in the README contributors section
- Mentioned in release notes
- Invited to join the maintainers team (for significant contributions)

## ❓ Questions?

- Create a [Discussion](https://github.com/your-org/beton-ai/discussions)
- Join our community chat
- Tag maintainers in issues
- Email: contribute@beton-ai.dev

## 📄 License

By contributing to Beton-AI, you agree that your contributions will be licensed under the MIT License.

Thank you for contributing to Beton-AI! 🎉 
