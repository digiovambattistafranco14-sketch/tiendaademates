"""
Servidor local para ver la tienda sin problemas de caché.
Uso: python servidor.py   y abrí http://127.0.0.1:5180/
"""
import functools
import http.server
import os

PUERTO = 5180


class SinCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Expires", "0")
        super().end_headers()


if __name__ == "__main__":
    carpeta = os.path.dirname(os.path.abspath(__file__))
    handler = functools.partial(SinCache, directory=carpeta)
    with http.server.ThreadingHTTPServer(("127.0.0.1", PUERTO), handler) as srv:
        print(f"Tienda Mate en http://127.0.0.1:{PUERTO}/")
        srv.serve_forever()
