using System;

namespace CircuitShift.Modules.Ads
{
    /// <summary>
    /// Shaped after the Google Mobile Ads Unity Plugin's RewardedAd/InterstitialAd
    /// load-then-show flow, so a real AdMob-backed implementation is a drop-in
    /// replacement for NoOpAdsProvider once the SDK is imported.
    /// </summary>
    public interface IAdsProvider
    {
        void LoadRewarded(string adUnitId, Action<bool> onLoaded);
        bool IsRewardedReady { get; }

        /// <summary>onClosed receives true only if the viewer watched to completion and earned the reward.</summary>
        void ShowRewarded(Action<bool> onClosed);

        void LoadInterstitial(string adUnitId, Action<bool> onLoaded);
        bool IsInterstitialReady { get; }
        void ShowInterstitial(Action onClosed);
    }
}
