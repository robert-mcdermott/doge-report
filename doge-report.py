#!/usr/bin/env python3
"""
DOGE API data retrieval utility

This script retrieves data from the DOGE API endpoints:
- /savings/grants
- /savings/contracts 
- /savings/leases
- /payments

Data is paginated through completely and saved to a JSON file.
"""

import argparse
import json
import os
import sys
import time
import urllib.request
import urllib.error
from urllib.parse import urlencode
from typing import Dict, List, Any, Optional


BASE_URL = "https://api.doge.gov"
ENDPOINTS = {
    "grants": "/savings/grants",
    "contracts": "/savings/contracts",
    "leases": "/savings/leases", 
    "payments": "/payments"
}
PER_PAGE = 500  # Maximum allowed per API spec
API_KEY = None  # Will be set from command line args
MAX_RETRIES = 3  # Maximum number of retries for failed requests
TIMEOUT = 30    # Connection timeout in seconds
PROXY_URL = None  # Will be set from command line args or environment


def make_request(url: str, retry_count: int = 0) -> Dict[str, Any]:
    """Make an HTTP GET request to the specified URL and return JSON response."""
    try:
        # Create a request with headers to prevent 403 Forbidden errors
        headers = {
            'User-Agent': 'DOGE-Report-Utility/0.1.0',
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
        
        # Add API key to headers if provided
        if API_KEY:
            headers['Authorization'] = f'Bearer {API_KEY}'
            
        req = urllib.request.Request(url, headers=headers)
        
        # Set up proxy handler if provided
        if PROXY_URL:
            proxy_handler = urllib.request.ProxyHandler({
                'http': PROXY_URL,
                'https': PROXY_URL
            })
            opener = urllib.request.build_opener(proxy_handler)
            urllib.request.install_opener(opener)
            print(f"Using proxy: {PROXY_URL}")
        
        with urllib.request.urlopen(req, timeout=TIMEOUT) as response:
            return json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print(f"HTTP Error: {e.code} - {e.reason}")
        if e.code == 429:
            # Rate limit exceeded - wait and retry
            wait_time = 5
            if 'Retry-After' in e.headers:
                try:
                    wait_time = int(e.headers['Retry-After'])
                except ValueError:
                    pass
            print(f"Rate limit exceeded. Waiting for {wait_time} seconds before retrying...")
            time.sleep(wait_time)
            return make_request(url)  # Retry the request
        elif e.code == 403:
            err_body = e.read().decode('utf-8')
            print(f"Response body: {err_body}")
            print("Access forbidden. The API may require an API key or other authentication.")
            print("Try using the --api-key option if you have an API key.")
            sys.exit(1)
        else:
            print(f"Response body: {e.read().decode('utf-8')}")
            # Retry for certain error codes if we haven't exceeded max retries
            if retry_count < MAX_RETRIES and e.code >= 500:
                retry_count += 1
                wait_time = 2 ** retry_count  # Exponential backoff
                print(f"Server error. Retrying in {wait_time} seconds... (Attempt {retry_count}/{MAX_RETRIES})")
                time.sleep(wait_time)
                return make_request(url, retry_count)
            sys.exit(1)
    except urllib.error.URLError as e:
        print(f"URL Error: {e.reason}")
        # Retry connection errors
        if retry_count < MAX_RETRIES:
            retry_count += 1
            wait_time = 2 ** retry_count  # Exponential backoff
            print(f"Connection error. Retrying in {wait_time} seconds... (Attempt {retry_count}/{MAX_RETRIES})")
            time.sleep(wait_time)
            return make_request(url, retry_count)
        sys.exit(1)
    except json.JSONDecodeError:
        print("Error decoding JSON response")
        sys.exit(1)
    except TimeoutError:
        print(f"Connection timed out after {TIMEOUT} seconds")
        if retry_count < MAX_RETRIES:
            retry_count += 1
            wait_time = 2 ** retry_count  # Exponential backoff
            print(f"Retrying in {wait_time} seconds... (Attempt {retry_count}/{MAX_RETRIES})")
            time.sleep(wait_time)
            return make_request(url, retry_count)
        sys.exit(1)


def get_all_data(endpoint: str) -> List[Dict[str, Any]]:
    """Retrieve all data from a specific endpoint by paginating through all results."""
    page = 1
    all_data = []
    result_key = endpoint.split('/')[-1]  # Extract the name of the data field from endpoint
    
    print(f"Retrieving data from {endpoint}...")
    
    while True:
        # Build query parameters
        params = {
            'page': page,
            'per_page': PER_PAGE
        }
        query_string = urlencode(params)
        url = f"{BASE_URL}{endpoint}?{query_string}"
        
        # Make the request
        print(f"Fetching page {page}...")
        response = make_request(url)
        
        if not response.get('success', False):
            print(f"API Error: {response.get('message', 'Unknown error')}")
            sys.exit(1)
            
        # Extract data based on the endpoint
        if endpoint == '/payments':
            items = response.get('result', {}).get('payments', [])
        else:
            items = response.get('result', {}).get(result_key, [])
            
        if not items:
            break
            
        all_data.extend(items)
        total_pages = response.get('meta', {}).get('pages', 0)
        
        print(f"Retrieved {len(items)} items (page {page}/{total_pages})")
        
        if page >= total_pages:
            break
            
        page += 1
        
    print(f"Retrieved {len(all_data)} total items from {endpoint}")
    return all_data


def save_data(data: List[Dict[str, Any]], endpoint_type: str) -> None:
    """Save the retrieved data to a JSON file."""
    filename = f"doge_{endpoint_type}_data.json"
    with open(filename, 'w') as f:
        json.dump(data, f, indent=2)
    print(f"Data saved to {filename}")


def main() -> None:
    """Main function to parse arguments and execute the data retrieval."""
    global API_KEY, MAX_RETRIES, TIMEOUT, PROXY_URL
    
    # Check for proxy in environment variables
    env_proxy = os.environ.get('HTTP_PROXY') or os.environ.get('HTTPS_PROXY')
    
    parser = argparse.ArgumentParser(description='Retrieve data from DOGE API')
    parser.add_argument('endpoint', choices=list(ENDPOINTS.keys()),
                        help='API endpoint to retrieve data from')
    parser.add_argument('--output', '-o', type=str,
                        help='Output file name (default: doge_<endpoint>_data.json)')
    parser.add_argument('--api-key', '-k', type=str,
                        help='API key for authentication (if required)')
    parser.add_argument('--retries', '-r', type=int, default=MAX_RETRIES,
                        help=f'Maximum number of retries for failed requests (default: {MAX_RETRIES})')
    parser.add_argument('--timeout', '-t', type=int, default=TIMEOUT,
                        help=f'Connection timeout in seconds (default: {TIMEOUT})')
    parser.add_argument('--proxy', '-p', type=str, default=env_proxy,
                        help='Proxy URL (default: uses HTTP_PROXY/HTTPS_PROXY environment variables if set)')
    
    args = parser.parse_args()
    
    # Set parameters from command line args
    API_KEY = args.api_key
    MAX_RETRIES = args.retries
    TIMEOUT = args.timeout
    PROXY_URL = args.proxy
    
    endpoint_path = ENDPOINTS[args.endpoint]
    data = get_all_data(endpoint_path)
    
    if args.output:
        filename = args.output
        with open(filename, 'w') as f:
            json.dump(data, f, indent=2)
        print(f"Data saved to {filename}")
    else:
        save_data(data, args.endpoint)


if __name__ == "__main__":
    main()
