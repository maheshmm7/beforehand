// The same answer in plain JavaScript, so a TypeScript build problem and a
// function problem cannot be mistaken for each other. Delete it once the
// question is settled.
export default function handler(request, response) {
  response.statusCode = 200;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.end(JSON.stringify({ ok: true, language: 'javascript', node: process.version }));
}
