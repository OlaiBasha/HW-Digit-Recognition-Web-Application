export interface PredictionResult {
  /** The predicted digit, 0-9 */
  digit: number;
  /** Confidence of the predicted digit, 0-1 */
  confidence: number;
  /** Probability for every digit 0-9, index = digit */
  probabilities: number[];
}

export interface DigitResult {
  digit: number;
  confidence: number;
}

export interface MultiDigitResult {
  /** One result per detected digit, left to right */
  digits: DigitResult[];
  /** The digits joined together, e.g. "42" */
  number: string;
}