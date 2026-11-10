"""Temporary LAN-only bridge for phone development; never expose it to the public internet.

It deliberately rejects admin routes and forwards only the user-facing API surface.
"""
import argparse
import re
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from urllib.parse import urlsplit

class Proxy(BaseHTTPRequestHandler):
    upstream = 'http://127.0.0.1:8801'
    def log_message(self, *_):
        pass
    def handle_request(self):
        path = urlsplit(self.path).path
        allowed = allowed_path(self.command, path)
        if not allowed:
            self.send_error(403)
            return
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if not 0 <= length <= 2 * 1024 * 1024:
                self.send_error(413)
                return
            data = self.rfile.read(length) if self.command in ('POST', 'PUT') else None
            headers = {'Content-Type': 'application/json'}
            if self.headers.get('Authorization'):
                headers['Authorization'] = self.headers['Authorization']
            req = Request(self.upstream + path, data=data, headers=headers, method=self.command)
            try:
                response = urlopen(req, timeout=70 if path.startswith('/api/ai/') else 15)
            except HTTPError as e:
                response = e
            with response:
                body = response.read()
                status = response.status
                self.send_response(status)
                self.send_header('Content-Type', response.headers.get('Content-Type', 'application/json'))
                self.send_header('Content-Length', str(len(body)))
                self.send_header('Cache-Control', 'no-store')
                self.end_headers()
                self.wfile.write(body)
            print(self.command, path, status, flush=True)
        except Exception:
            self.send_error(502)
    do_GET = do_POST = do_PUT = do_DELETE = handle_request

def allowed_path(method, path):
    if path.startswith('/api/admin/'):
        return False
    if method == 'GET':
        return path in ('/api/catalog', '/api/designs', '/api/my/orders', '/api/kb/status', '/api/kb/index', '/api/kb/rules', '/api/kb/attributes', '/api/ai/status') or bool(re.fullmatch(r'/api/(?:shares/[A-Za-z0-9_-]{43}|kb/bead/[\w-]+)', path))
    if method == 'POST':
        return path in ('/api/designs', '/api/my/orders', '/api/shares', '/api/plans/match', '/api/auth/wechat', '/api/auth/dev', '/api/auth/logout') or path.startswith('/api/ai/')
    if method in ('PUT', 'DELETE'):
        return bool(re.fullmatch(r'/api/designs/[a-f0-9]{32}', path))
    return False

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--host', required=True)
    parser.add_argument('--upstream', default='http://127.0.0.1:8801')
    args = parser.parse_args()
    Proxy.upstream = args.upstream.rstrip('/')
    print('Phone test bridge ready: ' + args.host + ':8802', flush=True)
    ThreadingHTTPServer((args.host, 8802), Proxy).serve_forever()
