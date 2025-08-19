export const logError = (context: string, error: unknown) => {
    if (process.env.NODE_ENV === 'development') {
        console.error(`[${context}]`, error);
    }
};

export const logInfo = (context: string, message: string, data?: unknown) => {
    if (process.env.NODE_ENV === 'development') {
        if (data) {
            console.log(`[${context}] ${message}`, data);
        } else {
            console.log(`[${context}] ${message}`);
        }
    }
};

export const logWarning = (context: string, message: string, data?: unknown) => {
    if (process.env.NODE_ENV === 'development') {
        if (data) {
            console.warn(`[${context}] ${message}`, data);
        } else {
            console.warn(`[${context}] ${message}`);
        }
    }
};
