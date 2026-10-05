const sendSuccess = (res, message, data, statusCode = 200) => {
  const response = { success: true, message };

  if (data !== undefined) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

const sendError = (res, statusCode, message, error) => {
  const response = { success: false, message };

  if (error !== undefined) {
    response.error = error instanceof Error ? error.message : error;
  }

  return res.status(statusCode).json(response);
};

module.exports = { sendSuccess, sendError };
