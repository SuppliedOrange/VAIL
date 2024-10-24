import customtkinter as ctk
import isGameRunning
from isGameRunning import logging
import os
import requests
from valclient import Client

# We need to handle errors. And we need to make this run in a system tray.
# Also preferably put the GUI in a subprocess that is activated and killed by the system tray.

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
    print("Enabled!")
    logging.debug("Enabled VAIL")
    writeAppState(1)
    statusLabel.configure(text="Anti - Instalocker Active", text_color="lightgreen")


def disableButton():
    print("Disabled!")
    logging.debug("Disabled VAIL")
    writeAppState(0)
    statusLabel.configure(text="Anti - Instalocker Inactive", text_color="pink")


def quitButton():
    logging.debug("Exiting app")
    app.destroy()


def gameStatus():

    gameBool = isGameRunning.isRunning()

    if gameBool == True:
        gameStatusLabel.configure(text="Valorant is running", text_color="lightgreen")
    else:
        gameStatusLabel.configure(text="Valorant is not running", text_color="red")
    
    # runs this Fn again after n milliseconds
    app.after(5000, gameStatus)

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

def main():

    global app
    global statusLabel
    global gameStatusLabel
    ctk.set_appearance_mode("dark")

    app = ctk.CTk()
    app.title("Anti-Instalockinator")
    app.geometry("480x360")
    app.grid_columnconfigure(0, weight=1)
    app.grid_columnconfigure(1, weight=0)
    app.grid_rowconfigure(1, weight=0)
    app.grid_rowconfigure((0,1), weight=1)

    appLabel = ctk.CTkLabel(
        app,
        text="Get rewarded for being a team player :P",
        text_color="lightblue",
        font=("Comic Sans MS", 14)
    )
    appLabel.grid(row=0, column=0, sticky="n", pady=40)

    statusLabel = ctk.CTkLabel(
        app,
        text="",
        font=("Comic Sans MS", 18),
    )
    statusLabel.grid(row=0, column=0, sticky="s", pady=20, padx=10)

    gameStatusLabel = ctk.CTkLabel(
        app,
        text="test",
        font=("Comic Sans MS", 16),
    )
    gameStatusLabel.grid(row=0, column=0)

    buttonEnable = ctk.CTkButton(app, text="Enable", command=enableButton)
    buttonEnable.grid(row=1, column=0, sticky="nw", padx=40, pady=20)

    buttonDisable = ctk.CTkButton(app, text="Disable", command=disableButton)
    buttonDisable.grid(row=1, column=0, sticky="ne", padx=40, pady=20)

    buttonQuit = ctk.CTkButton(app, text="Quit", command=quitButton, fg_color="red", hover_color="maroon")
    buttonQuit.grid(row=3, column=0, pady=20, padx=20, sticky="se")

    # call function to check if game is running
    gameStatus()

    # change state on startup
    state = appState()
    if int(state) == 1:
         enableButton()
    else:
         disableButton()

    def iterate_check_pregame():
        global client

        app.after(pregame_iteration_timeout, iterate_check_pregame)
        print("Checking for game status")

        if not gameStatus:
             if client: client = None
             return print("Game is not running")

        if not client:
             print("Creating client")
             client = isGameRunning.create_client()
        
        if isGameRunning.check_in_pregame(client):
             print("Pregame detected")
             tell_server_pregame_is_detected(client)
        else: print("Not in pregame at the moment")
         

    iterate_check_pregame() # keeps running every 30 seconds regardless of interaction

    while True:

        try:
            app.update()           
            
        except KeyboardInterrupt:
             exit(0)



if __name__ == "__main__":
    main()