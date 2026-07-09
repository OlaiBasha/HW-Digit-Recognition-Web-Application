import { PredictionResult } from '../types';

interface Props {
  result: PredictionResult | null;
  isLoading: boolean;
}

export default function PredictionScoreboard({ result, isLoading }: Props) {
  return (
    <div className="bg-chalkboard-light rounded-md border-2 border-dashed border-chalk-dust p-5 h-full">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="font-display text-2xl text-chalk">scoreboard</h2>
        {result && (
          <span className="font-mono text-sm text-chalk-yellow">
            {(result.confidence * 100).toFixed(1)}% sure
          </span>
        )}
      </div>

      {isLoading && (
        <p className="font-body text-sm text-chalk/60 animate-pulse">reading the chalk marks…</p>
      )}

      {!isLoading && !result && (
        <p className="font-body text-sm text-chalk/60">
          draw a digit and hit predict to see the scoreboard.
        </p>
      )}

      {!isLoading && result && (
        <ul className="space-y-2">
          {result.probabilities.map((p, digit) => {
            const isPredicted = digit === result.digit;
            return (
              <li key={digit} className="flex items-center gap-3">
                <span
                  className={`relative flex items-center justify-center w-7 h-7 font-display text-lg shrink-0 ${
                    isPredicted ? 'text-chalk-yellow' : 'text-chalk/70'
                  }`}
                >
                  {digit}
                  {isPredicted && (
                    <svg
                      viewBox="0 0 40 40"
                      className="absolute inset-0 w-full h-full -m-1.5 overflow-visible"
                      aria-hidden="true"
                    >
                      <path
                        d="M20 4 C 30 3, 37 10, 36 20 C 37 31, 28 37, 19 36 C 8 37, 3 29, 4 19 C 3 9, 11 3, 20 4"
                        fill="none"
                        stroke="#e8c468"
                        strokeWidth="2"
                        strokeLinecap="round"
                        className="chalk-circle"
                      />
                    </svg>
                  )}
                </span>
                <div className="flex-1 h-3 bg-chalkboard rounded-sm overflow-hidden">
                  <div
                    className={`h-full rounded-sm transition-all duration-500 ${
                      isPredicted ? 'bg-chalk-yellow' : 'bg-chalk-teal/50'
                    }`}
                    style={{ width: `${Math.round(p * 100)}%` }}
                  />
                </div>
                <span className="font-mono text-xs text-chalk/50 w-10 text-right">
                  {Math.round(p * 100)}%
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
