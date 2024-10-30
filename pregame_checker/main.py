import customtkinter as ctk
import isGameRunning
from isGameRunning import logging
import os
import requests
from valclient import Client
from multiprocessing import Process, Queue
import pystray
from PIL import Image
from screeninfo import get_monitors
import webbrowser
import json
import sys

# We need to handle errors. And we need to make this run in a system tray.

# Shared queue for inter-process communication
queue = Queue()

screenWidth = get_monitors()[0].width
screenHeight = get_monitors()[0].height

# Get the AppData directory path
appdataPath = os.getenv('APPDATA')
vailDir = os.path.join(appdataPath, "VAIL")
filePath = os.path.join(vailDir, "vail.json")

# Create the directory if it doesn't exist
if not os.path.exists(vailDir):
    os.makedirs(vailDir)

# global client object
client = None
pregame_iteration_timeout = 30000


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
        print("created json file for app state")
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
        print(f"updated app state value to {arg}")

def loginState():
    try:
        with open(filePath, 'r') as f:
            data = json.load(f)
            state = data.get('loginState')
            print(f"Current login state: {state}")  # Debug print
            if state is None:
                writeLoginState(0)
                print("Login state was None, setting to 0")
                return 0
            return state  # Return the actual state value
    except (FileNotFoundError, json.JSONDecodeError):
        writeLoginState(0)  # Initialize the file with default values
        print("File not found or invalid JSON, setting login state to 0")
        return 0
    
def writeLoginState(arg):
    try:
        # Read existing data, update loginState, and write back
        data = {}
        if os.path.exists(filePath):
            with open(filePath, 'r') as f:
                data = json.load(f)  # Load existing data

        data['loginState'] = arg  # Update loginState
        print(f"Writing login state: {arg}")  # Debug print

        with open(filePath, 'w') as f:
            json.dump(data, f, indent=4)  # Write the updated data back to the file
            print(f"Successfully wrote login state: {arg}")
    except Exception as e:
        print(f"Error writing login state: {e}")


def showLoginPopup():
    def on_login():
        username = entry_username.get()
        password = entry_password.get()
        #mail = entry_mail.get()
        if username and password:
            print(f"Username: {username}, Password: {password}")

            login_window.destroy()
            writeLoginState(1)
        else:
            print("Login cancelled")
            writeLoginState(0)
            sys.exit(0)

    def on_closing():
        print("Login window closed")
        writeLoginState(0)
        sys.exit(0)  # Exit cleanly

    login_window = ctk.CTk()
    login_window.title("Login")

    # window settings
    window_width = screenWidth // 3
    window_height = screenHeight // 3
    screen_width = login_window.winfo_screenwidth()
    screen_height = login_window.winfo_screenheight()
    x = (screen_width - window_width) // 2
    y = (screen_height - window_height) // 2
    login_window.geometry(f'{window_width}x{window_height}+{x}+{y}')

    login_window.protocol("WM_DELETE_WINDOW", on_closing)  # Handle window close button

    ctk.CTkLabel(login_window, text="Username:").pack(pady=10)
    entry_username = ctk.CTkEntry(login_window)
    entry_username.pack(pady=10)

    ctk.CTkLabel(login_window, text="Password:").pack(pady=10)
    entry_password = ctk.CTkEntry(login_window, show='*')
    entry_password.pack(pady=10)

    """ ctk.CTkLabel(login_window, text="Mail:").pack(pady=10)
    entry_mail = ctk.CTkEntry(login_window, show='*')
    entry_mail.pack(pady=10)"""

    ctk.CTkButton(login_window, text="Login", command=on_login).pack(pady=20)

    login_window.mainloop()


def enableButton():
    queue.put("enable")
    print("Enabled!")
    logging.debug("Enabled VAIL")
    update_status_label(True)

def disableButton():
    queue.put("disable")
    print("Disabled!")
    logging.debug("Disabled VAIL")
    update_status_label(False)


def quit_app():
    queue.put("quit")
    print("Quitting!")
    logging.debug("Quitting VAIL")
    app.quit() if 'app' in globals() else None
    exit(0)


def gameStatus():
    gameBool = isGameRunning.isRunning()
    if 'gameStatusLabel' in globals():
        if gameBool:
            gameStatusLabel.configure(text="Valorant is running", text_color="lightgreen")
        else:
            gameStatusLabel.configure(text="Valorant is not running", text_color="red")
    
    app.after(5000, gameStatus) # runs this Fn again after n milliseconds

def attempt_logging_in(username, password):
    try:
        response = requests.post("http://95.154.228.110:3001/login", json={
            username: username,
            password: password
        })

        if response.status_code == 200:
            jsonified_response = response.json()
            username = jsonified_response['username']
            encoded_password = jsonified_response['encoded_password']
            return {"username": username, "encoded_password": encoded_password}
        else:
            print(response.status_code, response.text)
            return None

    except Exception as e:
        print(e)
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
    playerID, headers, local_headers = client.__get_auth_headers()
    try:
        requests.post("http://95.154.228.110:3001/analyze_pregame", json={
            "playerID": playerID,
            "matchID": matchID,
            "headers": headers,
            "clientPlatform": headers['X-Riot-ClientPlatform'],
            "clientVersion": headers['X-Riot-ClientVersion'],
            "entitlementsJWT": headers['X-Riot-Entitlements-JWT'],
            "authToken": headers['Authorization'],
            "region": client.region,
            "endpoint": isGameRunning.getEndpoint(matchID, client),


        })
        print("Sent request to server successfully")
    except Exception as e:
        print('dam we fucked up better handle this error ig')


def open_login_popup():
    login_popup = ctk.CTkToplevel(app)
    login_popup.title("Login")
    login_popup.geometry("{screenWidth/3}x{screenHeight/3}")
    login_popup.resizable(False, False)

    login_label = ctk.CTkLabel(login_popup, text="Username:")
    login_label.pack(pady=10)

    login_entry = ctk.CTkEntry(login_popup)
    login_entry.pack(pady=5)

    password_label = ctk.CTkLabel(login_popup, text="Password:")
    password_label.pack(pady=10)

    password_entry = ctk.CTkEntry(login_popup, show="*")
    password_entry.pack(pady=5)

    login_button = ctk.CTkButton(login_popup, text="Login", command=lambda: login_logic(login_entry.get(), password_entry.get()))
    login_button.pack(pady=10)

    def login_logic(username, password):
        loginAttempt = attempt_logging_in(username, password)
        if loginAttempt is None:
            print('error, do this. erorr messge')
        
        print(f"Attempting to login with username: {username}, password: {password}")
        login_popup.destroy()


def gui_app(queue):
    global app, statusLabel, gameStatusLabel
    ctk.set_appearance_mode("dark")

    githubIcon = ctk.CTkImage(Image.open("../assets/github.png"),
                           size=(60, 60))
    infIcon = ctk.CTkImage(Image.open("../assets/infIco.png"),
                           size=(64,64))

    TITLE_FONT = "Impact" 
    TEXT_FONT = "Helvetica" 
    
    app = ctk.CTk()
    app.title("VAIL")
    app.minsize(screenWidth/3, screenHeight/2.2)
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
        main_frame,
        text="QUIT",
        command=quit_app,
        fg_color="#1F2326",
        hover_color="#2F3136",
        height=40
    )
    buttonQuit.grid(row=5, column=0, sticky="ew", padx=20)

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

        print("Checking for game status")

        if isGameRunning.isRunning() and int(appState()) == 1:
            print("Conditions met, checking pregame")

            if not client:
                print("Creating client")
                client = isGameRunning.create_client()
            
            matchID = isGameRunning.check_in_pregame(client)

            if matchID is not None:
                print("Pregame detected")
                tell_server_pregame_is_detected(client)
            else: 
                print("Not in pregame at the moment")
        else: 
            print("Conditions not met")

        app.after(pregame_iteration_timeout, iterate_check_pregame)

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
        app.after(200, check_queue)

    check_queue()
    app.mainloop()



# Pystray System Tray Setup
def setup_tray_icon(queue):
    icon_path = "../assets/vailIco.png"
    icon_image = Image.open(icon_path)

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


def show_gui():
    gui_process = Process(target=gui_app)
    gui_process.start()


if __name__ == "__main__":
    if loginState() == 0:
        print("Login state is 0")
        showLoginPopup()
    else:
        print("Login state is not 0, continuing...")
    gui_process = Process(target=gui_app, args=(queue,), name="GUI")
    gui_process.start()
    tray_process = Process(target=setup_tray_icon, args=(queue,), name="pysTray")
    tray_process.start()

    gui_process.join()
    tray_process.terminate()