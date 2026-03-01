import requests
from PyPDF2 import PdfReader
import sys

def extract_text_from_pdf(pdf_path):
    print(f"Reading {pdf_path}...")
    reader = PdfReader(pdf_path)
    text = ""
    for page in reader.pages:
        text += page.extract_text() + "\n"
    return text

def inject_to_chroma(text, filename):
    print("Sending text to Civic Gym backend...")
    url = "http://127.0.0.1:8000/api/module2/ingest"
    
    # We chunk the text slightly if it's too large, but for a simple prototype 
    # we can send it all at once if it's small enough.
    payload = {
        "text": text,
        "metadata": {"source": filename, "type": "pdf"}
    }
    
    response = requests.post(url, json=payload)
    if response.status_code == 200:
        print(f"Success! Document ID: {response.json()['doc_id']}")
    else:
        print(f"Failed to inject: {response.text}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python inject_pdf.py path/to/your/document.pdf")
        sys.exit(1)
        
    pdf_file = sys.argv[1]
    extracted_text = extract_text_from_pdf(pdf_file)
    
    # Make sure your FastAPI server is running before executing this!
    inject_to_chroma(extracted_text, pdf_file)
