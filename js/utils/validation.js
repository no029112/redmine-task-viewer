// Validation utility functions
export const validators = {
    required: (value) => {
        if (value === undefined || value === null || value === '') {
            return 'This field is required';
        }
        return null;
    },

    minLength: (min) => (value) => {
        if (value && value.length < min) {
            return `Must be at least ${min} characters`;
        }
        return null;
    },

    maxLength: (max) => (value) => {
        if (value && value.length > max) {
            return `Must be at most ${max} characters`;
        }
        return null;
    },

    email: (value) => {
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            return 'Invalid email format';
        }
        return null;
    },

    number: (value) => {
        if (value && isNaN(Number(value))) {
            return 'Must be a number';
        }
        return null;
    }
};

export function validateForm(data, rules) {
    const errors = {};
    
    Object.keys(rules).forEach(field => {
        const fieldRules = rules[field];
        const value = data[field];
        
        for (const rule of fieldRules) {
            const error = rule(value);
            if (error) {
                errors[field] = error;
                break;
            }
        }
    });
    
    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
}

// Common validation rules
export const commonRules = {
    task: {
        subject: [validators.required, validators.minLength(3)],
        status: [validators.required],
        description: [validators.maxLength(1000)]
    },
    
    login: {
        username: [validators.required],
        password: [validators.required, validators.minLength(6)]
    }
}; 