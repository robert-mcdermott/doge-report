# DOGE Report Dashboard
[![Update Doge Data](https://github.com/robert-mcdermott/doge-report/actions/workflows/update-doge-data.yml/badge.svg)](https://github.com/robert-mcdermott/doge-report/actions/workflows/update-doge-data.yml)

A simple web application for exploring and analyzing data from the Department of Government Efficiency (DOGE) API.

**Access the application here:** [https://robert-mcdermott.github.io/doge-report/](https://robert-mcdermott.github.io/doge-report/)

![Doge Report Dashboard Screenshot](https://github.com/robert-mcdermott/doge-report/blob/main/data/doge-report-dashboard-screenshot.png)
## Overview

The DOGE Report Dashboard provides a user-friendly interface to explore and analyze canceled grants, contracts, and leases data from the Department of Government Efficiency. The dashboard features interactive tables, visualizations, and filtering capabilities to help you explore and search the data.

### Key Features

- **Modern, Responsive Design**: Works on desktop and mobile devices
- **Interactive Data Tables**: Sort, filter, and search through all datasets
- **Data Visualizations**: Charts showing top recipients, agencies, vendors, and locations
- **Lazy Loading**: Datasets are only loaded when selected to ensure fast initial page load
- **Dark Mode**: Synthwave 84-inspired Dark Mode theme for reduced eye strain
- **Expandable Descriptions**: View full details with show/hide functionality
- **Links to External Resources**: If additional information is available on a grant or contract a link is provided.  

### Datasets

The dashboard works with three datasets from the DOGE API:

- **Grants** - Canceled grants with recipient and savings information
- **Contracts** - Canceled contracts with vendor details
- **Leases** - Canceled leases with location and square footage information

*Note: The payments dataset is currently unavailable from the DOGE API (server errors when attempting to access it)*

## Using the Dashboard

### Getting Started

1. Open the dashboard in a web browser: [https://robert-mcdermott.github.io/doge-report/](https://robert-mcdermott.github.io/doge-report/)
2. Navigate between the Overview, Grants, Contracts, and Leases sections using the navigation bar
3. Click "Load Data" buttons to load the respective datasets
4. Use the search functionality to find specific items
5. View charts and tables to analyze the data

### Features

- **Overview Section**: Provides summary statistics across all loaded datasets
- **Dataset-Specific Views**: Detailed information for grants, contracts, and leases
- **Interactive Tables**: Sort by clicking column headers, search using the search box
- **Data Visualizations**: Charts showing top recipients, agencies, vendors, and locations
- **Dark Mode**: Toggle between light and dark themes using the switch in the upper right corner

## Technical Details

### Built With

- HTML5, CSS3, and JavaScript
- Bootstrap 5 for responsive layout and styling
- Chart.js for data visualizations
- DataTables for interactive tables
- No server-side dependencies - works entirely in the browser

### Project Structure

- `index.html` - Main HTML file for the dashboard
- `css/` - Stylesheets for the application
- `js/` - JavaScript files for application logic
- `data/` - JSON and CSV datasets

## Data Download Utility

The dashboard uses data downloaded from the DOGE API. To update the datasets, use the included data download utility.

### Requirements

- Python 3.12 or higher

### Usage

```bash
# Navigate to the data directory
cd data

# Retrieve grant savings data
python doge-data-download.py grants

# Retrieve contract savings data
python doge-data-download.py contracts

# Retrieve lease savings data  
python doge-data-download.py leases

# Specify a custom output filename
python doge-data-download.py grants --output my_grants_data.json

# Export data in CSV format
python doge-data-download.py grants --format csv

# Using with an API key (if required)
python doge-data-download.py grants --api-key YOUR_API_KEY

# Customize connection settings
python doge-data-download.py grants --timeout 60 --retries 5
```

### Options

- `--output`, `-o`: Specify custom output filename
- `--format`, `-f`: Specify output format (`json` or `csv`, default is `json`)
- `--api-key`, `-k`: Provide an API key for authentication (if required)
- `--timeout`, `-t`: Set connection timeout in seconds (default: 30)
- `--retries`, `-r`: Maximum number of retry attempts for failed requests (default: 3)
- `--proxy`, `-p`: Proxy URL for connections (also reads HTTP_PROXY/HTTPS_PROXY environment variables)

### Data Formats

The utility supports both JSON and CSV formats:

- **JSON (Default)**: Preserves all data types and nested structures
- **CSV**: Suitable for importing into spreadsheet applications or data analysis tools

### Error Handling

The utility includes robust error handling with automatic retries, rate limit handling, and clear error messages.

## Contributing

Contributions to improve the DOGE Report Dashboard are welcome. Here are some ways you can contribute:

1. **Report bugs** by opening an issue
2. **Suggest new features** or improvements
3. **Submit pull requests** with bug fixes or new features

## License

This project is licensed under the Apache 2.0 License - see the LICENSE file for details.

## Acknowledgments

- Department of Government Efficiency (DOGE) for providing the API
- The Synthwave 84 theme for inspiration on the dark mode design
