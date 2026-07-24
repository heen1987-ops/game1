using System;
using UnityEngine;
using CircuitShift.Modules;

namespace CircuitShift.Modules.Ads
{
    /// <summary>
    /// Facade over IAdsProvider for rewarded placements (hint, revive, double coins,
    /// daily bonus). Enforces design doc section 5's rule: if an ad isn't ready,
    /// the feature is simply unavailable, never blocked or faked.
    /// </summary>
    public static class RewardedAdManager
    {
        public static IAdsProvider Provider { get; set; } = new NoOpAdsProvider();

        public static bool IsReady => Provider.IsRewardedReady;

        public static void Preload(string adUnitId) =>
            Provider.LoadRewarded(adUnitId, success =>
            {
                if (!success) Debug.LogWarning($"RewardedAdManager: failed to load ad unit {adUnitId}");
            });

        /// <param name="placement">One of the placements in design doc section 5's reward table (e.g. "hint", "revive", "double_coins", "daily_bonus").</param>
        public static void Request(string placement, string adUnitId, Action<bool> onResult)
        {
            AnalyticsManager.RewardedOffer(placement);

            if (!Provider.IsRewardedReady)
            {
                onResult?.Invoke(false);
                return;
            }

            AnalyticsManager.RewardedStart(placement);
            Provider.ShowRewarded(earned =>
            {
                if (earned) AnalyticsManager.RewardedEarned(placement, placement);
                onResult?.Invoke(earned);
                Provider.LoadRewarded(adUnitId, null);
            });
        }
    }
}
