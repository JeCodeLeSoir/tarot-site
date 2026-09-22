from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Timer
import webbrowser


SITE_DIR = Path(__file__).resolve().parent
URL = "http://127.0.0.1:8765/index.html"


class NoCacheHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(SITE_DIR), **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def do_GET(self):
        if "If-Modified-Since" in self.headers:
            del self.headers["If-Modified-Since"]
        super().do_GET()

    def do_HEAD(self):
        if "If-Modified-Since" in self.headers:
            del self.headers["If-Modified-Since"]
        super().do_HEAD()


if __name__ == "__main__":
    server = ThreadingHTTPServer(("127.0.0.1", 8765), NoCacheHandler)
    print(f"Site local sans cache : {URL}", flush=True)
    print("Fermez cette fenêtre ou appuyez sur Ctrl+C pour arrêter le serveur.", flush=True)
    Timer(0.5, lambda: webbrowser.open(URL)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
