import uvicorn
import webbrowser
import threading


def open_swagger():
    webbrowser.open("http://127.0.0.1:3000/docs")


if __name__ == "__main__":
    threading.Timer(2.0, open_swagger).start()

    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=3000,
        reload=True
    )