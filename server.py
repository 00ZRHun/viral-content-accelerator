#!/usr/bin/env python3
"""Local development server for the Viral Content Accelerator landing page.

Zero third-party dependencies. Serves the static site with production-minded
headers. The page itself has no form endpoint; enrollment links go to the
official One Peak Creative program page.

    python3 server.py --port 4173
"""

from __future__ import annotations

import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent


class SiteHandler(SimpleHTTPRequestHandler):
    server_version = "VCALanding/1.0"

    def end_headers(self) -> None:
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "SAMEORIGIN")
        self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")
        self.send_header("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
        self.send_header(
            "Content-Security-Policy",
            "default-src 'self'; img-src 'self' data:; "
            "style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; "
            "font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; "
            "form-action 'self'; upgrade-insecure-requests",
        )
        if self.path.startswith("/assets/"):
            self.send_header("Cache-Control", "public, max-age=604800")
        else:
            self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def list_directory(self, path):  # noqa: ANN001
        self.send_error(404, "Not found")
        return None


def make_server(port: int = 4173, host: str = "127.0.0.1") -> ThreadingHTTPServer:
    handler = partial(SiteHandler, directory=str(ROOT))
    return ThreadingHTTPServer((host, port), handler)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run the VCA landing page locally.")
    parser.add_argument("--port", type=int, default=4173)
    parser.add_argument("--host", default="127.0.0.1")
    args = parser.parse_args()

    httpd = make_server(args.port, args.host)
    print(f"Viral Content Accelerator → http://{args.host}:{args.port}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        httpd.server_close()
