# Contributing to SlackGuard

Thank you for your interest in contributing to SlackGuard! This document provides guidelines and instructions for contributing.

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL 14+
- Git
- npm or yarn

### Local Setup

1. **Fork & Clone**
   ```bash
   git clone https://github.com/yourusername/SlackGuard.git
   cd SlackGuard
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your local database credentials
   ```

4. **Database Setup**
   ```bash
   npm run db:push
   npm run db:generate
   ```

5. **Run Development Server**
   ```bash
   npm run dev
   ```

   Visit `http://localhost:3000`

## 📝 Development Workflow

### Branch Naming
- `feature/description` - New features
- `bugfix/description` - Bug fixes
- `hotfix/description` - Urgent production fixes
- `docs/description` - Documentation updates

**Example**: `feature/add-trend-chart`

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting, missing semicolons, etc.
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvement
- `test`: Adding tests
- `chore`: Updating build tasks, package manager configs, etc.

**Example**:
```
feat(dashboard): add trend chart for migration progress

Implements Chart.js line graph showing classic app count over time.
Helps users visualize progress toward Nov 2026 deadline.

Closes #42
```

### Pull Request Process

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Write code
   - Add tests (if applicable)
   - Update documentation

3. **Test Your Changes**
   ```bash
   npm run typecheck
   npm run build
   ```

4. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat(scope): description"
   ```

5. **Push to Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Open Pull Request**
   - Go to GitHub and create PR
   - Fill out PR template
   - Link related issues
   - Request review

### PR Checklist
- [ ] Code follows project style guidelines
- [ ] TypeScript types are correct (`npm run typecheck`)
- [ ] No console.log statements (use proper logging)
- [ ] Documentation updated (if needed)
- [ ] Tests added (if applicable)
- [ ] PR description is clear
- [ ] Related issues linked

## 🎨 Code Style

### TypeScript
- Use strict TypeScript
- Avoid `any` types
- Prefer interfaces over types for objects
- Use meaningful variable names

### React/Remix
- Functional components only
- Use TypeScript for props
- Keep components small and focused
- Prefer server-side logic in loaders/actions

### Database
- Always use Prisma for database access
- Import from `~/lib/prisma.server.ts`
- Use transactions for multi-step operations
- Implement idempotent operations (upsert)

### File Organization
```
app/
├── lib/           # Shared utilities
├── services/      # Business logic
├── routes/        # Pages and API endpoints
├── components/    # Reusable UI components
└── types/         # TypeScript types/interfaces
```

## 🧪 Testing

### Manual Testing
1. Test FREE tier limitations
2. Test PRO tier features
3. Test subscription upgrade flow
4. Test CSV export
5. Test error states

### Future: Automated Tests
(Coming soon - see ENHANCEMENTS.md)

## 🐛 Bug Reports

### Before Submitting
1. Check existing issues
2. Try to reproduce consistently
3. Test on latest version

### Report Template
```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment**
- Browser: [e.g. Chrome 120]
- OS: [e.g. macOS 14]
- SlackGuard version: [e.g. 1.0.0]

**Additional context**
Any other context about the problem.
```

## 💡 Feature Requests

### Before Requesting
1. Check ENHANCEMENTS.md for existing plans
2. Search existing issues
3. Consider if it fits the product vision

### Request Template
```markdown
**Problem Statement**
What problem does this solve?

**Proposed Solution**
How would you implement it?

**Alternatives Considered**
What other options did you consider?

**Additional Context**
Screenshots, mockups, examples.
```

## 🔒 Security

**DO NOT** open public issues for security vulnerabilities.

Please email security@slackguard.example.com (or see SECURITY.md)

## 📚 Resources

- [Remix Docs](https://remix.run/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 🏆 Recognition

Contributors will be added to:
- README.md contributors section
- GitHub contributors page
- Release notes (for significant contributions)

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## ❓ Questions?

- Open a Discussion on GitHub
- Check existing documentation
- Ask in pull request comments

---

Thank you for contributing to SlackGuard! 🎉
