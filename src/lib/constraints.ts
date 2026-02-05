export const API_POLICY = {
  MAX_JSON_SIZE: 1024 * 1024,
  MAX_UPLOAD_SIZE: 10 * 1024 * 1024,
  ALLOWED_METHODS: ['POST', 'PUT', 'PATCH'],
  CONTENT_TYPE_JSON: 'application/json'
} as const;
