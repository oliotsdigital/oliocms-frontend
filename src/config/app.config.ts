/**
 * Frontend Application Configuration loaded from environment variables.
 */
export const APP_CONFIG = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1",
  appName: "OlioCMS",
  apiPromptTemplate:
    process.env.NEXT_PUBLIC_API_PROMPT_TEMPLATE ||
    `I need you to build a feature in my Next.js / React application that consumes a dynamic REST API endpoint for the collection '{{COLLECTION_NAME}}'.

API Details:
- Endpoint: {{ENDPOINT_URL}}
- Method: GET
- Headers:
  - X-API-Key: {{API_KEY}}
  - Accept: application/json

Collection Schema Fields:
{{SCHEMA_FIELDS}}

Requirements:
1. Create a modern TypeScript component/service that fetches data from {{ENDPOINT_URL}}.
2. Implement proper error handling, loading skeleton states, and dynamic pagination metadata.
3. Support query filtering, sorting, and field selection based on the collection schema above.
4. If building for Next.js, use Server Components with Incremental Static Regeneration (ISR, e.g. revalidate: 60) for maximum performance.
5. Provide clean, well-structured, production-ready code with responsive Tailwind CSS styling.`,
};

