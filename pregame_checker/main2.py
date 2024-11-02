import logging
import threading
import json
import requests
from time import sleep
from multiprocessing import Process, Queue, freeze_support
import customtkinter as ctk
import isGameRunning
from valclient import Client
import pystray
from PIL import Image, ImageTk
from screeninfo import get_monitors
import webbrowser
import os
import sys

# Set up logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

# Constants
SERVER_ENDPOINT = "http://95.154.228.111:3001/"
ICON_PATH = "assets/vailIco.ico"
GITHUB_ICON = "assets/github.png"
INF_ICON = "assets/infIco.png"
TITLE_FONT = "Impact"
TEXT_FONT = "Helvetica"

# Global variables
queue = Queue()
screen_width = get_monitors()[0].width
screen_height = get_monitors()[0].height
appdata_path = os.getenv('APPDATA')
vail_dir = os.path.join(appdata_path, "VAIL")
file_path = os.path.join(vail_dir, "vail.json")
client = None
pregame_iteration_timeout = 20000

# Functions for reading and writing JSON file
def read_json_file():
    try:
        with open(file_path, 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        initialize_json_file()
        return {'loginState': 0, 'appState': 0}

def write_json_file(data):

    oldData = read_json_file()
    for key in data:
        oldData[key] = data[key]

    with open(file_path, 'w') as f:
        json.dump(oldData, f, indent=4)
        logging.debug(f"Successfully wrote data to {file_path}")

def initialize_json_file():
    if not os.path.exists(vail_dir):
        os.makedirs(vail_dir)
    if not os.path.exists(file_path) or os.path.getsize(file_path) == 0:
        with open(file_path, 'w') as f:
            json.dump({'loginState': 0, 'appState': 0}, f, indent=4)
        logging.debug(f"Initialized JSON file at {file_path}")

# Functions for login and authentication
def show_login_popup():

    global entry_username, entry_password, login_button, login_window, error_label, screen_width, screen_height

    def on_login():

        username = entry_username.get().strip()
        password = entry_password.get()

        if username and password:
            login_button.configure(state="disabled", text="Logging in...")
            error_label.configure(text="Attempting to login...")
            logging.debug(f"Username: {username}, Password: {password}")
            perform_login_attempt(username, password)

        else:
            error_label.configure(text="Username and password required")

    def perform_login_attempt(username, password):
        def login_thread():
            loginAttempt = attempt_logging_in(username, password)
            if loginAttempt is not None:
                login_window.after(0, lambda: handle_successful_login())
            else:
                login_button.configure(state="normal", text="Login")

        def handle_successful_login():
            write_json_file({'loginState': 1, 'username': username, 'password': password})
            login_window.destroy()

        threading.Thread(target=login_thread, daemon=True).start()

    login_window = ctk.CTk()
    login_window.title("Login")

    # Window settings
    window_width = screen_width // 3
    window_height = screen_height // 3
    screen_width = login_window.winfo_screenwidth()
    screen_height = login_window.winfo_screenheight()
    x = (screen_width - window_width) // 2
    y = (screen_height - window_height) // 2
    login_window.resizable(width=False, height=False)
    login_window.geometry(f'{window_width}x{window_height}+{x}+{y}')

    error_label = ctk.CTkLabel(login_window, text="", text_color="red")
    error_label.pack(pady=5)

    ctk.CTkLabel(login_window, text="Username:").pack(pady=10)
    entry_username = ctk.CTkEntry(login_window)
    entry_username.pack(pady=10)

    ctk.CTkLabel(login_window, text="Password:").pack(pady=10)
    entry_password = ctk.CTkEntry(login_window, show='*')
    entry_password.pack(pady=10)

    login_button = ctk.CTkButton(login_window, text="Login", command=on_login)
    login_button.pack(pady=20)

    login_window.mainloop()

def attempt_logging_in(username, password, max_retries=4):
    for attempt in range(max_retries):
        try:
            response = requests.post(f"{SERVER_ENDPOINT}/login", json={
                'username': username,
                'password': password
            }, timeout=10)

            if response.status_code == 200:
                jsonified_response = response.json()
                username = jsonified_response['username']
                encoded_password = jsonified_response['accessToken']
                credentials = {"username": username, "encoded_password": encoded_password}

                data = read_json_file()
                if 'username' not in data or 'password' not in data:
                    data['username'] = credentials['username']
                    data['password'] = credentials['encoded_password']
                    logging.debug("json file: ", data)
                else:
                    logging.debug("Username and password already exist in file")
                write_json_file(data)
                return True

            elif response.status_code == 400:
                logging.debug("Invalid credentials")
                return None
            else:
                logging.debug("else block \nattempt logging\n in", response.status_code, response.text)
                return None

        except requests.exceptions.ConnectionError:
            logging.error(f"Attempt {attempt + 1} failed: Connection error.\nRetrying...")
        except requests.exceptions.Timeout:
            logging.error(f"Attempt {attempt + 1} failed: Request timed out.Retrying...")
        except requests.exceptions.RequestException as e:
            logging.error(f"Attempt {attempt + 1} failed: {e}\nRetrying...")
        sleep(2)

    logging.debug(f"Login failed after {max_retries} attempts")
    return None

def attempt_verifying_credentials():
    data = read_json_file()

    if 'username' not in data or 'password' not in data:
        logging.debug("No username or password found in file")
        return False

    username = data['username']
    encoded_password = data['password']

    try:
        response = requests.post(f"{SERVER_ENDPOINT}/verify-authentication", json={
            'username': username,
            'accessToken': encoded_password
        }, timeout = 10)

        if response.status_code == 200:
            return True
        else:
            logging.error(f"Verification failed: {response.status_code} - {response.text}")
            return False
    except requests.exceptions.ConnectionError:
        logging.error("Connection error. Unable to reach the server.")
        return False
    except requests.exceptions.Timeout:
        logging.error("Request timed out. The server may be unavailable.")
    except requests.exceptions.RequestException as e:
        logging.error(f"An error occurred: {e}")

# Functions for game status and actions
def check_game_status():

    global gameStatusLabel

    game_bool = isGameRunning.isRunning()
    if 'gameStatusLabel' in globals():
        if game_bool:
            gameStatusLabel.configure(text="VALORANT IS RUNNING", text_color="#00FFA3")
        else:
            gameStatusLabel.configure(text="VALORANT IS NOT RUNNING", text_color="#FF4655")

def tell_server_pregame_is_detected(client: Client):
    global matchID
    jsonData = read_json_file()
    username = jsonData['username']
    password = jsonData['password']
    headers = client.headers

    try:
        response = requests.post(f"{SERVER_ENDPOINT}/check-pregame", json={
            "playerID": client.puuid,
            "matchID": matchID,
            "headers": headers,
            "clientPlatform": headers['X-Riot-ClientPlatform'],
            "clientVersion": headers['X-Riot-ClientVersion'],
            "entitlementsJWT": headers['X-Riot-Entitlements-JWT'],
            "authToken": headers['Authorization'],
            "region": client.region,
            "endpoint": isGameRunning.getEndpoint(matchID, client),
            "username": username,
            "accessToken": password,
        },
        timeout=15)

        logging.debug("Sent request to server successfully")
        logging.debug(response.json())

        if 'error' in response.json():
            if response.json()['error'] == "Match already checked":
                sleep(40)

    except Exception as e:
        logging.error(f"Error sending pregame data: {e}")

# Functions for GUI and system tray
def gui_app(queue):
    ctk.set_appearance_mode("dark")

    app = ctk.CTk()
    app.title("VAIL")
    appWindowWidth, appWindowHeight = screen_width/3, screen_height/2.2
    x = (app.winfo_screenwidth() - appWindowWidth) // 2
    y = (app.winfo_screenheight() - appWindowHeight) // 2
    app.minsize(appWindowWidth, appWindowHeight)
    app.geometry(f"{int(appWindowWidth)}x{int(appWindowHeight)}+{int(x)}+{int(y)}")
    app.configure(fg_color="#0F1923")
    app.grid_columnconfigure(0, weight=1)
    app.grid_rowconfigure((0,1,2,3), weight=1)

    main_frame = ctk.CTkFrame(app, fg_color="#0F1923", border_width=2, border_color="#FF4655", corner_radius=0)
    main_frame.grid(row=0, column=0, sticky="nsew", padx=20, pady=20)
    main_frame.grid_columnconfigure(0, weight=1)

    title_label = ctk.CTkLabel(
        main_frame,
        text="VAIL",
        font=ctk.CTkFont(family=TITLE_FONT, size=38, weight="bold"),
        text_color="#FF4655",
    )
    title_label.grid(row=0, column=0, pady=(0, 10))

    appLabel = ctk.CTkLabel(
        main_frame,
        text="GET REWARDED FOR BEING A TEAM PLAYER",
        text_color="#ECE8E1",
        font=ctk.CTkFont(family=TEXT_FONT, size=12, weight="bold")
    )
    appLabel.grid(row=1, column=0, pady=(0, 20))

    status_frame = ctk.CTkFrame(
        main_frame,
        fg_color="#1F2326",
        corner_radius=0,
        border_width=1,
        border_color="#FF4655"
    )
    status_frame.grid(row=2, column=0, sticky="ew", pady=(0, 10), padx=20)

    gameStatusLabel = ctk.CTkLabel(
        status_frame,
        text="VALORANT IS NOT RUNNING",
        font=ctk.CTkFont(family=TITLE_FONT, size=18),
        text_color="#FF4655"
    )
    gameStatusLabel.pack(pady=10)

    instalocker_frame = ctk.CTkFrame(
        main_frame,
        fg_color="#1F2326",
        corner_radius=0,
        border_width=1,
        border_color="#FF4655"
    )
    instalocker_frame.grid(row=3, column=0, sticky="ew", pady=(0, 20), padx=20)

    statusLabel = ctk.CTkLabel(
        instalocker_frame,
        text="ANTI-INSTALOCKER INACTIVE",
        font=ctk.CTkFont(family=TITLE_FONT, size=20),
        text_color="#FF4655"
    )
    statusLabel.pack(pady=10)

    class ValorantButton(ctk.CTkButton):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)
            self.configure(
                corner_radius=0,
                border_width=1,
                border_color="#FF4655",
                font=ctk.CTkFont(family=TITLE_FONT, size=20)
            )

    button_frame = ctk.CTkFrame(main_frame, fg_color="transparent")
    button_frame.grid(row=4, column=0, sticky="ew", pady=(0, 20))
    button_frame.grid_columnconfigure((0, 1), weight=1)

    button_frame1 = ctk.CTkFrame(main_frame, fg_color="transparent")
    button_frame1.grid(row=5, column=0, sticky="ew", pady=(0, 20))
    button_frame1.grid_columnconfigure((0, 1), weight=1)

    buttonEnable = ValorantButton(
        button_frame,
        text="ENABLE",
        command=lambda: queue.put("enable"),
        fg_color="#FF4655",
        hover_color="#FF6B76",
        height=40
    )
    buttonEnable.grid(row=0, column=0, padx=(20, 10), sticky="ew")

    buttonDisable = ValorantButton(
        button_frame,
        text="DISABLE",
        command=lambda: queue.put("disable"),
        fg_color="#1F2326",
        hover_color="#2F3136",
        height=40
    )
    buttonDisable.grid(row=0, column=1, padx=(10, 20), sticky="ew")

    buttonQuit = ValorantButton(
        button_frame1,
        text="QUIT",
        command=lambda: queue.put("quit"),
        fg_color="#1F2326",
        hover_color="#2F3136",
        height=40
    )
    buttonQuit.grid(row=1, column=0, sticky="ew", padx=(20, 100))

    buttonLogout = ValorantButton(
        button_frame1,
        text="LOGOUT",
        command=lambda: write_json_file({'loginState': 0}),
        fg_color="#1F2326",
        hover_color="#2F3136",
        height=40
    )
    buttonLogout.grid(row=1, column=1, sticky="ew", padx=(10, 20))

    app.protocol('WM_DELETE_WINDOW', app.withdraw)

    def iterate_check_pregame():
        global client, matchID

        logging.debug("Checking for game status")

        if isGameRunning.isRunning() and read_json_file()['appState'] == 1:
            logging.debug("Conditions met, checking pregame")

            if not client:
                logging.debug("Creating client")
                client = isGameRunning.create_client()

            matchID = isGameRunning.check_in_pregame(client)
            logging.debug(f"Match ID: {matchID}")

            if matchID is not None:
                logging.debug("Pregame detected")
                tell_server_pregame_is_detected(client)
            else:
                logging.debug("Not in pregame at the moment")
        else:
            logging.debug("Conditions not met")

    check_game_status()
    iterate_check_pregame()

    def check_queue():
        if not queue.empty():
            message = queue.get()
            if message == "show":
                app.deiconify()
            elif message == "hide":
                app.withdraw()
            elif message == "enable":
                statusLabel.configure(text="ANTI-INSTALOCKER ACTIVE", text_color="#00FFA3")
                write_json_file({'appState': 1})
            elif message == "disable":
                statusLabel.configure(text="ANTI-INSTALOCKER INACTIVE", text_color="#FF4655")
                write_json_file({'appState': 0})
            elif message == "quit":
                app.quit()
                exit()
                return
        app.after(200, check_queue)

    check_queue()

    while True:
        sleep(0.1)
        app.update()
        app.update_idletasks()

def setup_tray_icon(queue):
    icon_image = Image.open(ICON_PATH)

    def show_gui(icon, item):
        queue.put("show")

    def hide_gui(icon, item):
        queue.put("hide")

    def quit_all(icon, item):
        queue.put("quit")
        icon.stop()

    icon = pystray.Icon("VAIL", icon_image, menu=pystray.Menu(
        pystray.MenuItem("Show", show_gui),
        pystray.MenuItem("Hide", hide_gui),
        pystray.MenuItem("Enable", lambda: queue.put("enable")),
        pystray.MenuItem("Disable", lambda: queue.put("disable")),
        pystray.MenuItem("Quit", quit_all)
    ))
    icon.run()

# Main function
def main():
    initialize_json_file()

    if read_json_file()['loginState'] == 1:
        while True:
            if attempt_verifying_credentials():
                break
            else:
                show_login_popup()
    else:
        show_login_popup()

    gui_process = Process(target=gui_app, args=(queue,), name="GUI")
    tray_process = Process(target=setup_tray_icon, args=(queue,), name="pysTray")

    gui_process.start()
    tray_process.start()

    gui_process.join()

if __name__ == "__main__":
    freeze_support()
    if hasattr(sys, '_MEIPASS'): os.chdir(sys._MEIPASS)
    main()
