export interface StepError {
  success: false;
  error: string;
}

export interface StepSuccess<T> {
  success: true;
  data: T;
}

export type StepResult<T> = StepSuccess<T> | StepError;

export function createStepError(message: string): StepError {
  return { success: false, error: message };
}

export function createStepSuccess<T>(data: T): StepSuccess<T> {
  return { success: true, data };
}
