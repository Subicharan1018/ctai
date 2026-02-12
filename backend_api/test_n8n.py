import requests
import json

webhook_url = "https://confidently-esterifiable-mira.ngrok-free.dev/webhook-test/0fbf86c9-bdd9-4b20-8414-14e63ae14b8c"

print(f"Testing Webhook: {webhook_url}")

try:
    # Try GET
    # print("\nAttempting GET request...")
    # response = requests.get(webhook_url)
    # print(f"Status Code: {response.status_code}")
    # try:
    #     print(f"Response: {response.json()}")
    # except:
    #     print(f"Response (text): {response.text}")

    # Try POST if GET fails or just to check
    print("\nAttempting POST request with dummy data...")
    response = requests.post(webhook_url, json={"query": "cement"})
    print(f"Status Code: {response.status_code}")
    try:
        print(f"Response: {response.json()}")
    except:
        print(f"Response (text): {response.text}")

except Exception as e:
    print(f"Error: {e}")
