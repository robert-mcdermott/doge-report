/**
 * DOGE Report Dashboard - Description Expander
 * Enhances data tables with expandable description functionality
 */

// Direct modification of DataTables rendering for descriptions
function modifyDataTablesInitialization() {
    // Store original DataTable function
    const originalDataTable = $.fn.DataTable;
    
    // Override DataTable to intercept initialization
    $.fn.DataTable = function(options) {
        // Check if options contain columns with description rendering
        if (options && options.columns) {
            options.columns.forEach(column => {
                // If this is a description column with a render function
                if (column.data === 'description' && column.render) {
                    // Replace the render function with our enhanced version
                    const originalRender = column.render;
                    column.render = function(data, type, row, meta) {
                        if (type === 'display') {
                            if (!data) return '';
                            
                            // Create expandable description
                            return `
                                <div class="description-cell">
                                    <div class="description-preview">${data.length > 100 ? data.substring(0, 100) + '...' : data}</div>
                                    ${data.length > 100 ? '<button class="btn btn-sm btn-link show-full-description">Show more</button>' : ''}
                                    <div class="full-description" style="display: none;">${data}</div>
                                </div>
                            `;
                        }
                        return data;
                    };
                }
            });
        }
        
        // Call the original DataTable function with modified options
        return originalDataTable.apply(this, arguments);
    };
    
    // Copy all properties from the original DataTable
    for (const prop in originalDataTable) {
        if (originalDataTable.hasOwnProperty(prop)) {
            $.fn.DataTable[prop] = originalDataTable[prop];
        }
    }
}

// Handle show more/less button clicks
function setupDescriptionToggleHandlers() {
    // Use event delegation on the document body for all tables
    $(document).on('click', '.show-full-description', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const $button = $(this);
        const $cell = $button.closest('.description-cell');
        const $preview = $cell.find('.description-preview');
        const $fullText = $cell.find('.full-description');
        
        if ($fullText.is(':visible')) {
            $fullText.hide();
            $preview.show();
            $button.text('Show more');
        } else {
            $preview.hide();
            $fullText.show();
            $button.text('Show less');
        }
    });
}

// Adjust any existing descriptions that might have been missed
function enhanceExistingDescriptions() {
    // Process all tables
    const tableIds = ['grants-table', 'contracts-table', 'leases-table'];
    
    tableIds.forEach(tableId => {
        const $table = $('#' + tableId);
        if (!$table.length) return;
        
        // Find all cells with truncate-text that haven't been enhanced yet
        $table.find('.truncate-text').each(function() {
            const $cell = $(this);
            const fullText = $cell.attr('title');
            
            if (fullText && fullText.length > 100 && !$cell.find('.description-cell').length) {
                const previewText = $cell.text();
                
                // Replace with enhanced version
                $cell.html(`
                    <div class="description-cell">
                        <div class="description-preview">${previewText}</div>
                        <button class="btn btn-sm btn-link show-full-description">Show more</button>
                        <div class="full-description" style="display: none;">${fullText}</div>
                    </div>
                `);
            }
        });
    });
}

// Main initialization
document.addEventListener('DOMContentLoaded', function() {
    // Modify DataTables initialization to handle descriptions properly
    modifyDataTablesInitialization();
    
    // Set up event handlers for show more/less buttons
    setupDescriptionToggleHandlers();
    
    // Process any tables that might be loaded later
    const processTablesAfterLoad = function() {
        setTimeout(enhanceExistingDescriptions, 500);
    };
    
    // Add event listeners for data load buttons
    $('#grants-load-btn, #contracts-load-btn, #leases-load-btn').on('click', processTablesAfterLoad);
    $('#view-grants-btn, #view-contracts-btn, #view-leases-btn').on('click', processTablesAfterLoad);
    
    // Also process when switching tabs
    $('#grants-link, #contracts-link, #leases-link').on('click', processTablesAfterLoad);
    
    // Set up mutation observer to catch any dynamically loaded tables
    const observer = new MutationObserver(function(mutations) {
        let shouldProcess = false;
        
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length) {
                // Check if any tables or table rows were added
                for (let i = 0; i < mutation.addedNodes.length; i++) {
                    const node = mutation.addedNodes[i];
                    if (node.nodeName === 'TABLE' || 
                        (node.nodeName === 'TR') || 
                        node.querySelector && (node.querySelector('table') || node.querySelector('tr'))) {
                        shouldProcess = true;
                        break;
                    }
                }
            }
        });
        
        if (shouldProcess) {
            processTablesAfterLoad();
        }
    });
    
    // Start observing the document body for changes
    observer.observe(document.body, { childList: true, subtree: true });
});

