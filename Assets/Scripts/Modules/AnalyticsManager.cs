using System.Collections.Generic;
using System.Linq;
using UnityEngine;

namespace CircuitShift.Modules
{
    /// <summary>Swap-in target for a real backend (Firebase Analytics) without touching call sites.</summary>
    public interface IAnalyticsProvider
    {
        void LogEvent(string name, IDictionary<string, object> parameters);
    }

    /// <summary>Dev-time stub: prints every event to the console so the funnel can be sanity-checked without Firebase.</summary>
    public class ConsoleAnalyticsProvider : IAnalyticsProvider
    {
        public void LogEvent(string name, IDictionary<string, object> parameters)
        {
            string paramStr = parameters == null ? "" : string.Join(", ", parameters.Select(kv => $"{kv.Key}={kv.Value}"));
            Debug.Log($"[Analytics] {name} ({paramStr})");
        }
    }

    /// <summary>
    /// Static facade with one typed method per event in the design doc's section 9
    /// event table, so call sites can't typo an event or parameter name.
    /// </summary>
    public static class AnalyticsManager
    {
        public static IAnalyticsProvider Provider { get; set; } = new ConsoleAnalyticsProvider();

        public static void LogEvent(string name, IDictionary<string, object> parameters = null) =>
            Provider.LogEvent(name, parameters);

        public static void TutorialStart(string appVersion) =>
            LogEvent("tutorial_start", new Dictionary<string, object> { ["app_version"] = appVersion });

        public static void TutorialComplete(float elapsedTime) =>
            LogEvent("tutorial_complete", new Dictionary<string, object> { ["elapsed_time"] = elapsedTime });

        public static void LevelStart(string mode, string difficulty, string levelId) =>
            LogEvent("level_start", new Dictionary<string, object>
            {
                ["mode"] = mode,
                ["difficulty"] = difficulty,
                ["level_id"] = levelId
            });

        public static void LevelComplete(string mode, float duration, int rotations, int hints) =>
            LogEvent("level_complete", new Dictionary<string, object>
            {
                ["mode"] = mode,
                ["duration"] = duration,
                ["rotations"] = rotations,
                ["hints"] = hints
            });

        public static void LevelFail(string mode, string failReason, float duration) =>
            LogEvent("level_fail", new Dictionary<string, object>
            {
                ["mode"] = mode,
                ["fail_reason"] = failReason,
                ["duration"] = duration
            });

        public static void RewardedOffer(string placement) =>
            LogEvent("rewarded_offer", new Dictionary<string, object> { ["placement"] = placement });

        public static void RewardedStart(string placement) =>
            LogEvent("rewarded_start", new Dictionary<string, object> { ["placement"] = placement });

        public static void RewardedEarned(string placement, string rewardType) =>
            LogEvent("rewarded_earned", new Dictionary<string, object>
            {
                ["placement"] = placement,
                ["reward_type"] = rewardType
            });

        public static void InterstitialShown(int roundsSinceLast, float sessionTime) =>
            LogEvent("interstitial_shown", new Dictionary<string, object>
            {
                ["rounds_since_last"] = roundsSinceLast,
                ["session_time"] = sessionTime
            });

        public static void DailyChallengeComplete(float duration, int score) =>
            LogEvent("daily_challenge_complete", new Dictionary<string, object>
            {
                ["duration"] = duration,
                ["score"] = score
            });

        public static void ThemeUnlock(string themeId, int currencySpent) =>
            LogEvent("theme_unlock", new Dictionary<string, object>
            {
                ["theme_id"] = themeId,
                ["currency_spent"] = currencySpent
            });

        public static void SessionEnd(float duration, int roundsPlayed) =>
            LogEvent("session_end", new Dictionary<string, object>
            {
                ["duration"] = duration,
                ["rounds_played"] = roundsPlayed
            });
    }
}
