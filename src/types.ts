export interface PredictionResult {
  /** The predicted digit, 0-9 */
  digit: number;
  /** Confidence of the predicted digit, 0-1 */
  confidence: number;
  /** Probability for every digit 0-9, index = digit */
  probabilities: number[];
}
