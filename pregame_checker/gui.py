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

# We need to handle errors. And we need to make this run in a system tray.

# Shared queue for inter-process communication
queue = Queue()

screenWidth = get_monitors()[0].width
screenHeight = get_monitors()[0].height

# Get the AppData directory path
appdataPath = os.getenv('APPDATA')
vailDir = os.path.join(appdataPath, "VAIL")
filePath = os.path.join(vailDir, "appState.txt")

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
                state = f.read()
                return state
    except:
            writeAppState("0")
            print("created file")
            return 0            


def writeAppState(arg):
    with open(filePath, 'w') as f:
        f.write(str(arg))
        print(f"updated state value to {arg}")


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
        requests.post("http://localhost:5000/analyze_pregame", json={
            "playerID": playerID,
            "headers": headers,
            "region": client.region
        })
        print("Sent request to server successfully")
    except Exception as e:
        print('dam we fucked up better handle this error ig')


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
    app.minsize(screenWidth/3, screenHeight/2.5)
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
        global client

        print("Checking for game status")

        if isGameRunning.isRunning() and int(appState()) == 1:
            print("Conditions met, checking pregame")

            if not client:
                print("Creating client")
                client = isGameRunning.create_client()
            
            if isGameRunning.check_in_pregame(client):
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
        pystray.MenuItem("Show GUI", show_gui),
        pystray.MenuItem("Hide GUI", hide_gui),
        pystray.MenuItem("Enable", lambda: queue.put("enable")),
        pystray.MenuItem("Disable", lambda: queue.put("disable")),
        pystray.MenuItem("Quit", quit_all)
    ))
    icon.run()


def show_gui():
    gui_process = Process(target=gui_app)
    gui_process.start()


if __name__ == "__main__":
    gui_process = Process(target=gui_app, args=(queue,), name="GUI")
    gui_process.start()
    tray_process = Process(target=setup_tray_icon, args=(queue,), name="pysTray")
    tray_process.start()

    gui_process.join()
    tray_process.terminate()