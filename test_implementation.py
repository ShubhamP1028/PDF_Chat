#!/usr/bin/env python3
"""
Simple test script to verify the PDF Chat implementation
"""

import requests
import json
import os

def test_api_endpoints():
    """Test the API endpoints to ensure they return structured JSON"""
    base_url = "http://localhost:5000"
    
    print("Testing PDF Chat API Implementation...")
    print("=" * 50)
    
    # Test 1: Check if server is running
    try:
        response = requests.get(f"{base_url}/")
        if response.status_code == 200:
            print("✅ Server is running")
        else:
            print("❌ Server is not responding correctly")
            return
    except requests.exceptions.ConnectionError:
        print("❌ Server is not running. Please start the Flask app first.")
        return
    
    # Test 2: Test chat endpoint without PDF uploaded
    try:
        response = requests.post(f"{base_url}/chat", 
                               json={"message": "Hello"},
                               headers={"Content-Type": "application/json"})
        
        if response.status_code == 400:
            data = response.json()
            if "error" in data and "upload a PDF first" in data["error"]:
                print("✅ Chat endpoint correctly requires PDF upload first")
            else:
                print("❌ Unexpected error response:", data)
        else:
            print("❌ Expected 400 status code, got:", response.status_code)
    except Exception as e:
        print(f"❌ Error testing chat endpoint: {e}")
    
    print("\n" + "=" * 50)
    print("API structure test completed!")
    print("\nTo test with a real PDF:")
    print("1. Start the Flask app: python app.py")
    print("2. Open http://localhost:5000 in your browser")
    print("3. Upload a PDF and ask questions")
    print("4. Check that responses include:")
    print("   - answer: The AI response")
    print("   - sources: Array with page numbers and snippets")
    print("   - confidence: Confidence score (0-1)")
    print("   - metadata: Additional information")

if __name__ == "__main__":
    test_api_endpoints()
