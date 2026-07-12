import { MultiDigitResult } from '../types';

interface Props {
  result: MultiDigitResult | null;
  isLoading: boolean;
}

export default function PredictionScoreboard({ result, isLoading }: Props) {
  return (
    <div className="bg-chalkboard-light rounded-md border-2 border-dashed border-chalk-dust p-5 h-full flex flex-col">
      <h2 className="font-display text-2xl text-chalk mb-4">scoreboard</h2>

      {isLoading && (
        <p className="font-body text-sm text-chalk/60 animate-pulse">reading the chalk marks…</p>
      )}

      {!isLoading && !result && (
        <p className="font-body text-sm text-chalk/60">
          draw or upload a number and hit predict to see the result.
        </p>
      )}

      {!isLoading && result && (
        <div className="flex flex-col items-center justify-center flex-1 gap-6">
          {/* The recognized number, big and chalky */}
          <span className="font-display text-7xl text-chalk-yellow tracking-wider">
            {result.number}
          </span>

          {/* Per-digit confidence chips */}
          <div className="flex gap-3 flex-wrap justify-center">
            {result.digits.map((d, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-1 border border-chalk-dust rounded-md px-3 py-2 min-w-[64px]"
              >
                <span className="font-display text-2xl text-chalk">{d.digit}</span>
                <span className="font-mono text-xs text-chalk-teal">
                  {(d.confidence * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
