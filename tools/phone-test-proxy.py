"""Temporary LAN bridge for native phone login/design testing; no admin routes."""
import argparse
import re
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from urllib.parse import urlsplit

class Proxy(BaseHTTPRequestHandler):
    def log_message(self, *_):
        pass
    def handle_request(self):
        path = urlsplit(self.path).path
        allowed = {
            'GET': path in ('/api/catalog', '/api/designs', '/api/my/orders'),
            'POST': path in ('/api/auth/wechat', '/api/designs', '/api/my/orders'),
            'PUT': bool(re.fullmatch(r'/api/designs/[a-f0-9]{32}', path)),
        }.get(self.command, False)
        if not allowed:
            self.send_error(403)
            return
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if not 0 <= length <= 262144:
                self.send_error(413)
                return
            data = self.rfile.read(length) if self.command in ('POST', 'PUT') else None
            headers = {'Content-Type': 'application/json'}
            if self.headers.get('Authorization'):
                headers['Authorization'] = self.headers['Authorization']
            req = Request('http://127.0.0.1:8800' + path, data=data, headers=headers, method=self.command)
            try:
                response = urlopen(req, timeout=15)
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

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--host', required=True)
    args = parser.parse_args()
    print('Phone test bridge ready: ' + args.host + ':8802', flush=True)
    ThreadingHTTPServer((args.host, 8802), Proxy).serve_forever()
