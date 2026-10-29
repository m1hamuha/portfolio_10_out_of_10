# AI Coach MVP

An AI-powered coaching application for developers using Next.js, TypeScript, and LLMs.

## Features

- GitHub OAuth authentication
- AI coaching with streaming responses
- Support for OpenAI and Anthropic models
- Rate limiting and security features
- Dockerized deployment
- CI/CD pipeline

## Getting Started

### Prerequisites

- Node.js 20+
- Docker (for database)
- pnpm (recommended)

### Installation

1. Clone the repository
2. Copy `.env.example` to `.env.local` and fill in the required keys
3. Install dependencies:

```bash
pnpm install
```

### Running the Application

1. Start the database:

```bash
docker compose up -d db
```

2. Run database migrations:

```bash
pnpm prisma:migrate
```

3. Start the development server:

```bash
pnpm dev
```

### Running Tests

- Unit tests:

```bash
pnpm test:unit
```

- E2E tests:

```bash
pnpm test:e2e
```

### Building for Production

```bash
pnpm build
pnpm start
```

### Docker Deployment

```bash
docker compose up --build
```

## Environment Variables

Create a `.env.local` file with the following variables:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/aicoach

AUTH_SECRET=your-auth-secret-key-32-chars-minimum
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

OPENROUTER_API_KEY=sk-or-v1-your-openrouter-api-key
OPENROUTER_SITE_URL=http://localhost:3000
OPENROUTER_APP_NAME=AI CopilotCoach

CRON_SECRET=your-cron-secret-for-vercel-verification
NEXTAUTH_SECRET=your-nextauth-secret
```

## Architecture

- **Frontend**: Next.js App Router with React
- **Backend**: Next.js API routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: GitHub OAuth + JWT with refresh token rotation
- **AI**: OpenAI/Anthropic via AI SDK with streaming support

## License

MIT