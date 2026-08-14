using System;
using CircuitShift.Core;

namespace CircuitShift.Modules
{
    /// <summary>
    /// Tracks progress through the current ISO week's 7-stage challenge. Progress
    /// resets lazily the first time it's queried in a new week (same pattern as
    /// GameSceneController's daily-streak check) rather than needing a scheduled job.
    /// </summary>
    public static class WeeklyChallengeManager
    {
        public const int StageCount = DifficultyController.WeeklyChallengeStageCount;

        public static int CompletedStages(DateTime utcNow)
        {
            EnsureCurrentWeek(utcNow);
            return SaveManager.Data.weeklyChallengeStage;
        }

        public static bool IsWeekComplete(DateTime utcNow) => CompletedStages(utcNow) >= StageCount;

        /// <summary>1-based stage to play next, or null if all 7 are already cleared for this week.</summary>
        public static int? NextStage(DateTime utcNow)
        {
            int completed = CompletedStages(utcNow);
            return completed >= StageCount ? (int?)null : completed + 1;
        }

        /// <returns>true if this call actually advanced progress (ignores duplicate/out-of-order/stale calls).</returns>
        public static bool RecordStageComplete(DateTime utcNow, int stageIndex)
        {
            EnsureCurrentWeek(utcNow);
            if (stageIndex != SaveManager.Data.weeklyChallengeStage + 1) return false;

            SaveManager.Data.weeklyChallengeStage = stageIndex;
            SaveManager.Save();
            return true;
        }

        private static void EnsureCurrentWeek(DateTime utcNow)
        {
            string weekId = DifficultyController.WeeklyWeekId(utcNow);
            if (SaveManager.Data.weeklyChallengeWeekId == weekId) return;

            SaveManager.Data.weeklyChallengeWeekId = weekId;
            SaveManager.Data.weeklyChallengeStage = 0;
            SaveManager.Save();
        }
    }
}
