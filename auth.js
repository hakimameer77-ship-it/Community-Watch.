// Authentication and session management
function login(email, password, userType) {
    const data = DB.getData();
    
    if (userType === 'citizen') {
        const citizen = data.citizens.find(c => c.email === email && c.password === password);
        if (citizen) {
            sessionStorage.setItem('currentUser', JSON.stringify({
                id: citizen.citizen_id,
                email: citizen.email,
                name: citizen.name,
                role: 'citizen',
                ...citizen
            }));
            return { success: true, user: { role: 'citizen' } };
        }
    } else {
        const staffMember = data.staff.find(s => s.email === email && s.password === password);
        if (staffMember) {
            sessionStorage.setItem('currentUser', JSON.stringify({
                id: staffMember.staff_id,
                email: staffMember.email,
                name: staffMember.name,
                role: staffMember.role.toLowerCase(),
                ...staffMember
            }));
            return { success: true, user: { role: staffMember.role.toLowerCase() } };
        }
    }
    
    return { success: false, message: 'Invalid email or password' };
}

function register(email, password, name, ic, phone, address) {
    const data = DB.getData();
    
    // Check if email already exists
    if (data.citizens.find(c => c.email === email)) {
        return { success: false, message: 'Email already registered' };
    }
    
    // Check if IC already exists
    if (data.citizens.find(c => c.ic === ic)) {
        return { success: false, message: 'IC number already registered' };
    }
    
    // Check if phone already exists
    if (data.citizens.find(c => c.phoneNumber === phone)) {
        return { success: false, message: 'Phone number already registered' };
    }
    
    // Create new citizen
    const newCitizen = {
        citizen_id: DB.generateId('C'),
        name,
        ic,
        phoneNumber: phone,
        email,
        password,
        address
    };
    
    data.citizens.push(newCitizen);
    DB.saveData(data);
    
    return { success: true };
}

function logout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

function getCurrentUser() {
    const userStr = sessionStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
}

function requireAuth() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'index.html';
        return null;
    }
    return user;
}
