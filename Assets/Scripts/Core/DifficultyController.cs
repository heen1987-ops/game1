using System;

namespace CircuitShift.Core
{
    /// <summary>
    /// Produces DifficultySettings + a deterministic seed for each of the MVP modes
    /// (design doc section 3: 오늘의 퍼즐, 빠른 플레이, 무한 회로).
    /// </summary>
    public static class DifficultyController
    {
        public static DifficultySettings QuickPlaySettings() => new DifficultySettings
        {
            BoardWidth = 5,
            BoardHeight = 5,
            TimeLimitSeconds = 75f,
            PulseStartDelaySeconds = 3f,
            PulseSpeedTilesPerSecond = 1.2f,
            MinPathLength = 6,
            MaxPathLength = 10,
            DistractorDensity = 0.55f
        };

        /// <summary>Same seed for every player on a given calendar date so "오늘의 퍼즐" matches for everyone.</summary>
        public static (DifficultySettings settings, int seed) DailyPuzzle(DateTime utcDate)
        {
            var settings = new DifficultySettings
            {
                BoardWidth = 6,
                BoardHeight = 6,
                TimeLimitSeconds = 100f,
                PulseStartDelaySeconds = 3f,
                PulseSpeedTilesPerSecond = 1.3f,
                MinPathLength = 8,
                MaxPathLength = 14,
                DistractorDensity = 0.6f
            };
            int seed = utcDate.Year * 10000 + utcDate.Month * 100 + utcDate.Day;
            return (settings, seed);
        }

        /// <summary>Infinite mode ramps board size, time pressure and pulse speed with each cleared level, capped to keep boards playable on small screens.</summary>
        public static DifficultySettings InfiniteLevel(int level)
        {
            level = Math.Max(1, level);

            int size = 5 + Math.Min(3, (level - 1) / 5); // 5x5 up to 8x8, +1 every 5 levels
            float timeLimit = Math.Max(45f, 90f - (level - 1) * 2f);
            float pulseSpeed = Math.Min(2.5f, 1.0f + (level - 1) * 0.05f);
            float distractorDensity = Math.Min(0.8f, 0.4f + (level - 1) * 0.02f);

            return new DifficultySettings
            {
                BoardWidth = size,
                BoardHeight = size,
                TimeLimitSeconds = timeLimit,
                PulseStartDelaySeconds = 2.5f,
                PulseSpeedTilesPerSecond = pulseSpeed,
                MinPathLength = Math.Min(size * size - 2, 6 + level / 3),
                MaxPathLength = Math.Min(size * size - 1, 10 + level / 2),
                DistractorDensity = distractorDensity
            };
        }
    }
}
