document.addEventListener('DOMContentLoaded', function() {
    try {
        // Initialize the app
        initApp();
    } catch (error) {
        console.error('Error initializing app:', error);
        showToast('There was an error initializing the app. Please refresh the page.');
    }
});

// Data structure
let passwordManagerData = {
    entries: [],
    categories: [
        { id: 'personal', name: 'Personal', icon: 'fas fa-user' },
        { id: 'work', name: 'Work', icon: 'fas fa-briefcase' },
        { id: 'social', name: 'Social Media', icon: 'fas fa-share-alt' },
        { id: 'financial', name: 'Financial', icon: 'fas fa-wallet' },
        { id: 'other', name: 'Other', icon: 'fas fa-folder' }
    ],
    settings: {
        autoLock: 5,
        theme: 'light'
    }
};

// Current state
let currentState = {
    selectedEntry: null,
    isPasswordVisible: false,
    sortOrder: 'newest',
    activeModal: null
};

function initApp() {
    try {
        // Initialize data structure
        initializeData();
        
        // Load data from localStorage
        loadData();
        
        // Initialize UI elements
        initUI();
        
        // Set up event listeners
        setupEventListeners();
        
        // Render initial views
        updateDashboard();
        renderAllEntries();
        renderRecentEntries();
        
        // Show initial active tab
        const defaultTab = document.querySelector('nav li[data-tab="dashboard"]');
        if (defaultTab) {
            defaultTab.click();
        }
    } catch (error) {
        console.error('Error in initApp:', error);
        showToast('Failed to initialize application');
    }
}

function initializeData() {
    if (!localStorage.getItem('securePasswordManagerData')) {
        // Create sample data if no data exists
        passwordManagerData.entries = [
            {
                id: '1',
                service: 'google',
                serviceName: 'Google',
                username: 'user@gmail.com',
                password: 'SamplePassword123!',
                notes: 'Personal account',
                category: 'personal',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + (90 * 24 * 60 * 60 * 1000)).toISOString()
            },
            {
                id: '2',
                service: 'microsoft',
                serviceName: 'Microsoft',
                username: 'user@outlook.com',
                password: 'AnotherPassword456!',
                notes: 'Work account',
                category: 'work',
                createdAt: new Date(Date.now() - 86400000).toISOString(),
                updatedAt: new Date(Date.now() - 86400000).toISOString(),
                expiresAt: new Date(Date.now() + (60 * 24 * 60 * 60 * 1000)).toISOString()
            }
        ];
        saveData();
    }
}

function loadData() {
    try {
        const savedData = localStorage.getItem('securePasswordManagerData');
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            
            // Validate loaded data structure
            if (parsedData && typeof parsedData === 'object') {
                passwordManagerData = {
                    ...passwordManagerData,
                    ...parsedData
                };
                
                // Ensure entries array exists and is valid
                if (!Array.isArray(passwordManagerData.entries)) {
                    passwordManagerData.entries = [];
                } else {
                    // Filter out any invalid entries
                    passwordManagerData.entries = passwordManagerData.entries.filter(entry => 
                        entry && entry.id && entry.serviceName && entry.username
                    );
                }
                
                // Ensure categories exist
                if (!Array.isArray(passwordManagerData.categories)) {
                    passwordManagerData.categories = [
                        { id: 'personal', name: 'Personal', icon: 'fas fa-user' },
                        { id: 'work', name: 'Work', icon: 'fas fa-briefcase' },
                        { id: 'social', name: 'Social Media', icon: 'fas fa-share-alt' },
                        { id: 'financial', name: 'Financial', icon: 'fas fa-wallet' },
                        { id: 'other', name: 'Other', icon: 'fas fa-folder' }
                    ];
                }
            }
        }
    } catch (error) {
        console.error('Error loading data:', error);
        showToast('Error loading saved data. Starting with fresh data.');
        // Reset to default data
        passwordManagerData.entries = [];
        saveData();
    }
}

function saveData() {
    try {
        // Validate data structure before saving
        if (!passwordManagerData || typeof passwordManagerData !== 'object') {
            throw new Error('Invalid data structure');
        }
        
        // Ensure entries array exists and is valid
        if (!Array.isArray(passwordManagerData.entries)) {
            passwordManagerData.entries = [];
        } else {
            // Filter out any invalid entries before saving
            passwordManagerData.entries = passwordManagerData.entries.filter(entry => 
                entry && entry.id && entry.serviceName && entry.username
            );
        }
        
        // Save to localStorage
        localStorage.setItem('securePasswordManagerData', JSON.stringify(passwordManagerData));
        
        // Verify save was successful
        const savedData = localStorage.getItem('securePasswordManagerData');
        if (!savedData) {
            throw new Error('Failed to verify saved data');
        }
        
        return true;
    } catch (error) {
        console.error('Error saving data:', error);
        showToast('Error saving data. Please check console for details.');
        return false;
    }
}

function initUI() {
    try {
        // Initialize service select
        const serviceSelect = document.getElementById('service-name');
        if (serviceSelect) {
            // Clear previous event listener if any
            serviceSelect.replaceWith(serviceSelect.cloneNode(true));
            
            const newServiceSelect = document.getElementById('service-name');
            newServiceSelect.addEventListener('change', function() {
                const customServiceGroup = document.getElementById('custom-service-group');
                if (this.value === 'other') {
                    customServiceGroup.style.display = 'block';
                } else {
                    customServiceGroup.style.display = 'none';
                    document.getElementById('custom-service').value = '';
                }
            });
        }
        
        // Initialize password input
        const passwordInput = document.getElementById('password');
        if (passwordInput) {
            passwordInput.addEventListener('input', function() {
                updatePasswordStrength(this.value);
            });
        }
        
        // Initialize modals
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.addEventListener('click', function(e) {
                if (e.target === this) {
                    closeModal(this);
                }
            });
            
            // Add close buttons
            const closeButtons = modal.querySelectorAll('.close-modal');
            closeButtons.forEach(btn => {
                btn.addEventListener('click', () => closeModal(modal));
            });
        });
        
        // Initialize password generator
        const generatePasswordBtn = document.getElementById('generate-password-btn');
        if (generatePasswordBtn) {
            generatePasswordBtn.addEventListener('click', openPasswordGenerator);
        }
    } catch (error) {
        console.error('Error initializing UI:', error);
        showToast('Error initializing UI components');
    }
}

function setupEventListeners() {
    try {
        // Navigation tabs
        document.querySelectorAll('nav li').forEach(item => {
            item.addEventListener('click', function() {
                // Remove active class from all tabs
                document.querySelectorAll('nav li').forEach(li => li.classList.remove('active'));
                // Add active class to clicked tab
                this.classList.add('active');
                
                // Hide all tab content
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                
                // Show selected tab content
                const tabId = this.getAttribute('data-tab');
                const tabContent = document.getElementById(tabId);
                if (tabContent) {
                    tabContent.classList.add('active');
                }
            });
        });
        
        // Toggle password visibility
        const togglePasswordBtn = document.getElementById('toggle-password-btn');
        if (togglePasswordBtn) {
            togglePasswordBtn.addEventListener('click', function() {
                const passwordInput = document.getElementById('password');
                if (!passwordInput) return;
                
                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    this.innerHTML = '<i class="fas fa-eye-slash"></i>';
                } else {
                    passwordInput.type = 'password';
                    this.innerHTML = '<i class="fas fa-eye"></i>';
                }
            });
        }
        
        // Save entry button
        const saveEntryBtn = document.getElementById('save-entry-btn');
        if (saveEntryBtn) {
            saveEntryBtn.addEventListener('click', function(e) {
                e.preventDefault();
                saveNewEntry();
            });
        }
        
        // Clear form button
        const clearFormBtn = document.getElementById('clear-form-btn');
        if (clearFormBtn) {
            clearFormBtn.addEventListener('click', function(e) {
                e.preventDefault();
                clearEntryForm();
            });
        }
        
        // Search entries
        const searchInput = document.getElementById('search-entries');
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                renderAllEntries(this.value);
            });
        }
        
        // Filter by service
        const filterService = document.getElementById('filter-service');
        if (filterService) {
            filterService.addEventListener('change', function() {
                renderAllEntries();
            });
        }
        
        // Sort by date
        const sortByDate = document.getElementById('sort-by-date');
        if (sortByDate) {
            sortByDate.addEventListener('click', function() {
                currentState.sortOrder = currentState.sortOrder === 'newest' ? 'oldest' : 'newest';
                this.innerHTML = `Sort by Date <i class="fas fa-sort-${currentState.sortOrder === 'newest' ? 'down' : 'up'}"></i>`;
                renderAllEntries();
            });
        }

        // Copy buttons
        document.addEventListener('click', function(e) {
            if (e.target.closest('.copy-btn')) {
                const targetId = e.target.closest('.copy-btn').getAttribute('data-target');
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    copyToClipboard(targetElement.textContent);
                    showToast('Copied to clipboard!');
                }
            }
        });

        // Generate secure passwords
        const generateSecureBtn = document.getElementById('generate-secure-passwords');
        if (generateSecureBtn) {
            generateSecureBtn.addEventListener('click', generateSecurePasswords);
        }

        // Password generator options
        const pwOptions = document.querySelectorAll('#security input[type="checkbox"], #security input[type="range"]');
        pwOptions.forEach(option => {
            option.addEventListener('change', generateSecurePasswords);
        });
    } catch (error) {
        console.error('Error setting up event listeners:', error);
        showToast('Error setting up event listeners');
    }
}

function saveNewEntry() {
    try {
        // Get form values
        const serviceSelect = document.getElementById('service-name');
        const service = serviceSelect.value;
        let serviceName = serviceSelect.options[serviceSelect.selectedIndex].text;
        const category = document.getElementById('entry-category').value || 'other';
        
        // Handle custom service name
        if (service === 'other') {
            serviceName = document.getElementById('custom-service').value.trim();
            if (!serviceName) {
                showToast('Please enter a service name');
                return false;
            }
        }
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        const notes = document.getElementById('notes').value.trim();
        const expiresInDays = parseInt(document.getElementById('password-expiration').value) || 90;
        
        // Validate required fields
        if (!username) {
            showToast('Username is required');
            return false;
        }
        
        if (!password) {
            showToast('Password is required');
            return false;
        }
        
        // Create new entry object
        const newEntry = {
            id: Date.now().toString(),
            service: service,
            serviceName: serviceName,
            category: category,
            username: username,
            password: password,
            notes: notes,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + (expiresInDays * 24 * 60 * 60 * 1000)).toISOString()
        };
        
        // Add new entry
        passwordManagerData.entries.push(newEntry);
        
        // Save to localStorage
        if (saveData()) {
            // Update UI
            updateDashboard();
            renderAllEntries();
            renderRecentEntries();
            clearEntryForm();
            
            // Show success message
            showToast('Entry saved successfully!');
            return true;
        } else {
            // Remove the entry if save failed
            passwordManagerData.entries.pop();
            return false;
        }
    } catch (error) {
        console.error('Error in saveNewEntry:', error);
        showToast('Error saving entry. Please try again.');
        return false;
    }
}

function clearEntryForm() {
    const form = document.getElementById('add-entry-form');
    if (form) {
        form.reset();
    }
    
    document.getElementById('custom-service-group').style.display = 'none';
    document.querySelector('.password-strength-meter .strength-bar').style.width = '0%';
    document.getElementById('strength-text').textContent = '';
    
    // Reset save button to default state
    const saveBtn = document.getElementById('save-entry-btn');
    if (saveBtn) {
        saveBtn.textContent = 'Save Entry';
        saveBtn.onclick = saveNewEntry;
    }
}

function updateDashboard() {
    try {
        // Update total passwords
        const totalPasswordsEl = document.getElementById('total-passwords');
        if (totalPasswordsEl) {
            totalPasswordsEl.textContent = passwordManagerData.entries.length;
        }
        
        // Count weak passwords
        const weakPasswords = passwordManagerData.entries.filter(entry => {
            return entry.password.length < 8 || 
                   !/[A-Z]/.test(entry.password) || 
                   !/[0-9]/.test(entry.password) || 
                   !/[^A-Za-z0-9]/.test(entry.password);
        }).length;
        
        const weakPasswordsEl = document.getElementById('weak-passwords');
        if (weakPasswordsEl) {
            weakPasswordsEl.textContent = weakPasswords;
        }
        
        // Count expired passwords
        const now = new Date();
        const expiredPasswords = passwordManagerData.entries.filter(entry => {
            if (!entry.expiresAt) return false;
            const expirationDate = new Date(entry.expiresAt);
            return expirationDate < now;
        }).length;
        
        const expiredPasswordsEl = document.getElementById('expired-passwords');
        if (expiredPasswordsEl) {
            expiredPasswordsEl.textContent = expiredPasswords;
        }
    } catch (error) {
        console.error('Error updating dashboard:', error);
    }
}

function renderAllEntries(searchTerm = '') {
    const entriesList = document.getElementById('all-entries-list');
    if (!entriesList) return;
    
    // Clear previous entries
    entriesList.innerHTML = '';
    
    const serviceFilter = document.getElementById('filter-service')?.value || 'all';
    const categoryFilter = document.getElementById('filter-category')?.value || 'all';
    
    let filteredEntries = passwordManagerData.entries.filter(entry => {
        // Filter by service
        if (serviceFilter !== 'all' && entry.service !== serviceFilter) {
            return false;
        }
        
        // Filter by category
        if (categoryFilter !== 'all' && entry.category !== categoryFilter) {
            return false;
        }
        
        // Filter by search term
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            return (
                (entry.serviceName && entry.serviceName.toLowerCase().includes(searchLower)) ||
                (entry.username && entry.username.toLowerCase().includes(searchLower)) ||
                (entry.notes && entry.notes.toLowerCase().includes(searchLower))
            );
        }
        
        return true;
    });
    
    // Sort entries
    filteredEntries.sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt);
        const dateB = new Date(b.updatedAt || b.createdAt);
        return currentState.sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
    
    if (filteredEntries.length === 0) {
        entriesList.innerHTML = '<div class="empty-state">No entries found</div>';
        return;
    }
    
    filteredEntries.forEach(entry => {
        const entryItem = document.createElement('div');
        entryItem.className = 'entry-item';
        entryItem.dataset.id = entry.id;
        
        entryItem.innerHTML = `
            <div class="entry-icon">
                <i class="${getCategoryIcon(entry.category)}"></i>
            </div>
            <div class="entry-details">
                <div class="entry-service">${escapeHtml(entry.serviceName)}</div>
                <div class="entry-username">${escapeHtml(entry.username)}</div>
                <div class="entry-date">Last updated: ${formatDate(entry.updatedAt)}</div>
            </div>
        `;
        
        entryItem.addEventListener('click', function() {
            viewEntryDetails(entry.id);
        });
        
        entriesList.appendChild(entryItem);
    });
}

function renderRecentEntries() {
    const recentEntriesList = document.getElementById('recent-entries-list');
    if (!recentEntriesList) return;
    
    recentEntriesList.innerHTML = '';
    
    // Get 5 most recent entries
    const recentEntries = [...passwordManagerData.entries]
        .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
        .slice(0, 5);
    
    if (recentEntries.length === 0) {
        recentEntriesList.innerHTML = '<div class="empty-state">No recent entries</div>';
        return;
    }
    
    recentEntries.forEach(entry => {
        const entryItem = document.createElement('div');
        entryItem.className = 'entry-item';
        entryItem.dataset.id = entry.id;
        
        entryItem.innerHTML = `
            <div class="entry-icon">
                <i class="${getCategoryIcon(entry.category)}"></i>
            </div>
            <div class="entry-details">
                <div class="entry-service">${escapeHtml(entry.serviceName)}</div>
                <div class="entry-username">${escapeHtml(entry.username)}</div>
                <div class="entry-date">Last updated: ${formatDate(entry.updatedAt)}</div>
            </div>
        `;
        
        entryItem.addEventListener('click', function() {
            viewEntryDetails(entry.id);
        });
        
        recentEntriesList.appendChild(entryItem);
    });
}

function viewEntryDetails(entryId) {
    const entry = passwordManagerData.entries.find(e => e.id === entryId);
    if (!entry) {
        showToast('Entry not found');
        return;
    }
    
    currentState.selectedEntry = entry;
    
    const modal = document.getElementById('entry-detail-modal');
    if (!modal) return;
    
    // Clear previous event listeners
    const modalToggle = document.getElementById('modal-toggle-password');
    const editBtn = document.getElementById('edit-entry-btn');
    const deleteBtn = document.getElementById('delete-entry-btn');
    
    modalToggle.replaceWith(modalToggle.cloneNode(true));
    editBtn.replaceWith(editBtn.cloneNode(true));
    deleteBtn.replaceWith(deleteBtn.cloneNode(true));
    
    // Update modal content
    document.getElementById('modal-service-name').textContent = escapeHtml(entry.serviceName);
    document.getElementById('modal-username').textContent = escapeHtml(entry.username);
    document.getElementById('modal-password').textContent = '••••••••';
    document.getElementById('modal-created').textContent = formatDate(entry.createdAt);
    document.getElementById('modal-updated').textContent = formatDate(entry.updatedAt);
    
    if (entry.notes) {
        document.getElementById('modal-notes').textContent = escapeHtml(entry.notes);
        document.getElementById('modal-notes-container').style.display = 'block';
    } else {
        document.getElementById('modal-notes-container').style.display = 'none';
    }
    
    // Set up new event listeners
    document.getElementById('modal-toggle-password').addEventListener('click', function() {
        const passwordField = document.getElementById('modal-password');
        if (passwordField.textContent === '••••••••') {
            passwordField.textContent = escapeHtml(entry.password);
            this.innerHTML = '<i class="fas fa-eye-slash"></i>';
        } else {
            passwordField.textContent = '••••••••';
            this.innerHTML = '<i class="fas fa-eye"></i>';
        }
    });
    
    document.getElementById('edit-entry-btn').addEventListener('click', function() {
        closeModal(modal);
        editEntry(entry.id);
    });
    
    document.getElementById('delete-entry-btn').addEventListener('click', function() {
        if (confirm('Are you sure you want to delete this entry?')) {
            deleteEntry(entry.id);
            closeModal(modal);
        }
    });
    
    // Show modal
    modal.classList.add('active');
    currentState.activeModal = modal;
}

function editEntry(entryId) {
    const entry = passwordManagerData.entries.find(e => e.id === entryId);
    if (!entry) {
        showToast('Entry not found');
        return;
    }
    
    // Switch to Add New tab
    const addNewTab = document.querySelector('nav li[data-tab="add-new"]');
    if (addNewTab) {
        addNewTab.click();
    }
    
    // Fill the form with entry data
    document.getElementById('service-name').value = entry.service || 'other';
    if (entry.service === 'other') {
        document.getElementById('custom-service-group').style.display = 'block';
        document.getElementById('custom-service').value = entry.serviceName || '';
    }
    document.getElementById('entry-category').value = entry.category || 'other';
    document.getElementById('username').value = entry.username || '';
    document.getElementById('password').value = entry.password || '';
    document.getElementById('notes').value = entry.notes || '';
    
    // Calculate expiration days
    if (entry.expiresAt) {
        const expiresDate = new Date(entry.expiresAt);
        const today = new Date();
        const diffTime = expiresDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        document.getElementById('password-expiration').value = diffDays > 0 ? diffDays : 90;
    } else {
        document.getElementById('password-expiration').value = 90;
    }
    
    updatePasswordStrength(entry.password || '');
    
    // Change save button to update
    const saveBtn = document.getElementById('save-entry-btn');
    if (saveBtn) {
        saveBtn.textContent = 'Update Entry';
        saveBtn.onclick = function(e) {
            e.preventDefault();
            updateEntry(entryId);
        };
    }
}

function updateEntry(entryId) {
    const entryIndex = passwordManagerData.entries.findIndex(e => e.id === entryId);
    if (entryIndex === -1) {
        showToast('Entry not found');
        return;
    }
    
    const serviceSelect = document.getElementById('service-name');
    const service = serviceSelect.value;
    let serviceName = serviceSelect.options[serviceSelect.selectedIndex].text;
    
    if (service === 'other') {
        serviceName = document.getElementById('custom-service').value.trim();
        if (!serviceName) {
            showToast('Please enter a service name');
            return;
        }
    }
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const notes = document.getElementById('notes').value.trim();
    const category = document.getElementById('entry-category').value || 'other';
    const expiresInDays = parseInt(document.getElementById('password-expiration').value) || 90;
    
    if (!username || !password) {
        showToast('Username and password are required');
        return;
    }
    
    passwordManagerData.entries[entryIndex] = {
        ...passwordManagerData.entries[entryIndex],
        service,
        serviceName,
        category,
        username,
        password,
        notes,
        updatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + (expiresInDays * 24 * 60 * 60 * 1000)).toISOString()
    };
    
    if (!saveData()) {
        showToast('Failed to save changes');
        return;
    }
    
    // Update UI
    updateDashboard();
    renderAllEntries();
    renderRecentEntries();
    clearEntryForm();
    
    // Show success message
    showToast('Entry updated successfully!');
}

function deleteEntry(entryId) {
    const initialLength = passwordManagerData.entries.length;
    passwordManagerData.entries = passwordManagerData.entries.filter(e => e.id !== entryId);
    
    if (passwordManagerData.entries.length === initialLength) {
        showToast('Entry not found');
        return;
    }
    
    if (!saveData()) {
        showToast('Failed to delete entry');
        return;
    }
    
    // Update UI
    updateDashboard();
    renderAllEntries();
    renderRecentEntries();
    
    showToast('Entry deleted successfully');
}

function openPasswordGenerator() {
    const modal = document.getElementById('password-generator-modal');
    if (!modal) return;
    
    // Clear previous event listeners
    const lengthInput = document.getElementById('pw-length');
    const checkboxes = document.querySelectorAll('#password-generator-modal input[type="checkbox"]');
    const refreshBtn = document.getElementById('refresh-password');
    const copyBtn = document.getElementById('copy-generated-password');
    const useBtn = document.getElementById('use-password-btn');
    
    lengthInput.replaceWith(lengthInput.cloneNode(true));
    refreshBtn.replaceWith(refreshBtn.cloneNode(true));
    copyBtn.replaceWith(copyBtn.cloneNode(true));
    useBtn.replaceWith(useBtn.cloneNode(true));
    
    checkboxes.forEach(checkbox => {
        checkbox.replaceWith(checkbox.cloneNode(true));
    });
    
    // Generate initial password
    generatePassword();
    
    // Set up new event listeners
    document.getElementById('pw-length').addEventListener('input', function() {
        document.getElementById('pw-length-value').textContent = this.value;
        generatePassword();
    });
    
    document.querySelectorAll('#password-generator-modal input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', generatePassword);
    });
    
    document.getElementById('refresh-password').addEventListener('click', generatePassword);
    
    document.getElementById('copy-generated-password').addEventListener('click', function() {
        const password = document.getElementById('generated-password').value;
        if (password && !password.startsWith('Select')) {
            copyToClipboard(password);
            showToast('Password copied to clipboard!');
        }
    });
    
    document.getElementById('use-password-btn').addEventListener('click', function() {
        const generatedPassword = document.getElementById('generated-password').value;
        if (generatedPassword && !generatedPassword.startsWith('Select')) {
            document.getElementById('password').value = generatedPassword;
            updatePasswordStrength(generatedPassword);
            closeModal(modal);
        }
    });
    
    // Show modal
    modal.classList.add('active');
    currentState.activeModal = modal;
}

function generatePassword() {
    const length = parseInt(document.getElementById('pw-length').value) || 12;
    const includeUpper = document.getElementById('include-uppercase').checked;
    const includeLower = document.getElementById('include-lowercase').checked;
    const includeNumbers = document.getElementById('include-numbers').checked;
    const includeSymbols = document.getElementById('include-symbols').checked;
    
    let charset = '';
    if (includeUpper) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeLower) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (includeNumbers) charset += '0123456789';
    if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    if (!charset) {
        document.getElementById('generated-password').value = 'Select at least one character type';
        updateGeneratedPasswordStrength('');
        return;
    }
    
    let password = '';
    const crypto = window.crypto || window.msCrypto;
    
    if (crypto && crypto.getRandomValues) {
        // Use cryptographically secure random numbers if available
        const values = new Uint32Array(length);
        crypto.getRandomValues(values);
        
        for (let i = 0; i < length; i++) {
            password += charset[values[i] % charset.length];
        }
    } else {
        // Fallback to Math.random (less secure)
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * charset.length);
            password += charset[randomIndex];
        }
    }
    
    document.getElementById('generated-password').value = password;
    updateGeneratedPasswordStrength(password);
}

function generateSecurePasswords() {
    const length = parseInt(document.getElementById('secure-pw-length').value) || 16;
    const includeUpper = document.getElementById('secure-include-uppercase').checked;
    const includeLower = document.getElementById('secure-include-lowercase').checked;
    const includeNumbers = document.getElementById('secure-include-numbers').checked;
    const includeSymbols = document.getElementById('secure-include-symbols').checked;
    
    let charset = '';
    if (includeUpper) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeLower) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (includeNumbers) charset += '0123456789';
    if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    if (!charset) {
        document.getElementById('secure-password-1').value = 'Select at least one character type';
        document.getElementById('secure-password-2').value = '';
        document.getElementById('secure-password-3').value = '';
        updateSecurePasswordStrength('', 'secure-strength-1');
        updateSecurePasswordStrength('', 'secure-strength-2');
        updateSecurePasswordStrength('', 'secure-strength-3');
        return;
    }
    
    const crypto = window.crypto || window.msCrypto;
    
    for (let i = 1; i <= 3; i++) {
        let password = '';
        
        if (crypto && crypto.getRandomValues) {
            // Use cryptographically secure random numbers if available
            const values = new Uint32Array(length);
            crypto.getRandomValues(values);
            
            for (let j = 0; j < length; j++) {
                password += charset[values[j] % charset.length];
            }
        } else {
            // Fallback to Math.random (less secure)
            for (let j = 0; j < length; j++) {
                const randomIndex = Math.floor(Math.random() * charset.length);
                password += charset[randomIndex];
            }
        }
        
        document.getElementById(`secure-password-${i}`).value = password;
        updateSecurePasswordStrength(password, `secure-strength-${i}`);
    }
}

function closeModal(modal) {
    if (!modal) return;
    
    modal.classList.remove('active');
    if (currentState.activeModal === modal) {
        currentState.activeModal = null;
    }
}

function copyToClipboard(text) {
    if (!text) return;
    
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';  // Prevent scrolling to bottom
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
        document.execCommand('copy');
    } catch (err) {
        console.error('Failed to copy text:', err);
    } finally {
        document.body.removeChild(textarea);
    }
}

function showToast(message) {
    // Remove existing toasts
    document.querySelectorAll('.toast-notification').forEach(toast => toast.remove());
    
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// Helper functions
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    try {
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? 'Invalid date' : 
            date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    } catch (e) {
        return 'Invalid date';
    }
}

function getCategoryIcon(categoryId) {
    const category = passwordManagerData.categories.find(c => c.id === categoryId);
    return category ? category.icon : 'fas fa-folder';
}

function updatePasswordStrength(password) {
    const strengthBar = document.querySelector('.password-strength-meter .strength-bar');
    const strengthText = document.getElementById('strength-text');
    
    if (!strengthBar || !strengthText) return;
    
    if (!password) {
        strengthBar.style.width = '0%';
        strengthBar.style.backgroundColor = 'transparent';
        strengthText.textContent = '-';
        return;
    }
    
    let strength = 0;
    
    // Length check
    if (password.length >= 12) strength += 2;
    else if (password.length >= 8) strength += 1;
    
    // Character variety
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    // Update UI
    let width, color, text;
    
    if (strength <= 2) {
        width = '25%';
        color = '#e74c3c';
        text = 'Weak';
    } else if (strength <= 4) {
        width = '50%';
        color = '#f39c12';
        text = 'Moderate';
    } else if (strength <= 6) {
        width = '75%';
        color = '#3498db';
        text = 'Strong';
    } else {
        width = '100%';
        color = '#2ecc71';
        text = 'Very Strong';
    }
    
    strengthBar.style.width = width;
    strengthBar.style.backgroundColor = color;
    strengthText.textContent = text;
}

function updateGeneratedPasswordStrength(password) {
    const strengthBar = document.querySelector('#password-generator-modal .strength-bar');
    const strengthText = document.getElementById('generated-strength-text');
    
    if (!strengthBar || !strengthText) return;
    
    let strength = 0;
    if (password.length >= 12) strength += 2;
    else if (password.length >= 8) strength += 1;
    
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    let width, color, text;
    
    if (strength <= 2) {
        width = '25%';
        color = '#e74c3c';
        text = 'Weak';
    } else if (strength <= 4) {
        width = '50%';
        color = '#f39c12';
        text = 'Moderate';
    } else if (strength <= 6) {
        width = '75%';
        color = '#3498db';
        text = 'Strong';
    } else {
        width = '100%';
        color = '#2ecc71';
        text = 'Very Strong';
    }
    
    strengthBar.style.width = width;
    strengthBar.style.backgroundColor = color;
    strengthText.textContent = text;
}

function updateSecurePasswordStrength(password, strengthTextId) {
    const strengthText = document.getElementById(strengthTextId);
    if (!strengthText) return;
    
    let strength = 0;
    if (password.length >= 12) strength += 2;
    else if (password.length >= 8) strength += 1;
    
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    let text;
    
    if (strength <= 2) {
        text = 'Weak';
    } else if (strength <= 4) {
        text = 'Moderate';
    } else if (strength <= 6) {
        text = 'Strong';
    } else {
        text = 'Very Strong';
    }
    
    strengthText.textContent = text;
}