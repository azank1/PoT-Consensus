# PoT-Consensus

**Proof of Task (PoT) Consensus** - AI-powered meta-orchestration framework for multi-agent task coordination.

---

## 🎯 Architecture Overview

```
PoT-Consensus/
├── src/
│   ├── core/              # Core orchestration engine
│   ├── adapters/          # Protocol adapters (HTTP, n8n, MCP)
│   ├── registry/          # Agent registry with REST API
│   └── sdk/               # CLI and SDKs
├── vendor/
│   └── claude-flow/       # Claude-Flow SDK (git submodule)
├── manifests/             # Agent configuration files
├── tests/                 # Test suites
└── data/                  # SQLite database
```

---

## 📐 Component Architecture

### **Core Components**

| Component | Purpose | Dependencies |
|-----------|---------|--------------|
| **ClaudePlanner** | AI-powered task decomposition | Claude-Flow SDK (local) |
| **Executor** | Sequential task execution | Adapters, ContextManager |
| **Orchestrator** | Main coordinator | Planner, Executor |
| **ContextManager** | Variable substitution & context | None |
| **Logger** | Logging utility | None |

### **Adapters**

| Adapter | Protocol | Use Case |
|---------|----------|----------|
| **HttpAdapter** | REST/HTTP | API calls, webhooks |
| **N8nAdapter** | n8n Webhooks | Workflow automation |
| **McpAdapter** | JSON-RPC 2.0 | Model Context Protocol |

### **Registry System**

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **API Server** | Express | REST API for agent management |
| **DatabaseManager** | SQLite | Agent storage and retrieval |

---

## 🔄 Data Flow

```
User Goal
  ↓
ClaudePlanner (AI decomposition)
  ↓
Task Plan [Task, Task, Task...]
  ↓
Executor (sequential execution)
  ↓
AdapterFactory (protocol routing)
  ↓
Adapter (HTTP/n8n/MCP)
  ↓
External Service
  ↓
Results Aggregation
  ↓
Final Output
```

---

## 🛠️ Dependencies

### Git Submodules
- **claude-flow**: `vendor/claude-flow` - AI-powered flow orchestration SDK
  - Repository: https://github.com/ruvnet/claude-flow.git
  - Usage: Task planning and decomposition

### Setup
```bash
# Initialize and update submodules
git submodule init
git submodule update

# Or clone with submodules
git clone --recurse-submodules <repo-url>
```

---

## 🏗️ Current Status

**Phase**: Production-Ready Platform ✅

### Completed Features

#### Core Components ✅
- ✅ **ClaudePlanner** - AI-powered task decomposition with mock fallback
- ✅ **Executor** - Sequential task execution with retry and timeout
- ✅ **Orchestrator** - Main coordinator combining planning & execution
- ✅ **ContextManager** - Variable substitution with nested property support
- ✅ **Logger** - Multi-level logging with file output
- ✅ **Config Manager** - Environment configuration with validation

#### Robustness Features ✅
- ✅ **Retry Logic** - Exponential backoff with configurable retries
- ✅ **Timeout Handling** - Per-task and global timeout support
- ✅ **Error Recovery** - Continue-on-error and error propagation options
- ✅ **Input Validation** - Comprehensive validation across all components
- ✅ **Graceful Shutdown** - Proper cleanup and resource management
- ✅ **Circuit Breaker** - Prevents cascading failures for external services
- ✅ **Custom Errors** - 10 specialized error types for better handling
- ✅ **Request Tracking** - Unique IDs for distributed tracing

#### API & Registry ✅
- ✅ **REST API** - Express server with 5 endpoints
- ✅ **Rate Limiting** - 100 requests/15 minutes (configurable)
- ✅ **CORS** - Configurable cross-origin support
- ✅ **Security Headers** - X-Frame-Options, X-Content-Type-Options, etc.
- ✅ **Database** - SQLite with full CRUD operations
- ✅ **Pagination** - Efficient agent listing

#### Protocol Adapters ✅
- ✅ **HTTP Adapter** - REST/HTTP calls with axios
- ✅ **n8n Adapter** - Workflow automation integration
- ✅ **MCP Adapter** - JSON-RPC 2.0 protocol support

#### Testing & Quality ✅
- ✅ **78 Tests** - Unit, integration, circuit breaker, and error tests
- ✅ **0 Security Issues** - CodeQL scan passed
- ✅ **Code Review** - All feedback addressed
- ✅ **Test Coverage** - Core components fully tested
- ✅ **Circuit Breaker Tests** - 8 comprehensive tests
- ✅ **Custom Error Tests** - 13 error type tests

#### Documentation ✅
- ✅ **Developer Guide** - Complete setup and development guide
- ✅ **API Documentation** - Full REST API reference
- ✅ **Environment Config** - All variables documented
- ✅ **Architecture Docs** - System design documented

### Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Build the project
npm run build

# Run tests
npm test

# Start the Registry API
npm run registry

# Use the CLI
npm run cli -- list
```

See [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) for detailed setup instructions.

---

## 📚 Documentation

- **[Developer Guide](DEVELOPER_GUIDE.md)** - Setup, development workflow, and troubleshooting
- **[API Documentation](API_DOCUMENTATION.md)** - Complete REST API reference
- **[Architecture](ARCHITECTURE.md)** - System architecture and design
- **[Robustness Improvements](ROBUSTNESS_IMPROVEMENTS.md)** - Error handling, circuit breaker, and security
- **[Environment Config](.env.example)** - Configuration options

---

## 🎯 Key Features

### Intelligent Task Orchestration
- AI-powered task planning and decomposition
- Dependency-aware sequential execution
- Context management with variable substitution
- Multi-protocol adapter support

### Enterprise-Grade Robustness
- Automatic retry with exponential backoff
- Configurable timeout handling
- Comprehensive error handling
- Graceful shutdown and cleanup

### Production-Ready API
- RESTful agent registry
- Rate limiting and CORS
- Input validation and security headers
- Health monitoring and metrics

### Developer-Friendly
- TypeScript with full type safety
- Comprehensive test coverage
- Detailed documentation
- Easy configuration via .env

---

## 📋 Future Enhancements

1. **Advanced Execution**
   - Parallel task execution
   - Task scheduling and cron support
   - Real-time execution status updates

2. **Persistence & Monitoring**
   - Execution history and audit logs
   - Performance metrics and monitoring
   - Database migrations support

3. **AI Integration**
   - Enhanced Claude-Flow integration
   - Custom AI model support
   - Adaptive task planning

4. **Additional Features**
   - Authentication and authorization
   - Webhook support for events
   - Plugin system for extensibility

---

**Platform Status: Production-Ready** 🚀
