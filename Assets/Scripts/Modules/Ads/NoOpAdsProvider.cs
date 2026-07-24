using System;

namespace CircuitShift.Modules.Ads
{
    /// <summary>
    /// Dev-time stub: "loads" instantly and rewarded ads always pay out, so gameplay
    /// and the ad-frequency/UI logic can be exercised without the AdMob SDK. Do not
    /// ship this - real ad units must always be requested with test IDs during
    /// development per design doc's app-review checklist.
    /// </summary>
    public class NoOpAdsProvider : IAdsProvider
    {
        public bool IsRewardedReady { get; private set; }
        public bool IsInterstitialReady { get; private set; }

        public void LoadRewarded(string adUnitId, Action<bool> onLoaded)
        {
            IsRewardedReady = true;
            onLoaded?.Invoke(true);
        }

        public void ShowRewarded(Action<bool> onClosed)
        {
            bool wasReady = IsRewardedReady;
            IsRewardedReady = false; // a shown ad is consumed; caller must load the next one
            onClosed?.Invoke(wasReady);
        }

        public void LoadInterstitial(string adUnitId, Action<bool> onLoaded)
        {
            IsInterstitialReady = true;
            onLoaded?.Invoke(true);
        }

        public void ShowInterstitial(Action onClosed)
        {
            IsInterstitialReady = false;
            onClosed?.Invoke();
        }
    }
}
