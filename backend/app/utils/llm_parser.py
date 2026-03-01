import re

def strip_think_tags(text: str) -> str:
    """
    Parses and reliably strips <think>...</think> blocks from DeepSeek R1 responses.
    DeepSeek reasoning models generate intermediate thinking within these tags.
    """
    if not text:
        return ""
    
    # Use regex to remove <think> tags and all their contents
    # re.DOTALL is critical here to ensure the dot matches newline characters
    cleaned_text = re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL)
    
    # Clean up any residual leading/trailing whitespace
    return cleaned_text.strip()
