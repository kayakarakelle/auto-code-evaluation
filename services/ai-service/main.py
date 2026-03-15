from http.server import HTTPServer, BaseHTTPRequestHandler
import json

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({'service': 'ai-service', 'status': 'ok'}).encode())
    def log_message(self, format, *args):
        pass

print('ai-service listening on port 8002')
HTTPServer(('0.0.0.0', 8002), Handler).serve_forever()