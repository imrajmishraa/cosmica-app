import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const healthz = asyncHandler(async (req, res) => {
  console.log('✅Healthcheck is working');

  return res.status(200).json(
    new ApiResponse(200, 'Health check passed', {
      status: 'UP',
      timestamp: new Date().toISOString(),
    })
  );
});

export { healthz };
