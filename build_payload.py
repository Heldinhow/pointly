#!/usr/bin/env python3
"""Build compose.update payload for pointly.
Reads docker-compose.yml content from stdin (piped) or hardcoded fallback."""
import json
import os
import sys

compose_id = os.environ["POINTLY_COMPOSE_ID"]
app_name = os.environ["POINTLY_APP_NAME"]

# Read compose content from stdin if provided, else use built-in
if not sys.stdin.isatty():
    compose_file = sys.stdin.read()
else:
    sys.exit("ERROR: feed docker-compose.yml via stdin")

payload = {
    "json": {
        "composeId": compose_id,
        "name": "pointly",
        "appName": app_name,
        "sourceType": "github",
        "repository": "pointly",
        "owner": "Heldinhow",
        "branch": "main",
        "githubId": "BfQ2-9mdd_2GQztjgD1Sf",
        "composeType": "docker-compose",
        "composePath": "./docker-compose.yml",
        "composeFile": compose_file,
        "env": "NODE_ENV=production\n",
        "autoDeploy": True,
        "triggerType": "push",
    }
}

with open("/tmp/p3.json", "w") as f:
    json.dump(payload, f)

print(f"wrote {os.path.getsize('/tmp/p3.json')} bytes")