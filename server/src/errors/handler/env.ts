import { ApiError } from '../../utils/ApiError.js';

export const missingEnvVariable = (name: string) =>
  new ApiError(500, `Missing environment variable: ${name}`);

export const invalidEnvVariable = (name: string, expected: string) =>
  new ApiError(500, `Invalid value for "${name}". Expected ${expected}.`);
