const user = requireAuth();
if (!user || user.role !== 'citizen') {
    window.location.href = 'index.html';
}

// Initialize page
document.getElementById('userName').textContent = user.name;
document.getElementById('welcomeName').textContent = user.name;

// Navigation
document.querySelectorAll('.nav-link[data-page]').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = e.target.dataset.page;
        showPage(page);
    });
});

function showPage(pageName) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    
    document.getElementById(`page-${pageName}`).classList.add('active');
    document.querySelector(`[data-page="${pageName}"]`).classList.add('active');
    
    if (pageName === 'my-reports') {
        loadMyReports();
    } else if (pageName === 'incident-map') {
        loadIncidentMap();
    } else if (pageName === 'profile') {
        loadProfile();
    }
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
}

// Load incident types
const data = DB.getData();
const incidentSelect = document.getElementById('incidentType');
data.incidentTypes.forEach(type => {
    const option = document.createElement('option');
    option.value = type.incident_id;
    option.textContent = type.incident_name;
    incidentSelect.appendChild(option);
});

incidentSelect.addEventListener('change', (e) => {
    const customGroup = document.getElementById('customIncidentGroup');
    if (e.target.selectedOptions[0].text === 'Others') {
        customGroup.style.display = 'block';
        document.getElementById('customIncidentName').required = true;
    } else {
        customGroup.style.display = 'none';
        document.getElementById('customIncidentName').required = false;
    }
});

// Report form submission
document.getElementById('reportForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const data = DB.getData();
    const reportType = document.getElementById('reportType').value;
    const incidentId = document.getElementById('incidentType').value;
    const location = document.getElementById('location').value;
    const description = document.getElementById('description').value;
    
    const newReport = {
        report_id: DB.generateId('R'),
        citizen_id: user.citizen_id,
        incident_id: incidentId,
        incident_location: location,
        date_reported: new Date().toISOString().split('T')[0],
        time_reported: new Date().toTimeString().split(' ')[0],
        longitude: 102.25 + Math.random() * 0.01,
        latitude: 2.29 + Math.random() * 0.01,
        priority_level: 'Medium',
        report_type: reportType
    };
    
    data.reports.push(newReport);
    DB.saveData(data);
    
    document.getElementById('reportSuccess').textContent = 'Report submitted successfully!';
    document.getElementById('reportSuccess').style.display = 'block';
    document.getElementById('reportForm').reset();
    
    setTimeout(() => {
        document.getElementById('reportSuccess').style.display = 'none';
    }, 3000);
    
    updateStats();
});

// Load statistics
function updateStats() {
    const data = DB.getData();
    const myReports = data.reports.filter(r => r.citizen_id === user.citizen_id);
    
    let pending = 0, inProgress = 0, resolved = 0;
    
    myReports.forEach(report => {
        const action = data.authorityActions.find(a => a.report_id === report.report_id);
        const status = action ? action.action_status : 'Pending';
        
        if (status === 'Pending') pending++;
        else if (status === 'In Progress') inProgress++;
        else if (status === 'Resolved') resolved++;
    });
    
    document.getElementById('pendingCount').textContent = pending;
    document.getElementById('inProgressCount').textContent = inProgress;
    document.getElementById('resolvedCount').textContent = resolved;
}

function loadMyReports() {
    const data = DB.getData();
    const myReports = data.reports.filter(r => r.citizen_id === user.citizen_id);
    const container = document.getElementById('reportsContainer');
    
    if (myReports.length === 0) {
        container.innerHTML = '<p>No reports found.</p>';
        return;
    }
    
    container.innerHTML = myReports.map(report => {
        const incident = data.incidentTypes.find(i => i.incident_id === report.incident_id);
        const action = data.authorityActions.find(a => a.report_id === report.report_id);
        const status = action ? action.action_status : 'Pending';
        
        return `
            <div class="report-card">
                <div class="report-header">
                    <h3>${incident ? incident.incident_name : 'Unknown'}</h3>
                    <span class="badge badge-${status.toLowerCase().replace(' ', '-')}">${status}</span>
                </div>
                <p><strong>Location:</strong> ${report.incident_location}</p>
                <p><strong>Date:</strong> ${report.date_reported} ${report.time_reported}</p>
                <p><strong>Priority:</strong> ${report.priority_level}</p>
                <p><strong>Type:</strong> ${report.report_type}</p>
                ${action ? `<p><strong>Action:</strong> ${action.authority_desc}</p>` : ''}
            </div>
        `;
    }).join('');
}

function loadIncidentMap() {
    const data = DB.getData();
    const locationCount = {};
    
    data.reports.forEach(report => {
        const loc = report.incident_location;
        locationCount[loc] = (locationCount[loc] || 0) + 1;
    });
    
    const hotspots = Object.entries(locationCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    const container = document.getElementById('hotspotList');
    container.innerHTML = '<h3>Top 5 Hotspots</h3>' + hotspots.map(([location, count]) => {
        const color = count >= 3 ? 'red' : count >= 2 ? 'orange' : 'yellow';
        return `
            <div class="hotspot-item">
                <span class="hotspot-marker" style="background: ${color};">${count}</span>
                <span>${location}</span>
            </div>
        `;
    }).join('');
}

function loadProfile() {
    document.getElementById('profileName').value = user.name;
    document.getElementById('profileIC').value = user.ic;
    document.getElementById('profileEmail').value = user.email;
    document.getElementById('profilePhone').value = user.phoneNumber;
    document.getElementById('profileAddress').value = user.address;
}

document.getElementById('profileForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const data = DB.getData();
    const citizen = data.citizens.find(c => c.citizen_id === user.citizen_id);
    
    citizen.phoneNumber = document.getElementById('profilePhone').value;
    citizen.address = document.getElementById('profileAddress').value;
    
    DB.saveData(data);
    
    user.phoneNumber = citizen.phoneNumber;
    user.address = citizen.address;
    sessionStorage.setItem('currentUser', JSON.stringify(user));
    
    alert('Profile updated successfully!');
});

document.getElementById('passwordForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;
    
    const errorMsg = document.getElementById('passwordError');
    const successMsg = document.getElementById('passwordSuccess');
    
    errorMsg.style.display = 'none';
    successMsg.style.display = 'none';
    
    if (currentPassword !== user.password) {
        errorMsg.textContent = 'Current password is incorrect';
        errorMsg.style.display = 'block';
        return;
    }
    
    const validation = validatePassword(newPassword);
    if (!validation.valid) {
        errorMsg.textContent = validation.message;
        errorMsg.style.display = 'block';
        return;
    }
    
    if (newPassword !== confirmNewPassword) {
        errorMsg.textContent = 'Passwords do not match';
        errorMsg.style.display = 'block';
        return;
    }
    
    const data = DB.getData();
    const citizen = data.citizens.find(c => c.citizen_id === user.citizen_id);
    citizen.password = newPassword;
    DB.saveData(data);
    
    user.password = newPassword;
    sessionStorage.setItem('currentUser', JSON.stringify(user));
    
    successMsg.textContent = 'Password changed successfully!';
    successMsg.style.display = 'block';
    document.getElementById('passwordForm').reset();
});

updateStats();
