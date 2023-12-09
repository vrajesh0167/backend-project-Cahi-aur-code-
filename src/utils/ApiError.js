class ApiError extends Error {
    constructor(
        statusCode,
        message = "Somethig want wrong",
        errors = [],
        statck = ""
    ) {
        super(message);
        this.statusCode = statusCode;
        this.data = null;
        this.success = false;
        this.message = message;
        this.errors = errors;

        if (statck) {
            this.stack = statck;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export default ApiError;
