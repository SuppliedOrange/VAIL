import psutil
import os
import logging
from valclient.client import Client
from datetime import datetime, timedelta


# Configure PIL logger to be less verbose
pil_logger = logging.getLogger('PIL')
pil_logger.setLevel(logging.INFO)  # Only show INFO and above from PIL

# Get the AppData directory path
appdataPath = os.getenv('APPDATA')
vailDir = os.path.join(appdataPath, "VAIL")
debugLogPath = os.path.join(vailDir, "VAIL_debug.log")
errorLogPath = os.path.join(vailDir, "VAIL_error.log")

# Create the directory if it doesn't exist
if not os.path.exists(vailDir):
    os.makedirs(vailDir)

def clear_old_logs(file_path, max_age_days=7):
    """Clear log file if older than max_age_days"""
    if not os.path.exists(file_path):
        return
        
    file_time = os.path.getmtime(file_path)
    file_age = datetime.now() - datetime.fromtimestamp(file_time)
    
    if file_age > timedelta(days=max_age_days):
        logging.debug(f"Clearing old log file: {file_path}")
        open(file_path, 'w').close()

# Clear old logs before configuring handlers
clear_old_logs(debugLogPath)
clear_old_logs(errorLogPath)

# Configure logging with two handlers
# Debug handler (includes all levels)
debug_handler = logging.FileHandler(debugLogPath, mode='a', encoding='utf-8')
debug_handler.setLevel(logging.DEBUG)
debug_handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))

# Error handler (only ERROR and above)
error_handler = logging.FileHandler(errorLogPath, mode='a', encoding='utf-8')
error_handler.setLevel(logging.ERROR)
error_handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))

# Root logger configuration
logger = logging.getLogger()
logger.setLevel(logging.DEBUG)
logger.addHandler(debug_handler)
logger.addHandler(error_handler)


def isRunning():
    for proc in psutil.process_iter(['name']):
        try:
            if proc.info['name'].lower() == "valorant.exe" or proc.info['name'].lower() == "valorant-win64-shipping.exe":
                logging.debug("valorant is running")
                return True
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            logging.debug("Interesting error has occurred")
            pass
    logging.debug("isRunning: valorant is not running")
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
        logging.debug(f"Region: {region}")
        if not region: raise Exception("Could not determine region")
    except Exception as e:
        logging.error(str(e))
    
    try:
        client = Client(region=region)
        client.activate()
    except Exception as e:
        logging.error("VALORANT isn't running")
        logging.error(str(e))

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
    
def getEndpoint(matchID: str, client: Client):
    try:
        endpoint = f"https://glz-{client.region}-1.{client.shard}.a.pvp.net/pregame/v1/matches/{matchID}"
        return endpoint

    except:
        logging.error("ID not found?")
        logging.debug(f"Endpoint: {endpoint}")
        return None