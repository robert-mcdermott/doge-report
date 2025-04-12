# DOGE Report Utility
![](https://github.com/robert-mcdermott/doge-report/blob/main/data/doge_grants_savings_treemap.png)

A command-line utility to retrieve data from the Department of Government Efficiency (DOGE) API.

## Overview

This utility connects to the DOGE API at https://api.doge.gov/ and retrieves data from the following endpoints:

- `/savings/grants` - Grants that have been cancelled
- `/savings/contracts` - Contracts that have been cancelled  
- `/savings/leases` - Leases that have been cancelled
- `/payments` - Payments made by the US Government

The utility handles pagination automatically and saves the complete dataset to a file in the specified format (JSON or CSV).

## Requirements

- Python 3.12 or higher

## Usage

```bash
# Retrieve grant savings data
python doge-report.py grants

# Retrieve contract savings data
python doge-report.py contracts

# Retrieve lease savings data  
python doge-report.py leases

# Retrieve payment data
python doge-report.py payments

# Specify a custom output filename
python doge-report.py grants --output my_grants_data.json

# Export data in CSV format
python doge-report.py grants --format csv

# Export data in CSV format with custom filename
python doge-report.py grants --format csv --output my_grants_data.csv

# Using with an API key (if required)
python doge-report.py grants --api-key YOUR_API_KEY

# Customize connection settings
python doge-report.py grants --timeout 60 --retries 5

# Using with a proxy server
python doge-report.py grants --proxy http://proxy.example.com:8080
```

## Options

- `--output`, `-o`: Specify custom output filename
- `--format`, `-f`: Specify output format (`json` or `csv`, default is `json`)
- `--api-key`, `-k`: Provide an API key for authentication (if required)
- `--timeout`, `-t`: Set connection timeout in seconds (default: 30)
- `--retries`, `-r`: Maximum number of retry attempts for failed requests (default: 3)
- `--proxy`, `-p`: Proxy URL for connections (also reads HTTP_PROXY/HTTPS_PROXY environment variables)

## Authentication

The DOGE API may require authentication via an API key. If you encounter a 403 Forbidden error, you may need to:

1. Obtain an API key from the DOGE API service
2. Pass the API key using the `--api-key` parameter

## Proxy Support

For users behind corporate firewalls, the utility supports proxy servers:

- Automatically uses HTTP_PROXY/HTTPS_PROXY environment variables if set
- Alternatively, specify a proxy with the `--proxy` option

## Output Formats

The utility supports the following output formats:

### JSON (Default)
Data is saved in JSON format with proper indentation, preserving all data types and nested structures.

### CSV
Data is exported to a CSV file with headers. Nested objects or arrays are converted to JSON strings in the CSV. This format is suitable for importing into spreadsheet applications or data analysis tools.

## Output

By default, the data is saved to a file named `doge_<endpoint>_data.json` or `doge_<endpoint>_data.csv` depending on the selected format.

You can specify a custom output file using the `--output` option. Make sure to use an appropriate file extension for the selected format.

## Error Handling

The utility includes robust error handling:

- Automatically retries on connection failures
- Respects API rate limits using the Retry-After header if available
- Uses exponential backoff for retry attempts
- Handles server errors (500+) with automatic retries
- Provides clear error messages for authentication issues

## Notes

- The utility will automatically handle the API's rate limiting by pausing and retrying when necessary.
- The maximum number of records retrieved per page is set to 500 (the maximum allowed by the API).
- All data is retrieved and saved in the specified format, maintaining the original structure provided by the API.
- If you encounter 403 Forbidden errors, you may need to obtain an API key from the service provider.
