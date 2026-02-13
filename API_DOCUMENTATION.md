# PoT-Consensus API Documentation

## Overview

The PoT-Consensus Registry API provides REST endpoints for managing agents in the platform.

**Base URL:** `http://localhost:3000` (configurable via `PORT` environment variable)

**Authentication:** Currently open (authentication structure in place for future implementation)

**Rate Limiting:** 100 requests per 15 minutes per IP (configurable)

## Endpoints

### Health Check

Get the health status of the API server.

```http
GET /health
```

#### Response

```json
{
  "status": "healthy",
  "timestamp": "2026-02-13T13:00:00.000Z",
  "version": "1.0.0",
  "environment": "development",
  "database": {
    "connected": true,
    "agentCount": 5
  },
  "uptime": 123.456,
  "memory": {
    "heapUsed": 25,
    "heapTotal": 50,
    "rss": 75
  }
}
```

---

### Register Agent

Register a new agent or update an existing one.

```http
POST /register
```

#### Request Body

```json
{
  "id": "my-agent-1",
  "type": "http",
  "name": "My Agent",
  "description": "A sample agent",
  "endpoint": "https://api.example.com/agent",
  "protocol": "http",
  "capabilities": ["data-processing", "analysis"],
  "tags": ["ml", "analytics"],
  "config": {
    "timeout": 30000,
    "retries": 3,
    "custom": "value"
  }
}
```

#### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique agent identifier (3-100 chars, alphanumeric, hyphens, underscores) |
| `type` | string | Yes | Agent type: "http", "n8n", or "mcp" |
| `name` | string | No | Human-readable agent name (1-200 chars) |
| `description` | string | No | Agent description (max 1000 chars) |
| `endpoint` | string | No | Agent endpoint URL (must be valid URL) |
| `protocol` | string | No | Protocol type (http, n8n, mcp) |
| `capabilities` | array | No | List of agent capabilities |
| `tags` | array | No | Tags for categorization |
| `config` | object | Yes | Agent-specific configuration |

#### Response (201 Created)

```json
{
  "success": true,
  "message": "Agent my-agent-1 registered successfully",
  "agent": {
    "id": "my-agent-1",
    "type": "http",
    "name": "My Agent",
    "endpoint": "https://api.example.com/agent",
    "config": { ... }
  }
}
```

#### Error Responses

**400 Bad Request** - Invalid input

```json
{
  "error": "Validation failed",
  "errors": [
    {
      "field": "id",
      "message": "Agent ID must contain only alphanumeric characters, hyphens, and underscores"
    }
  ]
}
```

**500 Internal Server Error**

```json
{
  "error": "Internal server error",
  "message": "Registration failed"
}
```

---

### List Agents

Get a paginated list of all registered agents.

```http
GET /agents?page=1&limit=10
```

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number (min: 1) |
| `limit` | number | 100 | Results per page (min: 1, max: 1000) |

#### Response (200 OK)

```json
{
  "count": 25,
  "page": 1,
  "limit": 10,
  "totalPages": 3,
  "agents": [
    {
      "id": "agent-1",
      "type": "http",
      "name": "Agent 1",
      "config": { ... }
    },
    {
      "id": "agent-2",
      "type": "n8n",
      "name": "Agent 2",
      "config": { ... }
    }
  ]
}
```

---

### Get Agent

Get details of a specific agent by ID.

```http
GET /agents/:id
```

#### URL Parameters

| Parameter | Description |
|-----------|-------------|
| `id` | Agent ID (3-100 chars, alphanumeric, hyphens, underscores) |

#### Response (200 OK)

```json
{
  "id": "my-agent-1",
  "type": "http",
  "name": "My Agent",
  "description": "A sample agent",
  "endpoint": "https://api.example.com/agent",
  "capabilities": ["data-processing"],
  "config": { ... }
}
```

#### Error Responses

**404 Not Found**

```json
{
  "error": "Not found",
  "message": "Agent with ID 'my-agent-1' not found"
}
```

**400 Bad Request** - Invalid ID format

```json
{
  "error": "Agent ID must contain only alphanumeric characters, hyphens, and underscores"
}
```

---

### Delete Agent

Delete an agent by ID.

```http
DELETE /agents/:id
```

#### URL Parameters

| Parameter | Description |
|-----------|-------------|
| `id` | Agent ID to delete |

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Agent 'my-agent-1' deleted successfully"
}
```

#### Error Responses

**404 Not Found**

```json
{
  "error": "Not found",
  "message": "Agent with ID 'my-agent-1' not found"
}
```

---

## Rate Limiting

The API implements rate limiting to prevent abuse.

**Default Limits:**
- Window: 15 minutes
- Max Requests: 100 per window

**Rate Limit Headers:**
```
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 1676304000
```

**Rate Limit Response (429 Too Many Requests):**

```json
{
  "error": "Too many requests",
  "retryAfter": 15
}
```

---

## CORS

Cross-Origin Resource Sharing (CORS) is enabled by default.

**Allowed Origins:** `*` (configurable via `API_CORS_ORIGIN`)

**Allowed Methods:** GET, POST, PUT, DELETE, OPTIONS

**Allowed Headers:** Content-Type, Authorization

---

## Security Headers

The API sets the following security headers:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`

---

## Error Handling

All errors follow a consistent format:

```json
{
  "error": "Error Type",
  "message": "Detailed error message"
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 404 | Not Found |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |

---

## Examples

### cURL Examples

#### Register an Agent

```bash
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{
    "id": "weather-agent",
    "type": "http",
    "name": "Weather Agent",
    "endpoint": "https://api.weather.com/v1",
    "config": {
      "apiKey": "your-key",
      "timeout": 5000
    }
  }'
```

#### List All Agents

```bash
curl http://localhost:3000/agents
```

#### Get Specific Agent

```bash
curl http://localhost:3000/agents/weather-agent
```

#### Delete Agent

```bash
curl -X DELETE http://localhost:3000/agents/weather-agent
```

#### Check Health

```bash
curl http://localhost:3000/health
```

### JavaScript/Axios Examples

```javascript
const axios = require('axios');
const baseURL = 'http://localhost:3000';

// Register agent
const agent = await axios.post(`${baseURL}/register`, {
  id: 'my-agent',
  type: 'http',
  config: { /* ... */ }
});

// List agents
const agents = await axios.get(`${baseURL}/agents?page=1&limit=10`);

// Get agent
const agent = await axios.get(`${baseURL}/agents/my-agent`);

// Delete agent
await axios.delete(`${baseURL}/agents/my-agent`);

// Health check
const health = await axios.get(`${baseURL}/health`);
```

### Python/Requests Examples

```python
import requests

base_url = 'http://localhost:3000'

# Register agent
response = requests.post(f'{base_url}/register', json={
    'id': 'my-agent',
    'type': 'http',
    'config': {}
})

# List agents
response = requests.get(f'{base_url}/agents', params={'page': 1, 'limit': 10})

# Get agent
response = requests.get(f'{base_url}/agents/my-agent')

# Delete agent
response = requests.delete(f'{base_url}/agents/my-agent')

# Health check
response = requests.get(f'{base_url}/health')
```

---

## Configuration

API behavior can be configured via environment variables:

```bash
# Server
PORT=3000
HOST=localhost

# Rate Limiting
API_RATE_LIMIT_WINDOW=15  # minutes
API_RATE_LIMIT_MAX=100

# CORS
API_ENABLE_CORS=true
API_CORS_ORIGIN=*

# Environment
NODE_ENV=production
```

See `.env.example` for complete list of configuration options.

---

## Changelog

### Version 1.0.0 (Current)

- Initial release
- Agent registration and management
- Rate limiting
- CORS support
- Input validation
- Health check endpoint
- Pagination support
