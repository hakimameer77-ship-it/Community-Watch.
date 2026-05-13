const user = requireAuth();
if (!user || (user.role !== 'admin' && user.role !== 'authority')) {
    window.location.href = 'index.html';
}

document.getElementById('userName').textContent = user.name;
document.getElementById('userRole').textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);

// Show admin-only links
if (user.role === 'admin') {
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'block');
}

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
    
    if (pageName === 'overview') {
        loadOverview();
    } else if (pageName === 'reports') {
        loadAllReports();
    } else if (pageName === 'authorities') {
        loadAuthorities();
    } else if (pageName === 'map') {
        loadMap();
    } else if (pageName === 'analytics') {
        loadAnalytics();
    } else if (pageName === 'profile') {
        loadStaffProfile();
    }
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
}

function loadOverview() {
    const data = DB.getData();
    const reports = data.reports;
    
    let pending = 0, inProgress = 0, resolved = 0;
    
    reports.forEach(report => {
        const action = data.authorityActions.find(a => a.report_id === report.report_id);
        const status = action ? action.action_status : 'Pending';
        
        if (status === 'Pending') pending++;
        else if (status === 'In Progress') inProgress++;
        else if (status === 'Resolved') resolved++;
    });
    
    document.getElementById('totalReports').textContent = reports.length;
    document.getElementById('pendingReports').textContent = pending;
    document.getElementById('inProgressReports').textContent = inProgress;
    document.getElementById('resolvedReports').textContent = resolved;
    
    const recentReports = reports.slice(-5).reverse();
    const container = document.getElementById('recentReports');
    container.innerHTML = '<h2>Recent Reports</h2>' + recentReports.map(report => {
        const citizen = data.citizens.find(c => c.citizen_id === report.citizen_id);
        const incident = data.incidentTypes.find(i => i.incident_id === report.incident_id);
        const action = data.authorityActions.find(a => a.report_id === report.report_id);
        const status = action ? action.action_status : 'Pending';
        
        return `
            <div class="report-card">
                <div class="report-header">
                    <h3>${incident ? incident.incident_name : 'Unknown'}</h3>
                    <span class="badge badge-${status.toLowerCase().replace(' ', '-')}">${status}</span>
                </div>
                <p><strong>Reporter:</strong> ${citizen ? citizen.name : 'Unknown'}</p>
                <p><strong>Location:</strong> ${report.incident_location}</p>
                <p><strong>Date:</strong> ${report.date_reported}</p>
            </div>
        `;
    }).join('');
}

function loadAllReports() {
    const data = DB.getData();
    const container = document.getElementById('allReportsContainer');
    
    container.innerHTML = data.reports.map(report => {
        const citizen = data.citizens.find(c => c.citizen_id === report.citizen_id);
        const incident = data.incidentTypes.find(i => i.incident_id === report.incident_id);
        const action = data.authorityActions.find(a => a.report_id === report.report_id);
        const status = action ? action.action_status : 'Pending';
        
        return `
            <div class="report-card">
                <div class="report-header">
                    <h3>${incident ? incident.incident_name : 'Unknown'}</h3>
                    <span class="badge badge-${report.priority_level.toLowerCase()}">${report.priority_level}</span>
                    <span class="badge badge-${status.toLowerCase().replace(' ', '-')}">${status}</span>
                </div>
                <p><strong>Reporter:</strong> ${citizen ? citizen.name : 'Unknown'}</p>
                <p><strong>Location:</strong> ${report.incident_location}</p>
                <p><strong>Date:</strong> ${report.date_reported} ${report.time_reported}</p>
                <p><strong>Type:</strong> ${report.report_type}</p>
                ${action ? `<p><strong>Action:</strong> ${action.authority_desc}</p>` : ''}
                <div class="report-actions">
                    <button class="btn btn-small" onclick="takeAction('${report.report_id}')">Take Action</button>
                    ${user.role === 'admin' ? `<button class="btn btn-small btn-danger" onclick="deleteReport('${report.report_id}')">Delete</button>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function takeAction(reportId) {
    document.getElementById('actionReportId').value = reportId;
    
    const data = DB.getData();
    const action = data.authorityActions.find(a => a.report_id === reportId);
    
    if (action) {
        document.getElementById('actionDesc').value = action.authority_desc;
        document.getElementById('actionStatus').value = action.action_status;
    } else {
        document.getElementById('actionDesc').value = '';
        document.getElementById('actionStatus').value = 'Pending';
    }
    
    document.getElementById('actionModal').style.display = 'block';
}

document.getElementById('actionForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const reportId = document.getElementById('actionReportId').value;
    const desc = document.getElementById('actionDesc').value;
    const status = document.getElementById('actionStatus').value;
    
    const data = DB.getData();
    const actionIndex = data.authorityActions.findIndex(a => a.report_id === reportId);
    
    const actionData = {
        report_id: reportId,
        staff_id: user.staff_id,
        authority_desc: desc,
        action_date: new Date().toISOString().split('T')[0],
        action_status: status
    };
    
    if (actionIndex >= 0) {
        data.authorityActions[actionIndex] = actionData;
    } else {
        data.authorityActions.push(actionData);
    }
    
    DB.saveData(data);
    closeModal('actionModal');
    loadAllReports();
    loadOverview();
});

function deleteReport(reportId) {
    if (!confirm('Are you sure you want to delete this report?')) return;
    
    const data = DB.getData();
    data.reports = data.reports.filter(r => r.report_id !== reportId);
    data.authorityActions = data.authorityActions.filter(a => a.report_id !== reportId);
    DB.saveData(data);
    
    loadAllReports();
    loadOverview();
}

function loadAuthorities() {
    if (user.role !== 'admin') return;
    
    const data = DB.getData();
    const authorities = data.staff.filter(s => s.role === 'Authority');
    const container = document.getElementById('authoritiesContainer');
    
    container.innerHTML = authorities.map(auth => `
        <div class="authority-card">
            <h3>${auth.name}</h3>
            <p><strong>Email:</strong> ${auth.email}</p>
            <p><strong>Phone:</strong> ${auth.phoneNumber}</p>
            <p><strong>Department:</strong> ${auth.department || 'N/A'}</p>
            <p><strong>Position:</strong> ${auth.position || 'N/A'}</p>
            <div class="report-actions">
                <button class="btn btn-small btn-danger" onclick="deleteAuthority('${auth.staff_id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

function showAddAuthorityModal() {
    document.getElementById('addAuthorityModal').style.display = 'block';
}

document.getElementById('addAuthorityForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = document.getElementById('authName').value;
    const email = document.getElementById('authEmail').value;
    const phone = document.getElementById('authPhone').value;
    const dept = document.getElementById('authDept').value;
    const position = document.getElementById('authPosition').value;
    const password = document.getElementById('authPassword').value;
    
    const data = DB.getData();
    
    if (data.staff.find(s => s.email === email)) {
        document.getElementById('addAuthError').textContent = 'Email already exists';
        document.getElementById('addAuthError').style.display = 'block';
        return;
    }
    
    const validation = validatePassword(password);
    if (!validation.valid) {
        document.getElementById('addAuthError').textContent = validation.message;
        document.getElementById('addAuthError').style.display = 'block';
        return;
    }
    
    const newAuthority = {
        staff_id: DB.generateId('S'),
        name,
        email,
        phoneNumber: phone,
        password,
        department: dept,
        position,
        role: 'Authority'
    };
    
    data.staff.push(newAuthority);
    DB.saveData(data);
    
    closeModal('addAuthorityModal');
    document.getElementById('addAuthorityForm').reset();
    loadAuthorities();
});

function deleteAuthority(staffId) {
    if (!confirm('Are you sure you want to delete this authority?')) return;
    
    const data = DB.getData();
    data.staff = data.staff.filter(s => s.staff_id !== staffId);
    DB.saveData(data);
    
    loadAuthorities();
}

function loadMap() {
    const data = DB.getData();
    const locationCount = {};
    
    data.reports.forEach(report => {
        const loc = report.incident_location;
        locationCount[loc] = (locationCount[loc] || 0) + 1;
    });
    
    const hotspots = Object.entries(locationCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    const container = document.getElementById('staffHotspotList');
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

function loadAnalytics() {
    const data = DB.getData();
    
    const typeCount = {};
    const priorityCount = { Low: 0, Medium: 0, High: 0 };
    
    data.reports.forEach(report => {
        const incident = data.incidentTypes.find(i => i.incident_id === report.incident_id);
        const typeName = incident ? incident.incident_name : 'Unknown';
        typeCount[typeName] = (typeCount[typeName] || 0) + 1;
        priorityCount[report.priority_level]++;
    });
    
    const typeContainer = document.getElementById('typeChart');
    typeContainer.innerHTML = Object.entries(typeCount).map(([type, count]) => `
        <div class="chart-bar">
            <span class="chart-label">${type}</span>
            <div class="chart-bar-fill" style="width: ${(count / data.reports.length) * 100}%">${count}</div>
        </div>
    `).join('');
    
    const priorityContainer = document.getElementById('priorityChart');
    priorityContainer.innerHTML = Object.entries(priorityCount).map(([priority, count]) => `
        <div class="chart-bar">
            <span class="chart-label">${priority}</span>
            <div class="chart-bar-fill priority-${priority.toLowerCase()}" style="width: ${(count / data.reports.length) * 100}%">${count}</div>
        </div>
    `).join('');
}

function loadStaffProfile() {
    document.getElementById('staffName').value = user.name;
    document.getElementById('staffEmail').value = user.email;
    document.getElementById('staffRoleInput').value = user.role.charAt(0).toUpperCase() + user.role.slice(1);
    document.getElementById('staffPhone').value = user.phoneNumber;
    document.getElementById('staffDept').value = user.department || '';
    document.getElementById('staffPosition').value = user.position || '';
}

document.getElementById('staffProfileForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const data = DB.getData();
    const staffMember = data.staff.find(s => s.staff_id === user.staff_id);
    
    staffMember.phoneNumber = document.getElementById('staffPhone').value;
    staffMember.department = document.getElementById('staffDept').value;
    staffMember.position = document.getElementById('staffPosition').value;
    
    DB.saveData(data);
    
    user.phoneNumber = staffMember.phoneNumber;
    user.department = staffMember.department;
    user.position = staffMember.position;
    sessionStorage.setItem('currentUser', JSON.stringify(user));
    
    alert('Profile updated successfully!');
});

document.getElementById('staffPasswordForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const currentPassword = document.getElementById('staffCurrentPassword').value;
    const newPassword = document.getElementById('staffNewPassword').value;
    const confirmPassword = document.getElementById('staffConfirmPassword').value;
    
    const errorMsg = document.getElementById('staffPasswordError');
    const successMsg = document.getElementById('staffPasswordSuccess');
    
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
    
    if (newPassword !== confirmPassword) {
        errorMsg.textContent = 'Passwords do not match';
        errorMsg.style.display = 'block';
        return;
    }
    
    const data = DB.getData();
    const staffMember = data.staff.find(s => s.staff_id === user.staff_id);
    staffMember.password = newPassword;
    DB.saveData(data);
    
    user.password = newPassword;
    sessionStorage.setItem('currentUser', JSON.stringify(user));
    
    successMsg.textContent = 'Password changed successfully!';
    successMsg.style.display = 'block';
    document.getElementById('staffPasswordForm').reset();
});

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

loadOverview();
