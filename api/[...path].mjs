import { handleRequest } from '../server/intent.mjs';

export default function handler(req, res) {
  // Vercel adds catch-all route parameters to the request query string.
  req.url = new URL(req.url, 'https://unbuilt.invalid').pathname;
  return handleRequest(req, res);
}
