using System;
using CircuitShift.Core;
using UnityEngine;

namespace CircuitShift.UnityLayer
{
    public enum LevelFailReason
    {
        Timeout,
        Disconnected
    }

    /// <summary>
    /// Orchestrates one puzzle attempt: owns the Core Board + PulseSimulation,
    /// runs the overall round timer (separate from the pulse's own travel clock -
    /// design doc: "제한 시간이 끝나거나 펄스가 단절된 지점에 도달하면 실패"),
    /// and routes tile taps from BoardView into TileData rotations.
    /// </summary>
    public class GameController : MonoBehaviour
    {
        [SerializeField] private BoardView boardView;

        /// <summary>stars, score, rotationsUsed, durationSeconds</summary>
        public event Action<int, int, int, float> LevelCompleted;

        /// <summary>reason, durationSeconds</summary>
        public event Action<LevelFailReason, float> LevelFailed;

        public Board CurrentBoard { get; private set; }
        public bool IsRunning { get; private set; }
        public int RotationsUsed { get; private set; }

        private DifficultySettings settings;
        private PulseSimulation pulse;
        private float totalElapsed;

        private void OnEnable()
        {
            if (boardView != null) boardView.CellTapped += HandleCellTapped;
        }

        private void OnDisable()
        {
            if (boardView != null) boardView.CellTapped -= HandleCellTapped;
        }

        public void StartLevel(Board board, DifficultySettings settings)
        {
            CurrentBoard = board;
            this.settings = settings;
            pulse = new PulseSimulation(board, settings);
            RotationsUsed = 0;
            totalElapsed = 0f;

            boardView.BuildFrom(board);
            IsRunning = true;
        }

        private void Update()
        {
            if (!IsRunning) return;

            totalElapsed += Time.deltaTime;
            if (totalElapsed >= settings.TimeLimitSeconds)
            {
                Finish(success: false, LevelFailReason.Timeout);
                return;
            }

            pulse.Tick(Time.deltaTime);
            boardView.UpdatePulseMarker(pulse);

            if (pulse.IsComplete) Finish(success: true, null);
            else if (pulse.IsFailed) Finish(success: false, LevelFailReason.Disconnected);
        }

        private void HandleCellTapped(GridPos pos)
        {
            if (!IsRunning) return;

            var tile = CurrentBoard.At(pos);
            if (tile.IsStart || tile.IsGoal || tile.Type == TileType.Empty) return;

            tile.RotateClockwiseOnce();
            RotationsUsed++;
            boardView.RefreshTile(pos);
        }

        private void Finish(bool success, LevelFailReason? failReason)
        {
            IsRunning = false;

            if (success)
            {
                float timeRemaining = Mathf.Max(0f, settings.TimeLimitSeconds - totalElapsed);
                int stars = ScoreCalculator.Stars(RotationsUsed, CurrentBoard.MinRotations, timeRemaining, settings.TimeLimitSeconds);
                int score = ScoreCalculator.Score(RotationsUsed, CurrentBoard.MinRotations, timeRemaining, settings.TimeLimitSeconds);
                LevelCompleted?.Invoke(stars, score, RotationsUsed, totalElapsed);
            }
            else
            {
                LevelFailed?.Invoke(failReason ?? LevelFailReason.Timeout, totalElapsed);
            }
        }
    }
}
