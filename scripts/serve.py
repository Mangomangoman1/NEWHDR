#!/usr/bin/env python3
"""Preview the static site with Vercel-style clean URLs, using only Python."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit
import json
import os

ROOT = Path(__file__).resolve().parent.parent
CONFIG = json.loads((ROOT / 'vercel.json').read_text())

class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def do_GET(self):
        route = urlsplit(self.path).path
        for redirect in CONFIG['redirects']:
            if route == redirect['source']:
                self.send_response(redirect['statusCode'])
                self.send_header('Location', redirect['destination'])
                self.end_headers()
                return
        # Analytics endpoints are supplied by Vercel in production.
        if route.startswith('/_vercel/'):
            self.send_response(204)
            self.end_headers()
            return
        super().do_GET()

    def translate_path(self, path):
        resolved = Path(super().translate_path(path))
        if not resolved.suffix and resolved.with_suffix('.html').is_file():
            return str(resolved.with_suffix('.html'))
        return str(resolved)

if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=8080)
    args = parser.parse_args()
    os.chdir(ROOT)
    print(f'Preview: http://localhost:{args.port}', flush=True)
    ThreadingHTTPServer(('127.0.0.1', args.port), Handler).serve_forever()
