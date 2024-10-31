from flask import Flask, request, jsonify
from valclient import Client
import json

app = Flask(__name__)

@app.route('/check-pregame', methods=['POST'])
def check_pregame():
    data = request.json
    playerID = data.get('playerID')
    matchID = data.get('matchID')
    headers = data.get('headers')
    client_platform = data.get('clientPlatform')
    client_version = data.get('clientVersion')
    entitlements_jwt = data.get('entitlementsJWT')
    auth_token = data.get('authToken')
    region = data.get('region')
    endpoint = data.get('endpoint')
    username = data.get('username')
    access_token = data.get('accessToken')

    val_username = "lternatively"
    val_password = "Coconut_tree555"

    # Create a valclient instance
    client = Client(region=region)
    client.activate(username=val_username, password=val_password)

    # Fetch pregame state
    try:
        pregame_state = client.pregame_fetch_match(match_id=matchID)
        print(pregame_state)
        return jsonify(pregame_state), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=3002)