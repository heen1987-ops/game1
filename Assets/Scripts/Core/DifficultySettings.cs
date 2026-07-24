namespace CircuitShift.Core
{
    /// <summary>Tunable knobs listed in the design doc's "난이도 변수" section. Values are read from Remote Config in the live app; these are the local defaults.</summary>
    public class DifficultySettings
    {
        public int BoardWidth = 5;
        public int BoardHeight = 5;
        public float TimeLimitSeconds = 90f;

        /// <summary>Grace period after the puzzle loads before the pulse starts moving.</summary>
        public float PulseStartDelaySeconds = 3f;

        public float PulseSpeedTilesPerSecond = 1.2f;
        public int MinPathLength = 6;
        public int MaxPathLength = 12;

        /// <summary>Chance (0-1) that a non-path cell is filled with a decoy tile instead of staying empty.</summary>
        public float DistractorDensity = 0.6f;

        public DifficultySettings Clone() => new DifficultySettings
        {
            BoardWidth = BoardWidth,
            BoardHeight = BoardHeight,
            TimeLimitSeconds = TimeLimitSeconds,
            PulseStartDelaySeconds = PulseStartDelaySeconds,
            PulseSpeedTilesPerSecond = PulseSpeedTilesPerSecond,
            MinPathLength = MinPathLength,
            MaxPathLength = MaxPathLength,
            DistractorDensity = DistractorDensity
        };
    }
}
