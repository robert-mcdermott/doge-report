#!/usr/bin/env python3
"""
DOGE API data retrieval utility

This script retrieves data from the DOGE API endpoints:
- /savings/grants
- /savings/contracts 
- /savings/leases
- /payments

Data is paginated through completely and saved to a file in the specified format.

Supported formats:
- JSON (default): Full data with nested structures preserved
- CSV: Tabular format suitable for spreadsheets with nested data serialized

Examples:
    python doge-report.py grants
    python doge-report.py contracts --format csv
    python doge-report.py leases --format json --output lease_data.json
    python doge-report.py payments --format csv --output payment_data.csv
"""

import argparse
import csv
import json
import os
import sys
import time
import urllib.request
import urllib.error
from urllib.parse import urlencode
from typing import Dict, List, Any, Optional
import os.path


BASE_URL = "https://api.doge.gov"
ENDPOINTS = {
    "grants": "/savings/grants",
    "contracts": "/savings/contracts",
    "leases": "/savings/leases", 
    "payments": "/payments",
    "statistics": "/payments/statistics",
}
PER_PAGE = 500  # Maximum allowed per API spec
API_KEY = None  # Will be set from command line args
MAX_RETRIES = 3  # Maximum number of retries for failed requests
TIMEOUT = 30    # Connection timeout in seconds
PROXY_URL = None  # Will be set from command line args or environment
FORMAT = "json"  # Output format, will be set from command line args


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
        if endpoint == '/payments/statistics':
            for dimension in [
                'agency',
                'request_date',
                'org_names',
            ]:
                items = response.get('result', {}).get(dimension, [])
                all_data = items # for consistency's sake
                save_data(all_data, f"{result_key}_{dimension}", FORMAT)
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


def save_data(data: List[Dict[str, Any]], endpoint_type: str, output_format: str = None, output_file: str = None) -> None:
    """Save the retrieved data to a file in the specified format."""
    # Use the provided format or the global format
    fmt = output_format or FORMAT
    
    # Generate default filename if not provided
    if not output_file:
        extension = "json" if fmt.lower() == "json" else "csv"
        output_file = f"doge_{endpoint_type}_data.{extension}"
    
    print(f"Saving data to: {output_file}")
    
    if fmt.lower() == "json":
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
    elif fmt.lower() == "csv":
        if not data:
            print("No data to save")
            return
            
        # Get fieldnames from the first record
        fieldnames = list(data[0].keys())
        
        try:
            with open(output_file, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                
                # Handle nested data and None values
                for row in data:
                    # Convert any nested dict/list to JSON string and None to empty string
                    row_copy = {}
                    for key, value in row.items():
                        if isinstance(value, (dict, list)):
                            row_copy[key] = json.dumps(value)
                        elif value is None:
                            row_copy[key] = ""
                        elif isinstance(value, str):
                            # Clean problematic characters for CSV
                            row_copy[key] = value.replace('\u200b', '').replace('\r', ' ').replace('\n', ' ')
                        else:
                            row_copy[key] = value
                    writer.writerow(row_copy)
        except UnicodeEncodeError as e:
            print(f"Error encoding Unicode characters: {e}")
            print("Trying to save with fallback encoding and character replacement...")
            
            # Fallback approach with explicit character replacement
            with open(output_file, 'w', newline='', encoding='utf-8', errors='replace') as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                
                for row in data:
                    row_copy = {}
                    for key, value in row.items():
                        if isinstance(value, (dict, list)):
                            cleaned_value = json.dumps(value)
                        elif value is None:
                            cleaned_value = ""
                        elif isinstance(value, str):
                            # More aggressive character cleaning
                            cleaned_value = ''.join(c if c.isprintable() or c in (' ', '\t') else ' ' for c in value)
                        else:
                            cleaned_value = value
                        row_copy[key] = cleaned_value
                    writer.writerow(row_copy)
    else:
        print(f"Unsupported format: {fmt}")
        sys.exit(1)
        
    print(f"Data saved to {output_file}")


def main() -> None:
    """Main function to parse arguments and execute the data retrieval."""
    global API_KEY, MAX_RETRIES, TIMEOUT, PROXY_URL, FORMAT
    
    # Check for proxy in environment variables
    env_proxy = os.environ.get('HTTP_PROXY') or os.environ.get('HTTPS_PROXY')
    
    parser = argparse.ArgumentParser(
        description='Retrieve data from DOGE API and save in specified format',
        epilog='Example: python doge-report.py grants --format csv'
    )
    parser.add_argument('endpoint', choices=list(ENDPOINTS.keys()),
                        help='API endpoint to retrieve data from')
    parser.add_argument('--output', '-o', type=str,
                        help='Output file name (default: doge_<endpoint>_data.<format>)')
    parser.add_argument('--api-key', '-k', type=str,
                        help='API key for authentication (if required)')
    parser.add_argument('--retries', '-r', type=int, default=MAX_RETRIES,
                        help=f'Maximum number of retries for failed requests (default: {MAX_RETRIES})')
    parser.add_argument('--timeout', '-t', type=int, default=TIMEOUT,
                        help=f'Connection timeout in seconds (default: {TIMEOUT})')
    parser.add_argument('--proxy', '-p', type=str, default=env_proxy,
                        help='Proxy URL (default: uses HTTP_PROXY/HTTPS_PROXY environment variables if set)')
    parser.add_argument('--format', '-f', type=str, choices=['json', 'csv'], default='json',
                        help='Output format: json or csv (default: json)')
    
    args = parser.parse_args()
    
    # Set parameters from command line args
    API_KEY = args.api_key
    MAX_RETRIES = args.retries
    TIMEOUT = args.timeout
    PROXY_URL = args.proxy
    FORMAT = args.format
    
    endpoint_path = ENDPOINTS[args.endpoint]
    data = get_all_data(endpoint_path)
    
    # The '/payments/statistics' path is its own beast; contains three reports,
    # 'agency', 'org_names' and 'request_date', that get handled above in 
    # get_all_data() so we skip it here.
    if endpoint_path != '/payments/statistics':
        # Save data in the requested format
        save_data(data, args.endpoint, args.format, args.output)


if __name__ == "__main__":
    main()
