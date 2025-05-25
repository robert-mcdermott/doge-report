// DOGE Report Dashboard - Main Application JavaScript

// Global variables to store datasets
let grantsData = null;
let contractsData = null;
let leasesData = null;
let paymentsData = null;

// DataTable instances
let grantsTable = null;
let contractsTable = null;
let leasesTable = null;
let paymentsTable = null;

// Chart instances
let grantsRecipientsChart = null;
let grantsAgenciesChart = null;
let contractsVendorsChart = null;
let contractsAgenciesChart = null;
let leasesLocationsChart = null;
let leasesAgenciesChart = null;
let paymentsOrganizationsChart = null;
let paymentsAgenciesChart = null;

// Utility functions
const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
};

const formatNumber = (value) => {
    return new Intl.NumberFormat('en-US').format(value);
};

const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

const getTop10Items = (data, key) => {
    const counts = {};
    data.forEach(item => {
        const value = item[key];
        counts[value] = (counts[value] || 0) + 1;
    });
    
    return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, count]) => ({ name, count }));
};

const getTopValueItems = (data, keyName, keyValue, limit = 10) => {
    try {
        const aggregated = {};
        
        if (!data || !Array.isArray(data)) {
            console.warn('Invalid data passed to getTopValueItems');
            return [];
        }
        
        data.forEach(item => {
            if (!item) return;
            
            const name = item[keyName] || 'Unknown';
            const value = parseFloat(item[keyValue]) || 0;
            
            if (!aggregated[name]) {
                aggregated[name] = 0;
            }
            
            aggregated[name] += value;
        });
        
        return Object.entries(aggregated)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([name, value]) => ({ name, value }));
    } catch (error) {
        console.error('Error in getTopValueItems:', error);
        return [];
    }
};

const createBarChart = (ctx, data, label, backgroundColor) => {
    if (ctx === null) return null;
    
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(item => item.name),
            datasets: [{
                label: label,
                data: data.map(item => item.value || item.count),
                backgroundColor: backgroundColor,
                borderColor: 'rgba(0, 0, 0, 0.1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            if (label.includes('Value') || label.includes('Savings')) {
                                return formatCurrency(value);
                            }
                            return formatNumber(value);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            if (label.includes('Value') || label.includes('Savings')) {
                                return formatCurrency(value);
                            }
                            return formatNumber(value);
                        }
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        }
    });
};

// Navigation functions
const showSection = (sectionId) => {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    document.getElementById(sectionId).classList.add('active');
    document.getElementById(sectionId.replace('-section', '-link')).classList.add('active');
};

// Load and process data functions
const loadGrantsData = async () => {
    if (grantsData !== null) {
        // Data already loaded
        document.getElementById('grants-loading').classList.add('d-none');
        document.getElementById('grants-content').classList.remove('d-none');
        return;
    }
    
    try {
        document.getElementById('grants-loading').classList.remove('d-none');
        document.getElementById('grants-content').classList.add('d-none');
        
        const response = await fetch('data/doge_grants_data.json');
        grantsData = await response.json();
        
        // Update summary stats
        document.getElementById('grants-count').textContent = formatNumber(grantsData.length);
        
        const totalValue = grantsData.reduce((sum, grant) => sum + grant.value, 0);
        document.getElementById('grants-value').textContent = formatCurrency(totalValue);
        
        const totalSavings = grantsData.reduce((sum, grant) => sum + grant.savings, 0);
        document.getElementById('grants-savings').textContent = formatCurrency(totalSavings);
        
        // Create charts
        const topRecipients = getTopValueItems(grantsData, 'recipient', 'value');
        const recipientsCtx = document.getElementById('grants-recipients-chart').getContext('2d');
        grantsRecipientsChart = createBarChart(recipientsCtx, topRecipients, 'Value by Recipient', 'rgba(13, 110, 253, 0.7)');
        
        const topAgencies = getTopValueItems(grantsData, 'agency', 'value');
        const agenciesCtx = document.getElementById('grants-agencies-chart').getContext('2d');
        grantsAgenciesChart = createBarChart(agenciesCtx, topAgencies, 'Value by Agency', 'rgba(13, 110, 253, 0.7)');
        
        // Initialize DataTable
        if (grantsTable) {
            grantsTable.destroy();
        }
        
        grantsTable = $('#grants-table').DataTable({
            data: grantsData,
            autoWidth: true,
            scrollX: true,
            columns: [
                { data: 'date' },
                { data: 'agency' },
                { data: 'recipient' },
                { 
                    data: 'value',
                    render: (data) => formatCurrency(data)
                },
                { 
                    data: 'savings',
                    render: (data) => formatCurrency(data)
                },
                { 
                    data: 'link',
                    render: (data) => data ? `<a href="${data}" target="_blank" class="btn btn-sm btn-outline-primary">View</a>` : ''
                },
                { 
                    data: 'description',
                    render: (data) => `<div class="truncate-text" title="${data}">${truncateText(data, 100)}</div>`
                }
            ],
            order: [[3, 'desc']],
            pageLength: 10,
            responsive: true,
            language: {
                search: "Search grants:"
            },
            initComplete: function() {
                // Initialize Bootstrap tooltips after table is loaded
                $('[title]').tooltip({
                    placement: 'top',
                    html: true
                });
            }
        });
        
        // Update overview stats if other datasets are loaded
        updateOverviewStats();
        
        document.getElementById('grants-loading').classList.add('d-none');
        document.getElementById('grants-content').classList.remove('d-none');
        
        // Fix column alignment issues by adjusting columns after the table becomes visible
        setTimeout(() => {
            if (grantsTable) {
                grantsTable.columns.adjust().draw();
            }
        }, 10);
    } catch (error) {
        console.error('Error loading grants data:', error);
        document.getElementById('grants-loading').classList.add('d-none');
        alert('Failed to load grants data. Please try again later.');
    }
};

const loadContractsData = async () => {
    if (contractsData !== null) {
        // Data already loaded
        document.getElementById('contracts-loading').classList.add('d-none');
        document.getElementById('contracts-content').classList.remove('d-none');
        return;
    }
    
    try {
        document.getElementById('contracts-loading').classList.remove('d-none');
        document.getElementById('contracts-content').classList.add('d-none');
        
        const response = await fetch('data/doge_contracts_data.json');
        contractsData = await response.json();
        
        // Update summary stats
        document.getElementById('contracts-count').textContent = formatNumber(contractsData.length);
        
        const totalValue = contractsData.reduce((sum, contract) => sum + contract.value, 0);
        document.getElementById('contracts-value').textContent = formatCurrency(totalValue);
        
        const totalSavings = contractsData.reduce((sum, contract) => sum + contract.savings, 0);
        document.getElementById('contracts-savings').textContent = formatCurrency(totalSavings);
        
        // Create charts
        const topVendors = getTopValueItems(contractsData, 'vendor', 'value');
        const vendorsCtx = document.getElementById('contracts-vendors-chart').getContext('2d');
        contractsVendorsChart = createBarChart(vendorsCtx, topVendors, 'Value by Vendor', 'rgba(25, 135, 84, 0.7)');
        
        const topAgencies = getTopValueItems(contractsData, 'agency', 'value');
        const agenciesCtx = document.getElementById('contracts-agencies-chart').getContext('2d');
        contractsAgenciesChart = createBarChart(agenciesCtx, topAgencies, 'Value by Agency', 'rgba(25, 135, 84, 0.7)');
        
        // Initialize DataTable
        if (contractsTable) {
            contractsTable.destroy();
        }
        
        contractsTable = $('#contracts-table').DataTable({
            data: contractsData,
            autoWidth: true,
            scrollX: true,
            columns: [
                { data: 'piid' },
                { data: 'agency' },
                { data: 'vendor' },
                { 
                    data: 'value',
                    render: (data) => formatCurrency(data)
                },
                { 
                    data: 'savings',
                    render: (data) => formatCurrency(data)
                },
                { data: 'deleted_date' },
                { 
                    data: 'description',
                    render: (data) => `<div class="truncate-text" title="${data}">${truncateText(data, 100)}</div>`
                },
                { data: 'fpds_status' },
                { 
                    data: 'fpds_link',
                    render: (data) => data ? `<a href="${data}" target="_blank" class="btn btn-sm btn-outline-success">View</a>` : ''
                }
            ],
            order: [[3, 'desc']],
            pageLength: 10,
            responsive: true,
            language: {
                search: "Search contracts:"
            },
            initComplete: function() {
                // Initialize Bootstrap tooltips after table is loaded
                $('[title]').tooltip({
                    placement: 'top',
                    html: true
                });
            }
        });
        
        // Update overview stats if other datasets are loaded
        updateOverviewStats();
        
        document.getElementById('contracts-loading').classList.add('d-none');
        document.getElementById('contracts-content').classList.remove('d-none');
        
        // Fix column alignment issues by adjusting columns after the table becomes visible
        setTimeout(() => {
            if (contractsTable) {
                contractsTable.columns.adjust().draw();
            }
        }, 10);
    } catch (error) {
        console.error('Error loading contracts data:', error);
        document.getElementById('contracts-loading').classList.add('d-none');
        alert('Failed to load contracts data. Please try again later.');
    }
};

const loadLeasesData = async () => {
    if (leasesData !== null) {
        // Data already loaded
        document.getElementById('leases-loading').classList.add('d-none');
        document.getElementById('leases-content').classList.remove('d-none');
        return;
    }
    
    try {
        document.getElementById('leases-loading').classList.remove('d-none');
        document.getElementById('leases-content').classList.add('d-none');
        
        const response = await fetch('data/doge_leases_data.json');
        leasesData = await response.json();
        
        // Update summary stats
        document.getElementById('leases-count').textContent = formatNumber(leasesData.length);
        
        const totalValue = leasesData.reduce((sum, lease) => sum + lease.value, 0);
        document.getElementById('leases-value').textContent = formatCurrency(totalValue);
        
        const totalSavings = leasesData.reduce((sum, lease) => sum + lease.savings, 0);
        document.getElementById('leases-savings').textContent = formatCurrency(totalSavings);
        
        const totalSqFt = leasesData.reduce((sum, lease) => sum + lease.sq_ft, 0);
        document.getElementById('leases-sqft').textContent = formatNumber(totalSqFt);
        
        // Create charts
        const topLocations = getTopValueItems(leasesData, 'location', 'sq_ft');
        const locationsCtx = document.getElementById('leases-locations-chart').getContext('2d');
        leasesLocationsChart = createBarChart(locationsCtx, topLocations, 'Square Feet by Location', 'rgba(13, 202, 240, 0.7)');
        
        const topAgencies = getTopValueItems(leasesData, 'agency', 'value');
        const agenciesCtx = document.getElementById('leases-agencies-chart').getContext('2d');
        leasesAgenciesChart = createBarChart(agenciesCtx, topAgencies, 'Value by Agency', 'rgba(13, 202, 240, 0.7)');
        
        // Initialize DataTable
        if (leasesTable) {
            leasesTable.destroy();
        }
        
        leasesTable = $('#leases-table').DataTable({
            data: leasesData,
            autoWidth: true,
            scrollX: true,
            columns: [
                { data: 'date' },
                { data: 'agency' },
                { data: 'location' },
                { 
                    data: 'sq_ft',
                    render: (data) => formatNumber(data)
                },
                { 
                    data: 'value',
                    render: (data) => formatCurrency(data)
                },
                { 
                    data: 'savings',
                    render: (data) => formatCurrency(data)
                },
                { 
                    data: 'description',
                    render: (data) => `<div class="truncate-text" title="${data}">${truncateText(data, 100)}</div>`
                }
            ],
            order: [[3, 'desc']],
            pageLength: 10,
            responsive: true,
            language: {
                search: "Search leases:"
            },
            initComplete: function() {
                // Initialize Bootstrap tooltips after table is loaded
                $('[title]').tooltip({
                    placement: 'top',
                    html: true
                });
            }
        });
        
        // Update overview stats if other datasets are loaded
        updateOverviewStats();
        
        document.getElementById('leases-loading').classList.add('d-none');
        document.getElementById('leases-content').classList.remove('d-none');
        
        // Fix column alignment issues by adjusting columns after the table becomes visible
        setTimeout(() => {
            if (leasesTable) {
                leasesTable.columns.adjust().draw();
            }
        }, 10);
    } catch (error) {
        console.error('Error loading leases data:', error);
        document.getElementById('leases-loading').classList.add('d-none');
        alert('Failed to load leases data. Please try again later.');
    }
};

const loadPaymentsData = async () => {
    // Check if data is already loaded
    if (paymentsData !== null) {
        // Data already loaded
        document.getElementById('payments-loading').classList.add('d-none');
        document.getElementById('payments-content').classList.remove('d-none');
        return;
    }
    
    try {
        // Show loading indicator and hide content
        document.getElementById('payments-loading').classList.remove('d-none');
        document.getElementById('payments-content').classList.add('d-none');
        document.getElementById('payments-error').style.display = 'none';
        
        // Fetch payments data
        const response = await fetch('data/doge_payments_data.json');
        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.status);
        }
        
        // Parse JSON data
        const data = await response.json();
        
        // Validate data
        if (!data || !Array.isArray(data)) {
            throw new Error('Invalid data format received');
        }
        
        // Store the data
        paymentsData = data;
        
        // Update summary stats
        document.getElementById('payments-count').textContent = formatNumber(paymentsData.length);
        
        const totalValue = paymentsData.reduce((sum, payment) => sum + (parseFloat(payment.payment_amt) || 0), 0);
        document.getElementById('payments-total-value').textContent = formatCurrency(totalValue);
        
        try {
            // Create charts
            createPaymentsCharts();
        } catch (chartError) {
            console.error('Error creating payment charts:', chartError);
        }
        
        try {
            // Create DataTable
            createPaymentsTable();
        } catch (tableError) {
            console.error('Error creating payment table:', tableError);
        }
        
        try {
            // Update overview stats
            updateOverviewStats();
        } catch (overviewError) {
            console.error('Error updating overview stats:', overviewError);
        }
        
        // Hide loading indicator and show content
        document.getElementById('payments-loading').classList.add('d-none');
        document.getElementById('payments-content').classList.remove('d-none');
        
        // Fix column alignment issues by adjusting columns after the table becomes visible
        setTimeout(() => {
            if (paymentsTable) {
                paymentsTable.columns.adjust().draw();
            }
        }, 10);
    } catch (error) {
        console.error('Error loading payments data:', error);
        document.getElementById('payments-loading').classList.add('d-none');
        document.getElementById('payments-error').style.display = 'block';
        
        // Only show alert for network or data parsing errors
        if (error.message && (error.message.includes('Network') || error.message.includes('Invalid data'))) {
            alert('Failed to load payments data: ' + error.message);
        }
    }
}

// Update payments stats
function updatePaymentsStats() {
    try {
        if (!paymentsData) return;
        
        const totalPayments = paymentsData.length;
        const totalValue = paymentsData.reduce((sum, item) => sum + (parseFloat(item.payment_amt) || 0), 0);
        
        const countElement = document.getElementById('payments-count');
        const valueElement = document.getElementById('payments-total-value');
        
        if (countElement) countElement.textContent = formatNumber(totalPayments);
        if (valueElement) valueElement.textContent = formatCurrency(totalValue);
    } catch (error) {
        console.error('Error in updatePaymentsStats:', error);
    }
}

// Create charts for payments data
function createPaymentsCharts() {
    try {
        if (!paymentsData) return;
        
        // Get top organizations by payment amount
        const topOrganizations = getTopValueItems(paymentsData, 'org_name', 'payment_amt');
        
        // Get top agencies by payment amount
        const topAgencies = getTopValueItems(paymentsData, 'agency_name', 'payment_amt');
        
        // Create organization chart
        const orgChartCtx = document.getElementById('payments-organizations-chart');
        if (!orgChartCtx) {
            console.warn('Element payments-organizations-chart not found');
            return;
        }
        
        if (paymentsOrganizationsChart) {
            paymentsOrganizationsChart.destroy();
        }
        
        paymentsOrganizationsChart = createBarChart(
            orgChartCtx, 
            topOrganizations, 
            'Total Payment Amount', 
            'rgba(255, 193, 7, 0.7)'
        );
        
        // Create agency chart
        const agencyChartCtx = document.getElementById('payments-agencies-chart');
        if (!agencyChartCtx) {
            console.warn('Element payments-agencies-chart not found');
            return;
        }
        
        if (paymentsAgenciesChart) {
            paymentsAgenciesChart.destroy();
        }
        
        paymentsAgenciesChart = createBarChart(
            agencyChartCtx, 
            topAgencies, 
            'Total Payment Amount', 
            'rgba(255, 193, 7, 0.7)'
        );
    } catch (error) {
        console.error('Error in createPaymentsCharts:', error);
    }
}

// Create DataTable for payments
function createPaymentsTable() {
    try {
        if (!paymentsData) return;
        
        // Check if table element exists
        if (!document.getElementById('payments-table')) {
            console.warn('Element payments-table not found');
            return;
        }
        
        // Destroy existing table if it exists
        if (paymentsTable) {
            paymentsTable.destroy();
        }
        
        // Create new DataTable
        paymentsTable = $('#payments-table').DataTable({
        data: paymentsData,
        columns: [
            { 
                data: 'payment_date',
                title: 'Date',
                render: function(data) {
                    return data || 'N/A';
                }
            },
            { 
                data: 'payment_amt',
                title: 'Amount',
                render: function(data) {
                    return formatCurrency(data || 0);
                }
            },
            { 
                data: 'org_name',
                title: 'Organization',
                render: function(data) {
                    return data || 'N/A';
                }
            },
            { 
                data: 'agency_name',
                title: 'Agency',
                render: function(data) {
                    return data || 'N/A';
                }
            },
            { 
                data: 'recipient_justification',
                title: 'Recipient Justification',
                render: function(data, type, row) {
                    if (type === 'display') {
                        if (!data) return 'N/A';
                        
                        // Create expandable description
                        return `
                            <div class="description-cell">
                                <div class="description-preview">${data.length > 100 ? data.substring(0, 100) + '...' : data}</div>
                                ${data.length > 100 ? '<button class="btn btn-sm btn-link show-full-description">Show more</button>' : ''}
                                <div class="full-description" style="display: none;">${data}</div>
                            </div>
                        `;
                    }
                    return data || 'N/A';
                }
            },
            { 
                data: 'agency_lead_justification',
                title: 'Agency Justification',
                render: function(data, type, row) {
                    if (type === 'display') {
                        if (!data) return 'N/A';
                        
                        // Create expandable description
                        return `
                            <div class="description-cell">
                                <div class="description-preview">${data.length > 100 ? data.substring(0, 100) + '...' : data}</div>
                                ${data.length > 100 ? '<button class="btn btn-sm btn-link show-full-description">Show more</button>' : ''}
                                <div class="full-description" style="display: none;">${data}</div>
                            </div>
                        `;
                    }
                    return data || 'N/A';
                }
            }
        ],
        order: [[1, 'desc']], // Sort by payment amount by default
        pageLength: 10,
        lengthMenu: [[10, 25, 50, -1], [10, 25, 50, "All"]],
        responsive: true,
        initComplete: function() {
            // Apply description expander after table is created
            setTimeout(function() {
                enhanceExistingDescriptions && enhanceExistingDescriptions();
            }, 100);
        }
    });
    } catch (error) {
        console.error('Error in createPaymentsTable:', error);
    }
}

// Update overview summary stats
const updateOverviewStats = () => {
    const loadedDatasets = [];
    let totalSavings = 0;
    let totalItems = 0;
    const agencies = new Set();
    
    // Update grants stats in overview
    if (grantsData) {
        loadedDatasets.push('Grants');
        const grantsSavings = grantsData.reduce((sum, item) => sum + item.savings, 0);
        
        document.getElementById('grants-overview-count').textContent = formatNumber(grantsData.length);
        document.getElementById('grants-overview-value').textContent = formatCurrency(grantsData.reduce((sum, item) => sum + item.value, 0));
        document.getElementById('grants-overview-savings').textContent = formatCurrency(grantsSavings);
        document.getElementById('grants-stats-section').style.display = 'block';
        
        totalSavings += grantsSavings;
        totalItems += grantsData.length;
        grantsData.forEach(item => agencies.add(item.agency));
    } else {
        document.getElementById('grants-stats-section').style.display = 'none';
    }
    
    // Update contracts stats in overview
    if (contractsData) {
        loadedDatasets.push('Contracts');
        const contractsSavings = contractsData.reduce((sum, item) => sum + item.savings, 0);
        
        document.getElementById('contracts-overview-count').textContent = formatNumber(contractsData.length);
        document.getElementById('contracts-overview-value').textContent = formatCurrency(contractsData.reduce((sum, item) => sum + item.value, 0));
        document.getElementById('contracts-overview-savings').textContent = formatCurrency(contractsSavings);
        document.getElementById('contracts-stats-section').style.display = 'block';
        
        totalSavings += contractsSavings;
        totalItems += contractsData.length;
        contractsData.forEach(item => agencies.add(item.agency));
    } else {
        document.getElementById('contracts-stats-section').style.display = 'none';
    }
    
    // Update leases stats in overview
    if (leasesData) {
        loadedDatasets.push('Leases');
        const leasesSavings = leasesData.reduce((sum, item) => sum + item.savings, 0);
        
        document.getElementById('leases-overview-count').textContent = formatNumber(leasesData.length);
        document.getElementById('leases-overview-value').textContent = formatCurrency(leasesData.reduce((sum, item) => sum + item.value, 0));
        document.getElementById('leases-overview-savings').textContent = formatCurrency(leasesSavings);
        document.getElementById('leases-stats-section').style.display = 'block';
        
        totalSavings += leasesSavings;
        totalItems += leasesData.length;
        leasesData.forEach(item => agencies.add(item.agency));
    } else {
        document.getElementById('leases-stats-section').style.display = 'none';
    }
    
    // Update payments stats in overview
    if (paymentsData) {
        loadedDatasets.push('Payments');
        const paymentsValue = paymentsData.reduce((sum, item) => sum + (parseFloat(item.payment_amt) || 0), 0);
        
        // Add null checks for all DOM elements
        const countElement = document.getElementById('payments-overview-count');
        const valueElement = document.getElementById('payments-overview-value');
        const statsSectionElement = document.getElementById('payments-stats-section');
        
        if (countElement) countElement.textContent = formatNumber(paymentsData.length);
        if (valueElement) valueElement.textContent = formatCurrency(paymentsValue);
        if (statsSectionElement) statsSectionElement.style.display = 'block';
        
        // No savings in payments data, but add to total items
        totalItems += paymentsData.length;
        paymentsData.forEach(item => item.agency_name && agencies.add(item.agency_name));
    } else {
        const statsSectionElement = document.getElementById('payments-stats-section');
        if (statsSectionElement) statsSectionElement.style.display = 'none';
    }
    
    // Update overall stats
    document.getElementById('total-savings').textContent = formatCurrency(totalSavings);
    document.getElementById('total-items').textContent = formatNumber(totalItems);
    document.getElementById('total-agencies').textContent = formatNumber(agencies.size);
    
    // Update datasets loaded info
    const datasetsLoadedInfo = document.getElementById('datasets-loaded-info');
    if (loadedDatasets.length === 0) {
        datasetsLoadedInfo.textContent = 'No datasets loaded yet';
        datasetsLoadedInfo.parentElement.className = 'alert alert-warning';
    } else {
        datasetsLoadedInfo.textContent = `Datasets loaded: ${loadedDatasets.join(', ')} (${loadedDatasets.length} of 4)`;
        datasetsLoadedInfo.parentElement.className = 'alert alert-success';
    }
};

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Navigation event listeners
    document.getElementById('overview-link').addEventListener('click', (e) => {
        e.preventDefault();
        showSection('overview-section');
    });
    
    document.getElementById('grants-link').addEventListener('click', (e) => {
        e.preventDefault();
        showSection('grants-section');
    });
    
    document.getElementById('contracts-link').addEventListener('click', (e) => {
        e.preventDefault();
        showSection('contracts-section');
    });
    
    document.getElementById('leases-link').addEventListener('click', (e) => {
        e.preventDefault();
        showSection('leases-section');
    });
    
    document.getElementById('payments-link').addEventListener('click', (e) => {
        e.preventDefault();
        showSection('payments-section');
    });
    
    // Load data buttons
    document.getElementById('grants-load-btn').addEventListener('click', loadGrantsData);
    document.getElementById('contracts-load-btn').addEventListener('click', loadContractsData);
    document.getElementById('leases-load-btn').addEventListener('click', loadLeasesData);
    document.getElementById('payments-load-btn').addEventListener('click', loadPaymentsData);
    
    // Quick access buttons from overview
    document.getElementById('view-grants-btn').addEventListener('click', () => {
        showSection('grants-section');
        loadGrantsData();
    });
    
    document.getElementById('view-contracts-btn').addEventListener('click', () => {
        showSection('contracts-section');
        loadContractsData();
    });
    
    document.getElementById('view-leases-btn').addEventListener('click', () => {
        showSection('leases-section');
        loadLeasesData();
    });
    
    document.getElementById('view-payments-btn').addEventListener('click', () => {
        showSection('payments-section');
        loadPaymentsData();
    });
    
    // Initialize with overview section
    showSection('overview-section');
    
    // Set loading placeholders
    document.getElementById('total-savings').textContent = 'Not loaded';
    document.getElementById('total-items').textContent = 'Not loaded';
    document.getElementById('total-agencies').textContent = 'Not loaded';
    
    // Initialize dataset stats sections
    document.getElementById('grants-stats-section').style.display = 'none';
    document.getElementById('contracts-stats-section').style.display = 'none';
    document.getElementById('leases-stats-section').style.display = 'none';
    document.getElementById('payments-stats-section').style.display = 'none';
    document.getElementById('datasets-loaded-info').textContent = 'No datasets loaded yet';
});
