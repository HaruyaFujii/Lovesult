import { defineConfig } from 'orval';

export default defineConfig({
  api: {
    input: {
      target: './app/lib/api/openapi.json',
    },
    output: {
      mode: 'tags-split',
      target: './app/lib/api/generated/endpoints',
      schemas: './app/lib/api/generated/models',
      client: 'react-query',
      mock: false,
      prettier: true,
    },
    hooks: {
      afterAllFilesWrite: 'prettier --write',
    },
  },
});