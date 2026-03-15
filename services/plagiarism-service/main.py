from http.server import HTTPServer, BaseHTTPRequestHandler
import json

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({'service': 'plagiarism-service', 'status': 'ok'}).encode())
    def log_message(self, format, *args):
        pass

print('plagiarism-service listening on port 8003')
HTTPServer(('0.0.0.0', 8003), Handler).serve_forever()