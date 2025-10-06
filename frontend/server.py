import http.server
import socketserver
import os

PORT = 8080

class SpaHttpRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # If the requested path doesn't exist, serve index.html
        # This is a common requirement for Single Page Applications (SPAs).
        path = self.translate_path(self.path)
        if not os.path.exists(path):
            self.path = 'index.html'
        
        return http.server.SimpleHTTPRequestHandler.do_GET(self)

# Create the server within the context of the 'frontend' directory
# The server will be run from the 'frontend' directory as per README instructions.
with socketserver.TCPServer(("", PORT), SpaHttpRequestHandler) as httpd:
    print(f"Serving SPA on http://localhost:{PORT}")
    httpd.serve_forever()
