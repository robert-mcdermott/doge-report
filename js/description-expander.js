/**
 * DOGE Report Dashboard - Description Expander
 * Enhances data tables with expandable description functionality
 */

document.addEventListener('DOMContentLoaded', function() {
    // Function to enhance a table with expandable descriptions
    function enhanceTableDescriptions(tableId) {
        const table = document.getElementById(tableId);
        if (!table) return;
        
        // Add event delegation for the table
        table.addEventListener('click', function(e) {
            // Check if the clicked element is a description cell or its child
            const target = e.target;
            if (target.classList.contains('show-full-description')) {
                const cell = target.closest('td');
                if (!cell) return;
                
                const previewDiv = cell.querySelector('.description-preview');
                const fullDiv = cell.querySelector('.full-description');
                
                if (previewDiv && fullDiv) {
                    if (fullDiv.style.display === 'none') {
                        // Expand
                        previewDiv.style.display = 'none';
                        fullDiv.style.display = 'block';
                        target.textContent = 'Show less';
                    } else {
                        // Collapse
                        fullDiv.style.display = 'none';
                        previewDiv.style.display = 'block';
                        target.textContent = 'Show more';
                    }
                }
            }
        });
    }
    
    // Function to convert truncated descriptions to expandable ones
    function convertDescriptionCells() {
        // Process all tables
        const tables = ['grants-table', 'contracts-table', 'leases-table'];
        
        tables.forEach(tableId => {
            const table = document.getElementById(tableId);
            if (!table) return;
            
            // Find all description cells
            const cells = table.querySelectorAll('.truncate-text');
            cells.forEach(cell => {
                const fullText = cell.getAttribute('title');
                if (fullText && fullText.length > 100) {
                    const previewText = cell.textContent;
                    
                    // Create new structure
                    const container = document.createElement('div');
                    container.className = 'description-cell';
                    
                    const preview = document.createElement('div');
                    preview.className = 'description-preview';
                    preview.textContent = previewText;
                    
                    const button = document.createElement('button');
                    button.className = 'btn btn-sm btn-link show-full-description';
                    button.textContent = 'Show more';
                    
                    const fullContent = document.createElement('div');
                    fullContent.className = 'full-description';
                    fullContent.style.display = 'none';
                    fullContent.textContent = fullText;
                    
                    // Assemble and replace
                    container.appendChild(preview);
                    container.appendChild(button);
                    container.appendChild(fullContent);
                    
                    // Replace the original cell content
                    cell.parentNode.replaceChild(container, cell);
                }
            });
            
            // Add event handling
            enhanceTableDescriptions(tableId);
        });
    }
    
    // Set up mutation observer to watch for table changes
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length) {
                // Check if any tables were loaded
                setTimeout(convertDescriptionCells, 500); // Slight delay to ensure DataTables is done
            }
        });
    });
    
    // Start observing the document body for changes
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Add event listeners for data load buttons to trigger conversion
    document.getElementById('grants-load-btn')?.addEventListener('click', function() {
        setTimeout(convertDescriptionCells, 1000);
    });
    
    document.getElementById('contracts-load-btn')?.addEventListener('click', function() {
        setTimeout(convertDescriptionCells, 1000);
    });
    
    document.getElementById('leases-load-btn')?.addEventListener('click', function() {
        setTimeout(convertDescriptionCells, 1000);
    });
    
    // Also handle the quick access buttons
    document.getElementById('view-grants-btn')?.addEventListener('click', function() {
        setTimeout(convertDescriptionCells, 1000);
    });
    
    document.getElementById('view-contracts-btn')?.addEventListener('click', function() {
        setTimeout(convertDescriptionCells, 1000);
    });
    
    document.getElementById('view-leases-btn')?.addEventListener('click', function() {
        setTimeout(convertDescriptionCells, 1000);
    });
});
