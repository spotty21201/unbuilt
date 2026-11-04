import { handleRequest } from '../server/intent.mjs';

export default function handler(req, res) {
  const url = new URL(req.url, 'https://unbuilt.invalid');
  const route = url.searchParams.get('unbuiltPath');
  req.url = route === null ? url.pathname : `/api/${route}`;
  return handleRequest(req, res);
}
