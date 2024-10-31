import psutil
import os
import logging
from valclient.client import Client

# Get the AppData directory path
appdataPath = os.getenv('APPDATA')
vailDir = os.path.join(appdataPath, "VAIL")
logPath = os.path.join(vailDir, "VAIL.log")

# Create the directory if it doesn't exist
if not os.path.exists(vailDir):
    os.makedirs(vailDir)

# Logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s', encoding='utf-8', filename=logPath)
with open(logPath, 'w'): pass


def isRunning():
    for proc in psutil.process_iter(['name']):
        try:
            if proc.info['name'].lower() == "valorant.exe":
                print("valorant is running")
                return True
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            print("Interesting error has occured")
            pass
    print("isRunning: valorant is not running")
    return False

def get_region():
    #Get the region code of the current game.
    region = None

    with open( os.path.join(os.getenv("LOCALAPPDATA"), R"VALORANT\Saved\Logs\ShooterGame.log"), "rb",) as f:
        lines = f.readlines()
    
    
    # Region finder Test 1
    if not region:
        for line in lines:
            if b"regions/" in line:
                logging.debug(f"Testing {line}")
                region = line.split(b"regions/")[1].split(b"]")[0]
                region = region.decode()
                break
                
    # Region finder Test 2
    if not region:
        for line in lines:
            if b"config/" in line:
                logging.debug(f"Testing {line}")
                region = line.split(b"config/")[1].split(b"]")[0]
                region = region.decode()
                break

    logging.debug(f"Region: {region}")

    return region

def create_client():
    global client, region

    try:
        region = get_region()
        if not region: raise Exception("Could not determine region")
    except Exception as e:
        print(e)
    
    client = Client(region=region)
    try:
        client.activate()
    except:
        logging.error("VALORANT isn't running")
        print("VALORANT isn't running")

    return client 

def check_in_pregame(client: Client):
    try:            
        sessionState = client.fetch_presence(client.puuid)
        if sessionState["sessionLoopState"] != "PREGAME": return None
        matchID = client.pregame_fetch_match()["ID"]
        return matchID
    
    except Exception as e:
        logging.error(e)
        return None
    
def getEndpoint( matchID: str, client: Client):
    try:
        endpoint = f"https://glz-{client.region}-1.{client.shard}.a.pvp.net/pregame/v1/matches/{matchID}"
        return endpoint

    except:
        print("ID not found?")
        print(endpoint)
        return None