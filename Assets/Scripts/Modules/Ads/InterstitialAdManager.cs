using System;
using CircuitShift.Modules;

namespace CircuitShift.Modules.Ads
{
    /// <summary>
    /// Facade over IAdsProvider for the result-screen interstitial. TryShow must
    /// only be called from the result screen (design doc: never on launch, during
    /// play, or on back/exit) - the frequency cap handles the rest of the pacing.
    /// </summary>
    public static class InterstitialAdManager
    {
        public static IAdsProvider Provider { get; set; } = new NoOpAdsProvider();

        private static readonly AdFrequencyCap frequencyCap = new AdFrequencyCap();

        public static void Preload(string adUnitId) => Provider.LoadInterstitial(adUnitId, null);

        public static void NotifyRoundCompleted() => frequencyCap.NotifyRoundCompleted();

        /// <returns>true if an interstitial was actually shown.</returns>
        public static bool TryShow(string adUnitId, float sessionTimeSeconds, Action onClosed)
        {
            if (!frequencyCap.CanShowInterstitial() || !Provider.IsInterstitialReady)
            {
                onClosed?.Invoke();
                return false;
            }

            AnalyticsManager.InterstitialShown(frequencyCap.RoundsSinceLastAd, sessionTimeSeconds);
            frequencyCap.NotifyAdShown();

            Provider.ShowInterstitial(() =>
            {
                onClosed?.Invoke();
                Provider.LoadInterstitial(adUnitId, null);
            });
            return true;
        }
    }
}
