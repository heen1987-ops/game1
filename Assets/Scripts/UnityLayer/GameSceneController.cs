using System;
using System.Globalization;
using CircuitShift.Core;
using CircuitShift.Modules;
using CircuitShift.Modules.Ads;
using UnityEngine;

namespace CircuitShift.UnityLayer
{
    /// <summary>
    /// Bridges the mode picked on Home into a generated Core.Board, drives
    /// GameController through one attempt, persists progress, and hands the
    /// outcome to the Result scene via GameSession.
    /// </summary>
    public class GameSceneController : MonoBehaviour
    {
        [SerializeField] private GameController gameController;

        private string modeAnalyticsName;
        private string levelId;

        private void Start()
        {
            var mode = GameSession.PendingMode;
            GameSession.LastMode = mode;

            DifficultySettings settings;
            int seed;

            switch (mode)
            {
                case GameMode.Daily:
                    var (dailySettings, dailySeed) = DifficultyController.DailyPuzzle(DateTime.UtcNow);
                    settings = dailySettings;
                    seed = dailySeed;
                    modeAnalyticsName = "daily";
                    levelId = DateTime.UtcNow.ToString("yyyyMMdd");
                    break;

                case GameMode.Infinite:
                    settings = DifficultyController.InfiniteLevel(GameSession.PendingInfiniteLevel);
                    seed = GameSession.PendingSeed ?? UnityEngine.Random.Range(int.MinValue, int.MaxValue);
                    modeAnalyticsName = "infinite";
                    levelId = GameSession.PendingInfiniteLevel.ToString();
                    break;

                default:
                    settings = DifficultyController.QuickPlaySettings();
                    seed = GameSession.PendingSeed ?? UnityEngine.Random.Range(int.MinValue, int.MaxValue);
                    modeAnalyticsName = "quick";
                    levelId = "quick";
                    break;
            }

            // Remember the seed actually used so a "retry" after failure reproduces this exact puzzle.
            GameSession.PendingSeed = seed;

            var board = BoardGenerator.Generate(settings, seed);
            AnalyticsManager.LevelStart(modeAnalyticsName, mode.ToString(), levelId);

            gameController.LevelCompleted += HandleCompleted;
            gameController.LevelFailed += HandleFailed;
            gameController.StartLevel(board, settings);
        }

        private void OnDestroy()
        {
            if (gameController == null) return;
            gameController.LevelCompleted -= HandleCompleted;
            gameController.LevelFailed -= HandleFailed;
        }

        private void HandleCompleted(int stars, int score, int rotationsUsed, float duration)
        {
            AnalyticsManager.LevelComplete(modeAnalyticsName, duration, rotationsUsed, 0);

            int coinsEarned = 10 * stars; // placeholder economy; tune via RemoteConfig once live numbers exist
            SaveManager.Data.coins += coinsEarned;
            SaveManager.Data.totalLevelsCompleted++;

            if (GameSession.LastMode == GameMode.Daily)
            {
                AnalyticsManager.DailyChallengeComplete(duration, score);
                UpdateDailyStreak();
            }
            else if (GameSession.LastMode == GameMode.Infinite)
            {
                SaveManager.Data.bestInfiniteLevel = Mathf.Max(SaveManager.Data.bestInfiniteLevel, GameSession.PendingInfiniteLevel + 1);
            }

            SaveManager.Save();
            InterstitialAdManager.NotifyRoundCompleted();

            GameSession.LastRunSuccess = true;
            GameSession.LastStars = stars;
            GameSession.LastScore = score;
            GameSession.LastRotationsUsed = rotationsUsed;
            GameSession.LastCoinsEarned = coinsEarned;
            GameSession.LastDuration = duration;

            SceneFlowManager.Load(SceneFlowManager.Scenes.Result);
        }

        private void HandleFailed(LevelFailReason reason, float duration)
        {
            AnalyticsManager.LevelFail(modeAnalyticsName, reason.ToString(), duration);
            InterstitialAdManager.NotifyRoundCompleted();

            GameSession.LastRunSuccess = false;
            GameSession.LastFailReason = reason;
            GameSession.LastRotationsUsed = gameController.RotationsUsed;
            GameSession.LastCoinsEarned = 0;
            GameSession.LastDuration = duration;

            SceneFlowManager.Load(SceneFlowManager.Scenes.Result);
        }

        private static void UpdateDailyStreak()
        {
            string today = DateTime.UtcNow.ToString("yyyyMMdd");
            if (SaveManager.Data.lastDailyPuzzleDate == today) return; // already counted today

            bool consecutive = DateTime.TryParseExact(
                SaveManager.Data.lastDailyPuzzleDate, "yyyyMMdd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var lastDate)
                && (DateTime.UtcNow.Date - lastDate.Date).Days == 1;

            SaveManager.Data.dailyStreak = consecutive ? SaveManager.Data.dailyStreak + 1 : 1;
            SaveManager.Data.lastDailyPuzzleDate = today;
        }
    }
}
