from http.server import HTTPServer, BaseHTTPRequestHandler
import json

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({'service': 'analysis-service', 'status': 'ok'}).encode())
    def log_message(self, format, *args):
        pass

print('analysis-service listening on port 8001')
HTTPServer(('0.0.0.0', 8001), Handler).serve_forever()