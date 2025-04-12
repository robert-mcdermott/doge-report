/**
 * DOGE Report Dashboard - Dark Mode Toggle
 * Implements Synthwave 84-inspired dark mode
 */

document.addEventListener('DOMContentLoaded', function() {
    // Check for saved theme preference or use default
    const currentTheme = localStorage.getItem('theme') || 'light';
    
    // Apply the saved theme on page load
    if (currentTheme === 'dark') {
        document.body.classList.add('dark-mode');
        document.getElementById('theme-toggle').checked = true;
    }
    
    // Toggle theme when the switch is clicked
    document.getElementById('theme-toggle').addEventListener('change', function(e) {
        if (e.target.checked) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('theme', 'light');
        }
        
        // If any charts are already rendered, we need to update them
        // This will trigger a re-render of all charts with the new theme
        if (typeof updateChartsForTheme === 'function') {
            updateChartsForTheme();
        }
    });
});

// Function to update charts when theme changes
function updateChartsForTheme() {
    // If charts exist, destroy and recreate them
    if (window.grantsRecipientsChart) {
        const data = window.grantsRecipientsChart.data;
        const options = window.grantsRecipientsChart.options;
        window.grantsRecipientsChart.destroy();
        
        const ctx = document.getElementById('grants-recipients-chart').getContext('2d');
        window.grantsRecipientsChart = new Chart(ctx, {
            type: 'bar',
            data: data,
            options: options
        });
    }
    
    if (window.grantsAgenciesChart) {
        const data = window.grantsAgenciesChart.data;
        const options = window.grantsAgenciesChart.options;
        window.grantsAgenciesChart.destroy();
        
        const ctx = document.getElementById('grants-agencies-chart').getContext('2d');
        window.grantsAgenciesChart = new Chart(ctx, {
            type: 'bar',
            data: data,
            options: options
        });
    }
    
    if (window.contractsVendorsChart) {
        const data = window.contractsVendorsChart.data;
        const options = window.contractsVendorsChart.options;
        window.contractsVendorsChart.destroy();
        
        const ctx = document.getElementById('contracts-vendors-chart').getContext('2d');
        window.contractsVendorsChart = new Chart(ctx, {
            type: 'bar',
            data: data,
            options: options
        });
    }
    
    if (window.contractsAgenciesChart) {
        const data = window.contractsAgenciesChart.data;
        const options = window.contractsAgenciesChart.options;
        window.contractsAgenciesChart.destroy();
        
        const ctx = document.getElementById('contracts-agencies-chart').getContext('2d');
        window.contractsAgenciesChart = new Chart(ctx, {
            type: 'bar',
            data: data,
            options: options
        });
    }
    
    if (window.leasesLocationsChart) {
        const data = window.leasesLocationsChart.data;
        const options = window.leasesLocationsChart.options;
        window.leasesLocationsChart.destroy();
        
        const ctx = document.getElementById('leases-locations-chart').getContext('2d');
        window.leasesLocationsChart = new Chart(ctx, {
            type: 'bar',
            data: data,
            options: options
        });
    }
    
    if (window.leasesAgenciesChart) {
        const data = window.leasesAgenciesChart.data;
        const options = window.leasesAgenciesChart.options;
        window.leasesAgenciesChart.destroy();
        
        const ctx = document.getElementById('leases-agencies-chart').getContext('2d');
        window.leasesAgenciesChart = new Chart(ctx, {
            type: 'bar',
            data: data,
            options: options
        });
    }
}
