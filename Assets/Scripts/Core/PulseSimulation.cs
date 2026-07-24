using System;

namespace CircuitShift.Core
{
    /// <summary>
    /// Engine-agnostic stepper for the electric pulse: waits out the prep delay,
    /// then advances tile-by-tile along the board's solution path at
    /// PulseSpeedTilesPerSecond. Each edge is checked against the CURRENT tile
    /// rotations at the moment the pulse crosses it, so a tile the player fixes
    /// in time still passes, and one left wrong fails the run.
    /// Call Tick(deltaTime) once per frame/update from a MonoBehaviour or test loop.
    /// </summary>
    public class PulseSimulation
    {
        private readonly Board board;
        private readonly float secondsPerTile;
        private readonly float startDelaySeconds;
        private float elapsed;
        private int currentIndex;

        public bool IsStarted { get; private set; }
        public bool IsComplete { get; private set; }
        public bool IsFailed { get; private set; }

        /// <summary>0-1 fraction of the delay elapsed, useful for a "get ready" countdown UI.</summary>
        public float StartDelayProgress01 { get; private set; }

        /// <summary>0-1 fraction of the way from the current cell to the next one, for smooth visual interpolation.</summary>
        public float EdgeProgress01 { get; private set; }

        public GridPos CurrentCell => board.SolutionPath[currentIndex];
        public int CurrentIndex => currentIndex;

        public PulseSimulation(Board board, DifficultySettings settings)
        {
            if (board.SolutionPath == null || board.SolutionPath.Count < 2)
                throw new ArgumentException("Board has no solution path to simulate a pulse along", nameof(board));

            this.board = board;
            secondsPerTile = 1f / Math.Max(0.01f, settings.PulseSpeedTilesPerSecond);
            startDelaySeconds = settings.PulseStartDelaySeconds;
            currentIndex = 0;
        }

        public void Tick(float deltaTime)
        {
            if (IsComplete || IsFailed) return;

            elapsed += deltaTime;

            if (!IsStarted)
            {
                StartDelayProgress01 = startDelaySeconds <= 0f ? 1f : Math.Min(1f, elapsed / startDelaySeconds);
                if (elapsed < startDelaySeconds) return;

                IsStarted = true;
                elapsed -= startDelaySeconds;
            }

            while (!IsComplete && !IsFailed && elapsed >= secondsPerTile)
            {
                elapsed -= secondsPerTile;
                AdvanceOneTile();
            }

            EdgeProgress01 = !IsComplete && !IsFailed ? elapsed / secondsPerTile : 0f;
        }

        private void AdvanceOneTile()
        {
            var from = board.SolutionPath[currentIndex];
            var to = board.SolutionPath[currentIndex + 1];
            var dir = GridMath.DirectionTo(from, to);

            if (!PathValidator.AreLinked(board, from, dir))
            {
                IsFailed = true;
                return;
            }

            currentIndex++;
            if (currentIndex == board.SolutionPath.Count - 1)
                IsComplete = true;
        }
    }
}
