import requests
import json
import sys

def test_analyze(statement: str):
    print(f"Testing Detective Zone API with statement:\n\"{statement}\"\n")
    url = "http://127.0.0.1:8000/api/module2/analyze"
    payload = {"statement": statement}
    
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        
        data = response.json()
        print("====== API RESPONSE ======")
        print(json.dumps(data, indent=2, ensure_ascii=False))
        print("==========================")
        
    except requests.exceptions.RequestException as e:
        print(f"API Request Failed: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Error Details: {e.response.text}")

if __name__ == "__main__":
    test_statement = "The politicians who support this law are all corrupt thieves who hate freedom."
    if len(sys.argv) > 1:
        test_statement = " ".join(sys.argv[1:])
        
    test_analyze(test_statement)
