// ตั้งค่า Redmine URL และ API Key ของคุณ
const REDMINE_URL = 'http://localhost:3001/redmine-api/redmine'; // แก้ไข URL ให้รวม /redmine
const API_KEY = '927d2943f53b5a05d7abb4f7ad6dee71c7e17fe3';
const headers = {
    'Content-Type': 'application/json',
    'X-Redmine-API-Key': API_KEY
};

// Constants for localStorage
const STORAGE_KEYS = {
    STATUSES: 'redmine_statuses',
    THEME: 'redmine_theme',
    USER: 'redmine_user'
};

// DOM Elements
const taskListSection = document.getElementById('taskList');
const taskDetailSection = document.getElementById('taskDetail');
const tasksContainer = document.getElementById('tasksContainer');
const taskForm = document.getElementById('taskForm');
const taskIdInput = document.getElementById('taskId');
const subjectInput = document.getElementById('subject');
const descriptionInput = document.getElementById('description');
const statusSelect = document.getElementById('status');
const btnSaveTask = document.getElementById('btnSaveTask');
const btnCancel = document.getElementById('btnCancel');
const btnBackToList = document.getElementById('btnBackToList');
const themeToggle = document.getElementById('themeToggle');
const themeIcon = themeToggle.querySelector('.theme-icon');
const logoutButton = document.getElementById('logoutButton');
const googdocForm = document.getElementById('googdocForm');
const statusFilterCollapse = document.getElementById('statusFilterCollapse');
const filterContent = document.querySelector('.filter-content');
const selectedStatuses = document.querySelector('.selected-statuses');
const loadingOverlay = document.getElementById('loadingOverlay');

const detailId = document.getElementById('detailId');
const detailSubject = document.getElementById('detailSubject');
const detailStatus = document.getElementById('detailStatus');
const detailProject = document.getElementById('detailProject');
const detailAssignedTo = document.getElementById('detailAssignedTo');
const detailDescription = document.getElementById('detailDescription');
const detailCreatedOn = document.getElementById('detailCreatedOn');
const detailUpdatedOn = document.getElementById('detailUpdatedOn');
const taskDetailsContainer = document.getElementById('taskDetailsContainer');

const notification = document.getElementById('notification');

let isEditMode = false; // Flag to check if we are editing or creating

// เพิ่ม DOM Element สำหรับ status filter
const statusFilter = document.getElementById('statusFilter');

const sizeSelect = document.getElementById('size');

// Log Time functionality
const monthFilter = document.getElementById('monthFilter');
const btnRefreshLogTime = document.getElementById('btnRefreshLogTime');
const logTimeContainer = document.getElementById('logTimeContainer');

// Theme Functions
function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
}

// Initialize theme from localStorage or default to light
const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
setTheme(savedTheme);

// Add theme toggle event listener
themeToggle.addEventListener('click', toggleTheme);

// Check login status
function checkLogin() {
    const user = localStorage.getItem(STORAGE_KEYS.USER);
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    return JSON.parse(user);
}

// Logout function
function logout() {
    localStorage.removeItem(STORAGE_KEYS.USER);
    window.location.href = 'login.html';
}

// Get user credentials for API calls
function getAuthHeaders() {
    const user = checkLogin();
    return {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(user.username + ':' + user.password)
    };
}

// Loading state management
function showLoading() {
    loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
    loadingOverlay.classList.add('hidden');
}

// --- Helper Functions ---

function showNotification(message, duration = 3000) {
    notification.textContent = message;
    notification.classList.remove('notification-hidden');
    setTimeout(() => {
        notification.classList.add('notification-hidden');
    }, duration);
}

function showSection(sectionToShow) {
    taskListSection.classList.add('hidden');
    taskDetailSection.classList.add('hidden');
    sectionToShow.classList.remove('hidden');
    sectionToShow.classList.add('active'); // Add active class if needed for styling
}

function clearForm() {
    taskIdInput.value = '';
    statusSelect.value = '';
    sizeSelect.value = '';
}

// --- API Calls ---

async function fetchRedmine(endpoint, options = {}) {
    showLoading();
    try {
        const response = await fetch(`${REDMINE_URL}${endpoint}`, { 
            headers: getAuthHeaders(),
            ...options 
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        console.log(response);
        // check if method is PUT return  true
        if (options.method === 'PUT') {
            return true;
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching from Redmine:', error);
        showNotification(`เกิดข้อผิดพลาด: ${error.message}`, 5000);
        throw error;
    } finally {
        hideLoading();
    }
}

async function loadTasks() {
    tasksContainer.innerHTML = '<p>กำลังโหลดงาน...</p>';
    try {
        // รวบรวม status_id ที่เลือกทั้งหมด
        const selectedStatuses = Array.from(statusFilter.selectedOptions).map(option => option.value);
        
        // สร้าง query parameter
        const queryParams = selectedStatuses.length > 0 
            ? `?status_id=${selectedStatuses.join('|')}` 
            : '';
            
        const data = await fetchRedmine(`/issues.json${queryParams}`);
        displayTasks(data.issues);
    } catch (error) {
        tasksContainer.innerHTML = '<p>ไม่สามารถโหลดรายการงานได้ กรุณาลองใหม่อีกครั้ง</p>';
    }
}

async function loadTaskDetail(id) {
    try {
        const data = await fetchRedmine(`/issues/${id}.json?include=attachments,relations,journals`);
        displayTaskDetail(data.issue);
    } catch (error) {
        showNotification(`ไม่สามารถโหลดรายละเอียดงาน ID: ${id} ได้`, 5000);
        showSection(taskListSection);
    }
}

async function loadStatuses() {
    try {
        // Check if statuses are already in localStorage
        const storedStatuses = localStorage.getItem(STORAGE_KEYS.STATUSES);
        if (storedStatuses) {
            const statuses = JSON.parse(storedStatuses);
            populateStatusSelect(statuses);
            return;
        }

        // If not in localStorage, fetch from API
        const data = await fetchRedmine('/issue_statuses.json');
        // Store in localStorage
        localStorage.setItem(STORAGE_KEYS.STATUSES, JSON.stringify(data.issue_statuses));
        populateStatusSelect(data.issue_statuses);
    } catch (error) {
        console.error('Error loading statuses:', error);
    }
}

function populateStatusSelect(statuses) {
    statusSelect.innerHTML = '<option value="">เลือกสถานะ</option>';
    statuses.forEach(status => {
        const option = document.createElement('option');
        option.value = status.id;
        option.textContent = status.name;
        statusSelect.appendChild(option);
    });
}

async function saveTask(event) {
    event.preventDefault(); // Prevent default form submission

    const taskId = taskIdInput.value;
    const statusId = statusSelect.value;
    const sizeValue = sizeSelect.value;
    const customFields = [
        { id: 122, value: sizeValue }
    ];
    const taskData = {
        issue: {
            status_id: statusId || undefined,
            custom_fields: customFields
        }
    };

    try {
        let responseData;
        if (isEditMode && taskId) {
            // Update existing task
            responseData = await fetchRedmine(`/issues/${taskId}.json`, {
                method: 'PUT',
                body: JSON.stringify(taskData)
            });
            showNotification('อัปเดตงานเรียบร้อยแล้ว!');
            
            // Show Google Form and issue details if status is Integrate test (ID 11)
            if (statusId === '11') {
               
                document.getElementById('googdocForm').classList.remove('hidden');
                taskDetailsContainer.classList.remove('hidden');
                // Load and display task details
                const data = await fetchRedmine(`/issues/${taskId}.json`);
                displayTaskDetail(data.issue);
            } else {
                taskForm.classList.add('hidden');
                showSection(taskListSection);
                loadTasks();
            }
        } else {
            // Create new task
            responseData = await fetchRedmine('/issues.json', {
                method: 'POST',
                body: JSON.stringify(taskData)
            });
            showNotification('สร้างงานใหม่เรียบร้อยแล้ว!');
            
            // Show Google Form and issue details if status is Integrate test (ID 11)
            if (statusId === '11') {
                taskForm.classList.add('hidden');
                document.getElementById('googdocForm').classList.remove('hidden');
                taskDetailsContainer.classList.remove('hidden');
                // Load and display task details
                const data = await fetchRedmine(`/issues/${responseData.issue.id}.json`);
                displayTaskDetail(data.issue);
            } else {
                showSection(taskListSection);
                loadTasks();
            }
        }
        showSection(taskDetailSection);
    } catch (error) {
        showNotification(`เกิดข้อผิดพลาดในการบันทึกงาน: ${error.message}`, 5000);
    }
}

// --- Display Functions ---

function displayTasks(issues) {
    if (issues.length === 0) {
        tasksContainer.innerHTML = '<p>ไม่พบรายการงาน</p>';
        return;
    }

    tasksContainer.innerHTML = ''; // Clear loading message
    issues.forEach(issue => {
        const taskCard = document.createElement('div');
        taskCard.classList.add('task-card');
        
        // Check start_date status
        let dateStatus = '';
        if (issue.start_date) {
            const startDate = new Date(issue.start_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            startDate.setHours(0, 0, 0, 0);

            if (startDate.getTime() === today.getTime()) {
                dateStatus = 'today';
            } else if (startDate > today) {
                dateStatus = 'future';
            } else {
                dateStatus = 'past';
            }
        }
        
        if (dateStatus) {
            taskCard.classList.add(`${dateStatus}-task`);
        }
        
        taskCard.dataset.id = issue.id;
        taskCard.innerHTML = `
            <div class="task-card-info">
                <h3>${issue.subject} (ID: ${issue.id})</h3>
                <p>สถานะ: ${issue.status.name}</p>
                <p>โปรเจกต์: ${issue.project.name}</p>
                <p>ผู้รับผิดชอบ: ${issue.assigned_to ? issue.assigned_to.name : 'ไม่ได้ระบุ'}</p>
                <p class="start-date ${dateStatus}">วันที่เริ่ม: ${issue.start_date || 'ไม่ระบุ'}</p>
            </div>
            <div class="task-details">
                <div class="task-details-loading">กำลังโหลดข้อมูล...</div>
            </div>
        `;

        // Add click event to toggle details
        taskCard.addEventListener('click', async (e) => {
            // Don't toggle if clicking edit button
            if (e.target.classList.contains('btn-edit')) {
                return;
            }
            
            // Close other expanded cards
            const expandedCards = tasksContainer.querySelectorAll('.task-card.expanded');
            expandedCards.forEach(card => {
                if (card !== taskCard) {
                    card.classList.remove('expanded');
                }
            });

            // Toggle current card
            const isExpanding = !taskCard.classList.contains('expanded');
            taskCard.classList.toggle('expanded');

            // Fetch and display details only when expanding
            if (isExpanding) {
                const taskId = taskCard.dataset.id;
                try {
                    const data = await fetchRedmine(`/issues/${taskId}.json`);
                    const issue = data.issue;
                    const detailsContainer = taskCard.querySelector('.task-details');

                    // Format custom fields for display
                    const customFieldsHtml = issue.custom_fields
                        .filter(field => field.value && field.value.length > 0)
                        .map(field => `
                            <div class="task-details-item">
                                <strong>${field.name}</strong>
                                ${Array.isArray(field.value) ? field.value.join(', ') : field.value}
                            </div>
                        `).join('');

                    detailsContainer.innerHTML = `
                        <div class="task-details-grid">
                            <div class="task-details-item">
                                <strong>Tracker</strong>
                                ${issue.tracker.name}
                            </div>
                            <div class="task-details-item">
                                <strong>สถานะ</strong>
                                ${issue.status.name}
                            </div>
                            <div class="task-details-item">
                                <strong>ความสำคัญ</strong>
                                ${issue.priority.name}
                            </div>
                            <div class="task-details-item">
                                <strong>โปรเจกต์</strong>
                                ${issue.project.name}
                            </div>
                            <div class="task-details-item">
                                <strong>ผู้สร้าง</strong>
                                ${issue.author.name}
                            </div>
                            <div class="task-details-item">
                                <strong>ผู้รับผิดชอบ</strong>
                                ${issue.assigned_to ? issue.assigned_to.name : 'ไม่ได้ระบุ'}
                            </div>
                            <div class="task-details-item">
                                <strong>วันที่เริ่ม</strong>
                                ${issue.start_date || 'ไม่ระบุ'}
                            </div>
                            <div class="task-details-item">
                                <strong>ความคืบหน้า</strong>
                                ${issue.done_ratio}%
                            </div>
                            <div class="task-details-item">
                                <strong>เวลาที่ใช้</strong>
                                ${issue.spent_hours} ชั่วโมง
                            </div>
                            <div class="task-details-item">
                                <strong>สร้างเมื่อ</strong>
                                ${new Date(issue.created_on).toLocaleString()}
                            </div>
                            <div class="task-details-item">
                                <strong>อัปเดตเมื่อ</strong>
                                ${new Date(issue.updated_on).toLocaleString()}
                            </div>
                        </div>
                        ${customFieldsHtml ? `
                            <div class="custom-fields-section">
                                <h4>ข้อมูลเพิ่มเติม</h4>
                                <div class="task-details-grid">
                                    ${customFieldsHtml}
                                </div>
                            </div>
                        ` : ''}
                        ${issue.description ? `
                            <div class="task-details-description">
                                <strong>คำอธิบาย</strong>
                                <p>${issue.description}</p>
                            </div>
                        ` : ''}
                        <div class="task-actions">
                            <button onclick="editTask(${issue.id})" class="btn-edit">แก้ไข</button>
                        </div>
                    `;
                } catch (error) {
                    const detailsContainer = taskCard.querySelector('.task-details');
                    detailsContainer.innerHTML = `
                        <div class="task-details-error">
                            เกิดข้อผิดพลาดในการโหลดข้อมูล กรุณาลองใหม่อีกครั้ง
                        </div>
                    `;
                }
            }
        });

        tasksContainer.appendChild(taskCard);
    });
}

function displayTaskDetail(issue) {
    taskForm.classList.add('hidden'); // Hide form

    detailId.textContent = issue.id;
    detailSubject.textContent = issue.subject;
    detailStatus.textContent = issue.status ? issue.status.name : 'N/A';
    detailProject.textContent = issue.project ? issue.project.name : 'N/A';
    detailAssignedTo.textContent = issue.assigned_to ? issue.assigned_to.name : 'ไม่ได้ระบุ';
    detailDescription.textContent = issue.description || 'ไม่มีคำอธิบาย';
    detailCreatedOn.textContent = new Date(issue.created_on).toLocaleString();
    detailUpdatedOn.textContent = new Date(issue.updated_on).toLocaleString();

    isEditMode = false; // Reset edit mode flag
}

function populateFormForEdit(issue) {
    taskIdInput.value = issue.id;
    // Set selected value for status to current status
    console.log('populateFormForEdit' ,issue.status);
    if (issue.status) {
        statusSelect.value = issue.status.id;
    } else {
        statusSelect.value = '';
    }
    // Set selected value for size (custom field id 122)
    const sizeField = issue.custom_fields ? issue.custom_fields.find(f => f.id === 122) : null;
    if (sizeField && sizeSelect.querySelector(`option[value="${sizeField.value}"]`)) {
        sizeSelect.value = sizeField.value;
    } else {
        sizeSelect.value = '';
    }
}

// --- Event Listeners ---

btnSaveTask.addEventListener('click', saveTask);

btnCancel.addEventListener('click', () => {
    if (isEditMode) { // If was editing, go back to detail view
        showSection(taskDetailSection);
        taskForm.classList.add('hidden');
    } else { // If was creating, go back to list view
        showSection(taskListSection);
    }
    clearForm(); // Clear form just in case
});

btnBackToList.addEventListener('click', () => {
    showSection(taskListSection);
    googdocForm.classList.add('hidden');
    taskDetailsContainer.classList.add('hidden');
    loadTasks(); // Reload tasks to see any changes
});

// เพิ่ม Event Listener สำหรับ status filter
statusFilter.addEventListener('change', () => {
    loadTasks();
});

// Add logout button click handler
logoutButton.addEventListener('click', logout);

// Add collapse/expand functionality for status filter
statusFilterCollapse.addEventListener('click', () => {
    statusFilterCollapse.classList.toggle('collapsed');
    filterContent.classList.toggle('collapsed');
    updateSelectedStatusesText();
});

// Function to update selected statuses text
function updateSelectedStatusesText() {
    const selectedOptions = Array.from(statusFilter.selectedOptions);
    if (selectedOptions.length > 0) {
        const statusNames = selectedOptions.map(option => option.textContent);
        selectedStatuses.textContent = `(${statusNames.join(', ')})`;
    } else {
        selectedStatuses.textContent = '(All)';
    }
}

// --- Initial Load ---
document.addEventListener('DOMContentLoaded', async () => {
    // Load statuses first
    await loadStatuses();
    
    // Set default selected values for status filter
    const defaultStatuses = ['10', '3', '6']; // Assigned and Develop and reprogramming
    defaultStatuses.forEach(statusId => {
        const option = statusFilter.querySelector(`option[value="${statusId}"]`);
        if (option) {
            option.selected = true;
        }
    });
    
    // Update selected statuses text
    updateSelectedStatusesText();
    
    // Then load tasks
    loadTasks();
});

// Add function to handle edit button click
function editTask(id) {
    isEditMode = true;
    if (!id) return;
    console.log('editTask' ,id);
    try {
        fetchRedmine(`/issues/${id}.json`)
            .then(data => {
                populateFormForEdit(data.issue);
                taskForm.classList.remove('hidden');
                googdocForm.classList.add('hidden');
                taskDetailsContainer.classList.add('hidden');
                showSection(taskDetailSection);
                // Load dropdowns if not already loaded
                //loadStatuses();
            })
            .catch(error => {
                console.log(error);
                showNotification(`ไม่สามารถดึงข้อมูลสำหรับแก้ไขงาน ID: ${id} ได้`, 5000);
            });
    } catch (error) {
        console.log(error);
        showNotification(`ไม่สามารถดึงข้อมูลสำหรับแก้ไขงาน ID: ${id} ได้`, 5000);
    }
}

// Add menu navigation functionality
document.querySelectorAll('.menu-item a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetSection = e.currentTarget.dataset.section;
        
        // Update active menu item
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });
        e.currentTarget.parentElement.classList.add('active');
        
        // Show target section
        document.querySelectorAll('main section').forEach(section => {
            section.classList.add('hidden');
        });
        document.getElementById(targetSection).classList.remove('hidden');
    });
});

// Populate month filter
function populateMonthFilter() {
    const months = [
        { value: '01', label: 'มกราคม' },
        { value: '02', label: 'กุมภาพันธ์' },
        { value: '03', label: 'มีนาคม' },
        { value: '04', label: 'เมษายน' },
        { value: '05', label: 'พฤษภาคม' },
        { value: '06', label: 'มิถุนายน' },
        { value: '07', label: 'กรกฎาคม' },
        { value: '08', label: 'สิงหาคม' },
        { value: '09', label: 'กันยายน' },
        { value: '10', label: 'ตุลาคม' },
        { value: '11', label: 'พฤศจิกายน' },
        { value: '12', label: 'ธันวาคม' }
    ];

    months.forEach(month => {
        const option = document.createElement('option');
        option.value = month.value;
        option.textContent = month.label;
        monthFilter.appendChild(option);
    });

    // Set current month as default
    const currentMonth = new Date().toLocaleString('th-TH', { month: '2-digit' });
    monthFilter.value = currentMonth;
}

// Group issues by start date
function groupIssuesByDate(issues) {
    const groups = {};
    issues.forEach(issue => {
        if (issue.start_date) {
            const date = new Date(issue.start_date);
            // Format date as YYYY-MM-DD for consistent sorting
            const formattedDate = date.toISOString().split('T')[0];
            if (!groups[formattedDate]) {
                groups[formattedDate] = [];
            }
            groups[formattedDate].push(issue);
        }
    });
    return groups;
}

// Calculate total hours for issues
function calculateTotalHours(issues) {
    return issues.reduce((total, issue) => total + (issue.spent_hours || 0), 0);
}

// Display log time data
function displayLogTime(issues) {
    const selectedMonth = monthFilter.value;
    const groups = groupIssuesByDate(issues);
    let totalHours = 0;
    let totalIssues = 0;

    logTimeContainer.innerHTML = '';

    // Create summary section
    const summarySection = document.createElement('div');
    summarySection.className = 'log-time-summary';
    summarySection.innerHTML = `
        <h3>สรุป</h3>
        <div class="log-time-summary-grid">
            <div class="log-time-summary-item">
                <strong>จำนวนงานทั้งหมด</strong>
                <span id="totalIssues">0</span>
            </div>
            <div class="log-time-summary-item">
                <strong>เวลาทั้งหมด</strong>
                <span id="totalHours">0</span> ชั่วโมง
            </div>
        </div>
    `;
    logTimeContainer.appendChild(summarySection);

    // Create groups
    Object.entries(groups)
        .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA))
        .forEach(([date, issues]) => {
            // Convert date to Date object for proper comparison
            const issueDate = new Date(date);
            const issueMonth = issueDate.getMonth() + 1; // JavaScript months are 0-based
            const formattedMonth = issueMonth.toString().padStart(2, '0');
            
            // Filter by selected month if specified
            if (selectedMonth && formattedMonth !== selectedMonth) {
                return;
            }

            const groupDiv = document.createElement('div');
            groupDiv.className = 'log-time-group';
            groupDiv.innerHTML = `
                <div class="log-time-date">${date}</div>
                <div class="log-time-issues">
                    ${issues.map(issue => `
                        <div class="log-time-issue">
                            <div class="log-time-issue-id">#${issue.id}</div>
                            <div class="log-time-issue-subject">${issue.subject}</div>
                            <div class="log-time-issue-status">${issue.status.name}</div>
                            <div class="log-time-issue-hours">${issue.spent_hours || 0} ชม.</div>
                        </div>
                    `).join('')}
                </div>
            `;
            logTimeContainer.appendChild(groupDiv);

            totalHours += calculateTotalHours(issues);
            totalIssues += issues.length;
        });

    // Update summary
    document.getElementById('totalIssues').textContent = totalIssues;
    document.getElementById('totalHours').textContent = totalHours.toFixed(1);
}

// Load log time data
async function loadLogTime() {
    logTimeContainer.innerHTML = '<p>กำลังโหลดข้อมูล...</p>';
    try {
        let query = '/issues.json?limit=100&set_filter=1&f[]=start_date';
        const selectedMonth = monthFilter.value;
        const year = new Date().getFullYear();
        if (selectedMonth) {
            // Calculate first and last day of the selected month
            const start = `${year}-${selectedMonth}-01`;
            const endDate = new Date(year, parseInt(selectedMonth), 0); // last day of month
            const end = `${year}-${selectedMonth}-${endDate.getDate().toString().padStart(2, '0')}`;
            query += `&op[start_date]=%3E%3C&v[start_date][]=${start}&v[start_date][]=${end}`;
        } else {
            query += '&op[start_date]=!*';
        }
        const data = await fetchRedmine(query);
        displayLogTime(data.issues);
    } catch (error) {
        logTimeContainer.innerHTML = '<p>ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง</p>';
        console.error('Error loading log time data:', error);
    }
}

// Event listeners for log time
monthFilter.addEventListener('change', () => {
    loadLogTime();
});

btnRefreshLogTime.addEventListener('click', () => {
    loadLogTime();
});

// Initialize month filter when page loads
document.addEventListener('DOMContentLoaded', () => {
    populateMonthFilter();
    // ... existing initialization code ...
});