// DOGE Report Dashboard - Main Application JavaScript

// Global variables to store datasets
let grantsData = null;
let contractsData = null;
let leasesData = null;

// DataTable instances
let grantsTable = null;
let contractsTable = null;
let leasesTable = null;

// Chart instances
let grantsRecipientsChart = null;
let grantsAgenciesChart = null;
let contractsVendorsChart = null;
let contractsAgenciesChart = null;
let leasesLocationsChart = null;
let leasesAgenciesChart = null;

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
    const aggregated = {};
    
    data.forEach(item => {
        const name = item[keyName];
        const value = item[keyValue] || 0;
        
        if (!aggregated[name]) {
            aggregated[name] = 0;
        }
        
        aggregated[name] += value;
    });
    
    return Object.entries(aggregated)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([name, value]) => ({ name, value }));
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

// Update overview summary stats
const updateOverviewStats = () => {
    let totalSavings = 0;
    let totalItems = 0;
    const agencies = new Set();
    const loadedDatasets = [];
    
    // Update grants stats in overview
    if (grantsData) {
        loadedDatasets.push('Grants');
        const grantsValue = grantsData.reduce((sum, item) => sum + item.value, 0);
        const grantsSavings = grantsData.reduce((sum, item) => sum + item.savings, 0);
        
        document.getElementById('grants-overview-count').textContent = formatNumber(grantsData.length);
        document.getElementById('grants-overview-value').textContent = formatCurrency(grantsValue);
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
        const contractsValue = contractsData.reduce((sum, item) => sum + item.value, 0);
        const contractsSavings = contractsData.reduce((sum, item) => sum + item.savings, 0);
        
        document.getElementById('contracts-overview-count').textContent = formatNumber(contractsData.length);
        document.getElementById('contracts-overview-value').textContent = formatCurrency(contractsValue);
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
        const leasesValue = leasesData.reduce((sum, item) => sum + item.value, 0);
        const leasesSavings = leasesData.reduce((sum, item) => sum + item.savings, 0);
        
        document.getElementById('leases-overview-count').textContent = formatNumber(leasesData.length);
        document.getElementById('leases-overview-value').textContent = formatCurrency(leasesValue);
        document.getElementById('leases-overview-savings').textContent = formatCurrency(leasesSavings);
        document.getElementById('leases-stats-section').style.display = 'block';
        
        totalSavings += leasesSavings;
        totalItems += leasesData.length;
        leasesData.forEach(item => agencies.add(item.agency));
    } else {
        document.getElementById('leases-stats-section').style.display = 'none';
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
        datasetsLoadedInfo.textContent = `Datasets loaded: ${loadedDatasets.join(', ')} (${loadedDatasets.length} of 3)`;
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
    
    // Load data buttons
    document.getElementById('grants-load-btn').addEventListener('click', loadGrantsData);
    document.getElementById('contracts-load-btn').addEventListener('click', loadContractsData);
    document.getElementById('leases-load-btn').addEventListener('click', loadLeasesData);
    
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
    document.getElementById('datasets-loaded-info').textContent = 'No datasets loaded yet';
});
