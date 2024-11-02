from time import sleep
import customtkinter as ctk
import isGameRunning
from isGameRunning import logging
import os
import requests
from valclient import Client
from multiprocessing import Process, Queue, freeze_support
import threading
import pystray
from PIL import Image, ImageTk
from screeninfo import get_monitors
import webbrowser
import json
import sys

# Global variables
# Shared queue for inter-process communication
queue = Queue()
screenWidth = get_monitors()[0].width
screenHeight = get_monitors()[0].height
server_endpoint = "http://95.154.228.111:3001/"

username = None
password = None

gui_process = None
tray_process = None
app = None

# Get the AppData directory path
appdataPath = os.getenv('APPDATA')
vailDir = os.path.join(appdataPath, "VAIL")
filePath = os.path.join(vailDir, "vail.json")

icon_path = "assets/vailIco.ico"
github_icon = "assets/github.png"
inf_icon = "assets/infIco.png"

# Create the directory if it doesn't exist
if not os.path.exists(vailDir):
    os.makedirs(vailDir)

# global client object
client = None
pregame_iteration_timeout = 20000


def set_window_icon(window):
    """Set window icon for both title bar and taskbar"""
    if os.path.exists(icon_path):
        try:
            # For Windows taskbar
            window.wm_iconbitmap(icon_path)
            # For title bar
            icon_image = Image.open(icon_path)
            icon_photo = ImageTk.PhotoImage(icon_image)
            window.iconphoto(True, icon_photo)
            
            logging.debug(f"Icon set successfully from: {icon_path}")
        except Exception as e:
            logging.error(f"Failed to set window icon: {e}")
    else:
        logging.debug(f"Icon not found at: {icon_path}")


def openLink(lnk):
    webbrowser.open(lnk)


def appState(): 
    try:
        with open(filePath, 'r') as f:
            data = json.load(f)
            state = data.get('appState', 0)  # Use get to avoid KeyError
            return state
    except (FileNotFoundError, json.JSONDecodeError):  # Handle specific exceptions
        writeAppState(0)  # Initialize the file with default values
        logging.debug("created json file for app state")
        return 0            

def writeAppState(arg):
    # Read existing data, update appState, and write back
    data = {}
    if os.path.exists(filePath):
        with open(filePath, 'r') as f:
            data = json.load(f)  # Load existing data

    data['appState'] = arg  # Update appState

    with open(filePath, 'w') as f:
        json.dump(data, f, indent=4)  # Write the updated data back to the file
        logging.debug(f"updated app state value to {arg}")

def initialize_json_file():
    # Initialize the JSON file with default values if it doesn't exist or is empty.
    if not os.path.exists(filePath) or os.path.getsize(filePath) == 0:
        with open(filePath, 'w') as f:
            json.dump({'loginState': 0, 'appState': 0}, f, indent=4)
        logging.debug(f"Initialized JSON file at {filePath}")

def read_json_file():
    # Read the JSON file and return the data
    try:
        with open(filePath, 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        initialize_json_file()
        return {'loginState': 0, 'appState': 0}

def write_json_file(data):
    # Write the data to the JSON file
    with open(filePath, 'w') as f:
        json.dump(data, f, indent=4)
        logging.debug(f"Successfully wrote data to {filePath}")

def loginState():
    data = read_json_file()
    state = data.get('loginState', 0)
    logging.debug(f"Current login state: {state}")
    return state

def writeLoginState(arg):
    data = read_json_file()
    data['loginState'] = arg
    if data['loginState'] == 0:
        if 'username' in data:
            del data['username']
        if 'password' in data:
            del data['password']
    logging.debug(f"Writing login state: {arg}")
    write_json_file(data)


def restart_app():
    logging.debug("Restarting application...")
    app.withdraw()
    showLoginPopup()


def logout():
    writeLoginState(0)
    logging.debug("Logged out")
    restart_app()


def errorLabel(message):
    if 'error_label' in globals():
        # Use after() to safely update from any thread
        if 'login_window' in globals():
            login_window.after(0, lambda: error_label.configure(text=message, text_color="red"))


def showLoginPopup():
    global username, password, error_label, login_window

    def perform_login_attempt(username, password):
        # Run login attempt in background thread
        def login_thread():
            loginAttempt = attempt_logging_in(username, password)
            if loginAttempt is not None:
                login_window.after(0, lambda: handle_successful_login())
            else:
                login_button.configure(state="normal", text="Login")
            
        def handle_successful_login():
            writeLoginState(1)
            login_window.destroy()
            if app: app.deiconify()

        threading.Thread(target=login_thread, daemon=True).start()

    def on_login():
        username = entry_username.get().strip()
        password = entry_password.get()

        if username and password:
            # Disable login button and show loading state
            login_button.configure(state="disabled", text="Logging in...")
            error_label.configure(text="Attempting to login...")
            logging.debug(f"Username: {username}, Password: {password}")
            perform_login_attempt(username, password)
        else:
            errorLabel("Username and password required")

    def on_window_close():
        logging.debug("Login cancelled")
        writeLoginState(0)
        login_window.destroy()
        sys.exit(0)

    def handle_enter(event):
        login_button.invoke()
    
    def handle_escape(event):
        on_window_close()

    def handle_down(event):
        entry_password.focus()
    
    def handle_up(event):
        entry_username.focus()

    login_window = ctk.CTk()
    login_window.title("Login")

    set_window_icon(login_window)

    # Window settings
    window_width = screenWidth // 3
    window_height = screenHeight // 3
    screen_width = login_window.winfo_screenwidth()
    screen_height = login_window.winfo_screenheight()
    x = (screen_width - window_width) // 2
    y = (screen_height - window_height) // 2
    login_window.resizable(width=False, height=False)
    login_window.geometry(f'{window_width}x{window_height}+{x}+{y}')

    login_window.protocol("WM_DELETE_WINDOW", on_window_close)

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

    login_window.bind("<Return>", handle_enter)
    login_window.bind("<KP_Enter>", handle_enter)
    login_window.bind("<Escape>", handle_escape)
    login_window.bind("<Down>", handle_down)
    login_window.bind("<Up>", handle_up)

    login_window.after(100, lambda: entry_username.focus())
    login_window.focus_force()
    login_window.mainloop()


def enableButton():
    queue.put("enable")
    logging.debug("Enabled app function!")
    logging.debug("Enabled VAIL")
    update_status_label(True)

def disableButton():
    queue.put("disable")
    logging.debug("Disabled app function!")
    logging.debug("Disabled VAIL")
    update_status_label(False)


def quit_app():
    logging.debug("Quitting application...")
    try:
        # Signal all processes to quit
        queue.put("quit")
        
        # Properly destroy and cleanup GUI
        if 'app' in globals() and app:
            app.quit()
            app.destroy()
        
        # Force terminate processes if they exist
        if 'gui_process' in globals() and gui_process:
            gui_process.terminate()
            gui_process.join(timeout=2)
            if gui_process.is_alive():
                gui_process.kill()
                
        if 'tray_process' in globals() and tray_process:
            tray_process.terminate()
            tray_process.join(timeout=2) 
            if tray_process.is_alive():
                tray_process.kill()
                
        # Clear queue
        while not queue.empty():
            queue.get()
            
        logging.debug("Application shutdown complete")
        sys.exit(0)
        
    except Exception as e:
        logging.error(f"Error during shutdown: {e}")
        # Force exit if normal shutdown fails
        os._exit(1)


def gameStatus():
    gameBool = isGameRunning.isRunning()
    if 'gameStatusLabel' in globals():
        if gameBool:
            gameStatusLabel.configure(text="Valorant is running", text_color="lightgreen")
        else:
            gameStatusLabel.configure(text="Valorant is not running", text_color="red")
    
    app.after(5000, gameStatus) # runs this Fn again after n milliseconds

def attempt_verifying_credentials():
    data = read_json_file()

    if 'username' not in data or 'password' not in data:
        logging.debug("No username or password found in file")
        return False
    
    username = data['username']
    encoded_password = data['password']

    try:
        response = requests.post(f"{server_endpoint}/verify-authentication", json={
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
        errorLabel("Connection error. Unable to reach the server. Maybe check your internet?")
        return ConnectionError
    except requests.exceptions.Timeout:
        logging.error("Request timed out. The server may be unavailable.")
    except requests.exceptions.RequestException as e:
        logging.error(f"An error occurred: {e}")

def attempt_logging_in(username, password, max_retries=4):
    invalid_credentials = False
    for attempt in range(max_retries):
        try:
            logging.debug(f"Attempt {attempt + 1} of {max_retries}: Sending login request")

            response = requests.post(f"{server_endpoint}/login", json={
                'username': username,
                'password': password
            }, timeout=10)

            logging.debug(f"Login response received: {response.status_code} - {response.text}")

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
                invalid_credentials = True
                login_window.after(0, lambda: error_label.configure(
                    text="Invalid credentials, please try again",
                    text_color="red"
                ))
                return None
            else:
                logging.debug("else block \nattempt logging\n in", response.status_code, response.text)
                return None

        except requests.exceptions.ConnectionError:
            logging.error(f"Attempt {attempt + 1} failed: Connection error.\nRetrying...")
            errorLabel(f"Attempt {attempt + 1} failed: Connection error. Retrying...")
        except requests.exceptions.Timeout:
            logging.error(f"Attempt {attempt + 1} failed: Request timed out.Retrying...")
            errorLabel(f"Attempt {attempt + 1} failed: Request timed error.Retrying...")
        except requests.exceptions.RequestException as e:
            logging.error(f"Attempt {attempt + 1} failed: {e}\nRetrying...")
            errorLabel(f"Attempt {attempt + 1} failed. Retrying...")
        sleep(2)
        
    if not invalid_credentials:
        logging.debug(f"Login failed after {max_retries} attempts")
        errorLabel(f"Login failed after {max_retries} attempts")
    return None

def tell_server_pregame_is_detected(client: Client):
    '''
    need to send these as headers
    X-Riot-ClientPlatform: {client platform}
    X-Riot-ClientVersion: {client version}
    X-Riot-Entitlements-JWT: {entitlement token}
    Authorization: Bearer {auth token}
    region: {region}
    playerID: {player ID}
    '''
    global matchID
    jsonData = read_json_file()
    username = jsonData['username']
    password = jsonData['password']
    headers = client.headers
    
    try:
        response = requests.post(f"{server_endpoint}/check-pregame", json={
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

def login_logic(username, password, login_popup):
    loginAttempt = attempt_logging_in(username, password)
    if loginAttempt is None:
        logging.debug('login attempt failed')
    else:
        logging.debug(f"Attempting to login with username: {username}, password: {password}")


def gui_app(queue):

    global app, statusLabel, gameStatusLabel, buttonLogout
    ctk.set_appearance_mode("dark")

    githubIcon = ctk.CTkImage(Image.open(github_icon),
                           size=(60, 60))
    infIcon = ctk.CTkImage(Image.open(inf_icon),
                           size=(64,64))

    TITLE_FONT = "Impact" 
    TEXT_FONT = "Helvetica" 
    
    app = ctk.CTk()
    app.title("VAIL")
    appWindowWidth, appWindowHeight = screenWidth/3, screenHeight/2.2
    x = (app.winfo_screenwidth() - appWindowWidth) // 2
    y = (app.winfo_screenheight() - appWindowHeight) // 2
    app.minsize(appWindowWidth, appWindowHeight)
    app.geometry(f"{int(appWindowWidth)}x{int(appWindowHeight)}+{int(x)}+{int(y)}")
    
    app.configure(fg_color="#0F1923")
    app.grid_columnconfigure(0, weight=1)
    app.grid_rowconfigure((0,1,2,3), weight=1)

    set_window_icon(app)
    
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
        command=enableButton,
        fg_color="#FF4655",
        hover_color="#FF6B76",
        height=40
    )
    buttonEnable.grid(row=0, column=0, padx=(20, 10), sticky="ew")

    buttonDisable = ValorantButton(
        button_frame,
        text="DISABLE",
        command=disableButton,
        fg_color="#1F2326",
        hover_color="#2F3136",
        height=40
    )
    buttonDisable.grid(row=0, column=1, padx=(10, 20), sticky="ew")

    buttonQuit = ValorantButton(
        button_frame1,
        text="QUIT",
        command=quit_app,
        fg_color="#1F2326",
        hover_color="#2F3136",
        height=40
    )
    buttonQuit.grid(row=1, column=0, sticky="ew", padx=(20, 100))

    buttonLogout = ValorantButton(
        button_frame1,
        text="LOGOUT",
        command= lambda: logout(),
        fg_color="#1F2326",
        hover_color="#2F3136",
        height=40
    )
    buttonLogout.grid(row=1, column=1, sticky="ew", padx=(10, 20))

    buttonGit = ctk.CTkButton(
        main_frame,
        text="",
        command= lambda: openLink("https://github.com/SuppliedOrange/VAIL"),
        fg_color="transparent",
        hover_color="#2F3136",
        border_width=0,
        image=githubIcon
    )
    buttonGit.grid(row=6, column=0, sticky="sw", padx=70, pady=20)

    buttonDIAM = ctk.CTkButton(
        main_frame,
        text="",
        command= lambda: openLink("https://www.diamante.io/"),
        fg_color="transparent",
        hover_color="#2F3136",
        border_width=0,
        image=infIcon
    )
    buttonDIAM.grid(row=6, column=0, sticky="e", padx=70, pady=20)

    global update_status_label
    def update_status_label(active):
        if active:
            statusLabel.configure(text="ANTI-INSTALOCKER ACTIVE", text_color="#00FFA3")  # Valorant green
            writeAppState(1)
        else:
            statusLabel.configure(text="ANTI-INSTALOCKER INACTIVE", text_color="#FF4655")  # Valorant red
            writeAppState(0)

    # Override gameStatus function to match Valorant theme
    def gameStatus():
        gameBool = isGameRunning.isRunning()
        if 'gameStatusLabel' in globals():
            if gameBool:
                gameStatusLabel.configure(text="VALORANT IS RUNNING", text_color="#00FFA3")
            else:
                gameStatusLabel.configure(text="VALORANT IS NOT RUNNING", text_color="#FF4655")
        
        app.after(5000, gameStatus)

    # Bind the close button (X) to hiding the gui instead of close
    app.protocol('WM_DELETE_WINDOW', app.withdraw)

    # Initialize status
    if int(appState()) == 1:
        update_status_label(True)
    else:
        update_status_label(False)

    def iterate_check_pregame():
        global client, matchID

        logging.debug("Checking for game status")

        if isGameRunning.isRunning() and int(appState()) == 1:
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

    gameStatus()
    iterate_check_pregame()
    
    # Check queue for updates from tray
    def check_queue():
        if not queue.empty():
            message = queue.get()
            if message == "show":
                app.deiconify()
            elif message == "hide":
                app.withdraw()
            elif message == "enable":
                update_status_label(True)
            elif message == "disable":
                update_status_label(False)
            elif message == "quit":
                app.quit()
                quit_app()
                raise KeyboardInterrupt("Quit from tray")
        app.after(200, check_queue)

    check_queue()

    app.mainloop()


def connectionErrorWindow():
    errorWindow = ctk.CTk()
    errorWindow.title("Connection ERROR")
    errorWindow_width = screenWidth // 3
    errorWindow_height = screenHeight // 3
    errorWindow.minsize(errorWindow_width, errorWindow_height)
    # calculate screen centre position
    x = (screenWidth - errorWindow_width) // 2
    y = (screenHeight - errorWindow_height) // 2
    errorWindow.geometry(f'{errorWindow_width}x{errorWindow_height}+{x}+{y}')
    connectionErrorLabel = ctk.CTkLabel(errorWindow, text='FAILED TO CONNECT TO THE SERVER\nPlease check your internet connection', text_color='red')
    connectionErrorLabel.pack(pady=(100,40))

    
    def handle_escape(event):
        on_window_close()

    def handle_enter(event):
        retry_button.invoke()

    errorWindow.bind("<Return>", handle_enter)
    errorWindow.bind("<KP_Enter>", handle_enter)
    errorWindow.bind("<Escape>", handle_escape)

    def start_countdown(seconds=30):
        def update_countdown():
            nonlocal seconds
            if seconds > 0:
                connectionErrorLabel.configure(
                    text=f'FAILED TO CONNECT TO THE SERVER\nRetrying in {seconds} seconds...',
                    text_color='red'
                )
                seconds -= 1
                errorWindow.countdown_id = errorWindow.after(1000, update_countdown)
            else:
                handleRetry()  # Auto-retry when countdown reaches 0
                
        update_countdown()


    def handleRetry():
        # Cancel any existing countdown
        if hasattr(errorWindow, 'countdown_id'):
            errorWindow.after_cancel(errorWindow.countdown_id)

        retry_button.configure(state="disabled", text="Retrying...")
        connectionErrorLabel.configure(text="Attempting to reconnect...")

        def retryThread():
            result = attempt_verifying_credentials()

            if result == True:
                errorWindow.after(0, lambda: on_success())
            elif result == ConnectionError:
                errorWindow.after(0, lambda: on_failure())
            else:
                errorWindow.after(0, lambda: on_failure())
        
        def on_success():
            connectionErrorLabel.configure(text="Connection successful", text_color="green")
            errorWindow.after(1000, errorWindow.destroy())

        def on_failure():
            start_countdown()
            retry_button.configure(state="normal", text="Retry connection")

        # start retry in bg using threadding
        threading.Thread(target=retryThread, daemon=True).start()

    retry_button = ctk.CTkButton(errorWindow, text="Retry connection", command=handleRetry)
    retry_button.pack(pady=40)

    def on_window_close():
        logging.debug("Login cancelled")
        errorWindow.destroy()
        sys.exit(0)
    
    errorWindow.focus_force()
    errorWindow.protocol("WM_DELETE_WINDOW", on_window_close)
    start_countdown()
    errorWindow.mainloop()

# Pystray System Tray Setup
def setup_tray_icon(queue):
    icon_image = Image.open(icon_path)

    def show_gui(icon, item):
        queue.put("show")

    def hide_gui(icon, item):
        queue.put("hide")

    def quit_all(icon, item):
        queue.put("quit")
        icon.stop()
        quit_app()
        exit()

    icon = pystray.Icon("VAIL", icon_image, menu=pystray.Menu(
        pystray.MenuItem("Show", show_gui),
        pystray.MenuItem("Hide", hide_gui),
        pystray.MenuItem("Enable", lambda: queue.put("enable")),
        pystray.MenuItem("Disable", lambda: queue.put("disable")),
        pystray.MenuItem("Quit", quit_all)
    ))
    icon.run()


def main():
    
    def cleanup_processes():

        global tray_process, gui_process

        logging.info("Cleaning up processes...")

        if tray_process:
            logging.debug("Cleaning up tray icon...")
            tray_process.terminate()

        if gui_process:
            logging.debug("Cleaning up GUI...")
            gui_process.terminate()
        
        queue.put("quit")

    try:

        initialize_json_file()

        if loginState() == 1:

            logging.debug("Login state is not 0, continuing...")

            while True:

                logging.debug("Attempting to verify credentials...")

                try:
                    verification_result = attempt_verifying_credentials()
                    
                    if verification_result == ConnectionError:
                        logging.debug("Connection error, unable to reach server")
                        connectionErrorWindow()            

                    if verification_result:
                        logging.debug("Credentials verified, continuing...")
                        break
                        
                    logging.debug("Credentials not verified, logging out...")
                    writeLoginState(0)
                    showLoginPopup()
                    
                except Exception as e:
                    logging.error(f"An error occurred while verifying credentials: {e}")
                    sleep(5)

        else:
            logging.debug("Login state is 0, showing login popup...")
            showLoginPopup()

        global gui_process, tray_process

        gui_process = Process(target=gui_app, args=(queue,), name="GUI")
        tray_process = Process(target=setup_tray_icon, args=(queue,), name="pysTray")

        gui_process.start()
        tray_process.start()

        gui_process.join()

    except KeyboardInterrupt:
        logging.debug("\nReceived keyboard interrupt, shutting down")
    except Exception as e:
        logging.error(f"Unexpected error occured: {e}")
    finally:
        cleanup_processes()
        logging.debug("Application shutdown complete")

if __name__ == "__main__":

    #  If in pyinstaller executable, add freeze support.
    freeze_support()

    # If in pyinstaller executable, navigate to the correct directory
    if hasattr(sys, '_MEIPASS'): os.chdir(sys._MEIPASS)

    main()
