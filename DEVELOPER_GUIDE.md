# Developer Setup Guide

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Git

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/azank1/PoT-Consensus.git
cd PoT-Consensus
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` to configure your environment:

```bash
# Server Configuration
PORT=3000
HOST=localhost

# Database Configuration
DATABASE_PATH=./data/agents.db

# Logging Configuration
LOG_LEVEL=info  # Options: debug, info, warn, error

# ... see .env.example for more options
```

### 4. Build the Project

```bash
npm run build
```

### 5. Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Development Workflow

### Project Structure

```
PoT-Consensus/
├── src/
│   ├── core/                # Core orchestration engine
│   │   ├── Config.ts        # Configuration management
│   │   ├── planner/         # AI-powered task planning
│   │   ├── executor/        # Task execution with retry
│   │   ├── orchestrator/    # Main coordinator
│   │   ├── context/         # Context & variable management
│   │   └── logs/            # Logging utility
│   ├── adapters/            # Protocol adapters
│   │   ├── http/           # HTTP/REST adapter
│   │   ├── n8n/            # n8n webhook adapter
│   │   └── mcp/            # MCP JSON-RPC adapter
│   ├── registry/            # Agent registry
│   │   ├── api/            # REST API server
│   │   └── db/             # SQLite database
│   └── sdk/                # CLI and SDKs
│       └── cli/            # Command-line interface
├── tests/                   # Test files
├── manifests/              # Agent configuration examples
└── data/                   # Database and logs
```

### Running the Application

#### Start the Registry API Server

```bash
npm run registry
```

The API will be available at `http://localhost:3000` (or your configured PORT)

#### Run the CLI

```bash
npm run cli -- [command] [options]
```

Available CLI commands:
- `register` - Register a new agent
- `list` - List all agents
- `get <id>` - Get agent details
- `delete <id>` - Delete an agent
- `invoke <id>` - Invoke an agent
- `health` - Check API health

#### Run the Demo

```bash
npm run dev
```

## Development Commands

### TypeScript Development

```bash
# Build TypeScript
npm run build

# Run in development mode (with auto-reload)
npm run dev
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- orchestrator.test.ts
```

### Code Quality

```bash
# TypeScript type checking
npx tsc --noEmit

# Format check (if prettier is added)
npm run format:check

# Lint (if eslint is added)
npm run lint
```

## Common Development Tasks

### Adding a New Adapter

1. Create a new file in `src/adapters/[protocol]/`
2. Implement the adapter interface:
   ```typescript
   export class MyAdapter {
     async invoke(input: any): Promise<any> {
       // Your implementation
     }
   }
   ```
3. Register the adapter in `src/core/executor/Executor.ts`
4. Add tests in `tests/adapter.test.ts`

### Adding a New API Endpoint

1. Add the route in `src/registry/api/server.ts`
2. Add validation middleware in `src/registry/api/validation.ts`
3. Add tests in `tests/api.test.ts`

### Modifying the Database Schema

1. Update the interface in `src/registry/db/sqlite.ts`
2. Add migration logic if needed
3. Update tests in `tests/registry.test.ts`

## Environment Variables

Key environment variables (see `.env.example` for complete list):

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | API server port | 3000 |
| `LOG_LEVEL` | Logging level (debug/info/warn/error) | info |
| `EXECUTOR_TIMEOUT` | Default task timeout (ms) | 60000 |
| `RETRY_MAX_RETRIES` | Max retry attempts | 3 |
| `API_RATE_LIMIT_MAX` | Max requests per window | 100 |

## Debugging

### Enable Debug Logging

Set `LOG_LEVEL=debug` in your `.env` file:

```bash
LOG_LEVEL=debug
```

### View Logs

Logs are stored in `data/logs/[date].json`:

```bash
# View today's logs
cat data/logs/$(date +%Y-%m-%d).json | jq
```

### Debug Tests

```bash
# Run tests with verbose output
npm test -- --verbose

# Run a single test
npm test -- -t "test name"
```

## Troubleshooting

### Port Already in Use

If you get a "port already in use" error:

```bash
# Find process using the port
lsof -ti:3000

# Kill the process
kill -9 $(lsof -ti:3000)
```

### Database Locked

If you get a "database is locked" error:

```bash
# Remove the database and restart
rm data/agents.db
npm run registry
```

### Module Not Found

If you get module not found errors:

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

## Contributing

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make your changes
3. Run tests: `npm test`
4. Build: `npm run build`
5. Commit: `git commit -m "Add my feature"`
6. Push: `git push origin feature/my-feature`
7. Create a Pull Request

## Getting Help

- Check the [README.md](README.md) for architecture overview
- Check the [ARCHITECTURE.md](ARCHITECTURE.md) for detailed design
- Look at example manifests in `manifests/`
- Run `npm run cli -- --help` for CLI usage

## Next Steps

After setup:

1. Read the [Architecture Documentation](ARCHITECTURE.md)
2. Try the demo: `npm run dev`
3. Register an agent: `npm run cli -- register --help`
4. Explore the test files for examples
5. Start building!
