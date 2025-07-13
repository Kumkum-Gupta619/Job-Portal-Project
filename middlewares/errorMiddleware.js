const errorMiddleware = (err, req, res, next) => {
    let statusCode = 500;
    let message = "Something went wrong";

    // If error is a string (from next("some message"))
    if (typeof err === "string") {
        message = err;
        statusCode = 400;
    }

    // If error is an object with a message property
    if (typeof err === "object" && err !== null && err.message) {
        message = err.message;
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = Object.values(err.errors).map(item => item.message).join(',');
    }

    // Mongoose duplicate key error
    if (err.code && err.code === 11000) {
        statusCode = 400;
        message = `${Object.keys(err.keyValue)} field has to be unique`;
    }

    res.status(statusCode).json({ message });
};

export default errorMiddleware;