// Mock Database - LocalStorage based
const DB = {
    init: function() {
        if (!localStorage.getItem('community_watch_db')) {
            const initialData = {
                citizens: [
                    {
                        citizen_id: 'C001',
                        name: 'Jane Doe',
                        ic: '920101-14-5678',
                        phoneNumber: '0123456789',
                        email: 'jane@example.com',
                        password: 'Password123!',
                        address: 'No 15, Jalan TTP 1/3, Taman Tambun Perdana 1, Durian Tunggal, Melaka'
                    },
                    {
                        citizen_id: 'C002',
                        name: 'John Smith',
                        ic: '850505-01-1234',
                        phoneNumber: '0198765432',
                        email: 'john@example.com',
                        password: 'Password123!',
                        address: 'No 28, Jalan TTP 1/7, Taman Tambun Perdana 1, Durian Tunggal, Melaka'
                    }
                ],
                staff: [
                    {
                        staff_id: 'S001',
                        name: 'Encik Ahmad (Ajk Kampung)',
                        phoneNumber: '0112233445',
                        email: 'ahmad@authority.gov',
                        password: 'Admin123!',
                        department: 'Kampung Safety',
                        position: 'Ajk Kampung',
                        role: 'Authority'
                    },
                    {
                        staff_id: 'S002',
                        name: 'Admin Sarah',
                        phoneNumber: '0198877665',
                        email: 'admin@authority.gov',
                        password: 'Admin123!',
                        department: 'System Administration',
                        position: 'System Administrator',
                        role: 'Admin'
                    },
                    {
                        staff_id: 'S003',
                        name: 'Cik Fatimah (Ajk Kampung)',
                        phoneNumber: '0134455667',
                        email: 'fatimah@authority.gov',
                        password: 'Admin123!',
                        department: 'Kampung Safety',
                        position: 'Ajk Kampung',
                        role: 'Authority'
                    }
                ],
                incidentTypes: [
                    { incident_id: 'I001', incident_name: 'Theft', incident_desc: 'Property theft or burglary' },
                    { incident_id: 'I002', incident_name: 'Vandalism', incident_desc: 'Property damage or graffiti' },
                    { incident_id: 'I003', incident_name: 'Suspicious Activity', incident_desc: 'Unusual or concerning behavior' },
                    { incident_id: 'I004', incident_name: 'Assault', incident_desc: 'Physical violence or threat' },
                    { incident_id: 'I005', incident_name: 'Burglary', incident_desc: 'Breaking and entering' },
                    { incident_id: 'I006', incident_name: 'Drug Activity', incident_desc: 'Suspected drug-related incidents' },
                    { incident_id: 'I007', incident_name: 'Others', incident_desc: 'Other incidents not listed' }
                ],
                reports: [
                    {
                        report_id: 'R001',
                        citizen_id: 'C001',
                        incident_id: 'I001',
                        incident_location: 'Jalan TTP 1/3, Taman Tambun Perdana 1, Durian Tunggal',
                        date_reported: '2026-05-09',
                        time_reported: '14:30:00',
                        longitude: 102.2531,
                        latitude: 2.2977,
                        priority_level: 'High',
                        report_type: 'Report Crime/Incident'
                    },
                    {
                        report_id: 'R002',
                        citizen_id: 'C002',
                        incident_id: 'I002',
                        incident_location: 'Jalan TTP 1/7, Taman Tambun Perdana 1, Durian Tunggal',
                        date_reported: '2026-05-10',
                        time_reported: '09:15:00',
                        longitude: 102.2545,
                        latitude: 2.2985,
                        priority_level: 'Medium',
                        report_type: 'Watch Your House'
                    }
                ],
                authorityActions: [
                    {
                        report_id: 'R001',
                        staff_id: 'S001',
                        authority_desc: 'Report received. Investigation started.',
                        action_date: '2026-05-09',
                        action_status: 'In Progress'
                    }
                ],
                reportResolutions: []
            };
            localStorage.setItem('community_watch_db', JSON.stringify(initialData));
        }
    },

    getData: function() {
        return JSON.parse(localStorage.getItem('community_watch_db'));
    },

    saveData: function(data) {
        localStorage.setItem('community_watch_db', JSON.stringify(data));
    },

    generateId: function(prefix) {
        const data = this.getData();
        const key = prefix === 'C' ? 'citizens' : prefix === 'S' ? 'staff' : 'reports';
        const items = data[key] || [];
        const maxId = items.reduce((max, item) => {
            const num = parseInt(item[`${prefix === 'C' ? 'citizen' : prefix === 'S' ? 'staff' : 'report'}_id`].substring(1));
            return Math.max(max, num);
        }, 0);
        return `${prefix}${String(maxId + 1).padStart(3, '0')}`;
    }
};

// Initialize database on load
DB.init();
