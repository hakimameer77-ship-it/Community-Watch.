// Validation functions
function validatePassword(password) {
    if (password.length < 8) {
        return { valid: false, message: 'Password must be at least 8 characters long' };
    }
    if (!/[A-Z]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one uppercase letter' };
    }
    if (!/[a-z]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one lowercase letter' };
    }
    if (!/[0-9]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one number' };
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one special character' };
    }
    return { valid: true, message: 'Strong password' };
}

function validateIC(ic) {
    const icPattern = /^\d{6}-\d{2}-\d{4}$/;
    return icPattern.test(ic);
}

function validatePhoneNumber(phone) {
    const phonePattern = /^01\d{8,9}$/;
    const formattedPhone = phone.replace(/-/g, '').replace(/\s/g, '');
    return phonePattern.test(formattedPhone);
}

function validateEmail(email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
}
