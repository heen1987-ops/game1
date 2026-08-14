using System.Collections;
using CircuitShift.Modules;
using CircuitShift.Modules.Ads;
using UnityEngine;

namespace CircuitShift.UnityLayer
{
    /// <summary>
    /// Entry point: place this on a GameObject in the very first scene. Runs the
    /// module init order the design doc implies - localize, then resolve ad
    /// consent (UMP must complete before any ad request), then remote config,
    /// then preload ads only if consent allows it - and finally hands off to Home.
    /// </summary>
    public class GameBootstrap : MonoBehaviour
    {
        private void Start() => StartCoroutine(InitializeSequence());

        private IEnumerator InitializeSequence()
        {
            LocalizationManager.Initialize();

            bool consentDone = false;
            ConsentManager.RequestConsentUpdate((canRequestAds, error) =>
            {
                if (!string.IsNullOrEmpty(error))
                    Debug.LogWarning($"GameBootstrap: consent update error: {error}");
                consentDone = true;
            });
            yield return new WaitUntil(() => consentDone);

            bool remoteConfigDone = false;
            RemoteConfigManager.Initialize(_ => remoteConfigDone = true);
            yield return new WaitUntil(() => remoteConfigDone);

            AnalyticsManager.LogEvent("app_start");

            if (ConsentManager.CanRequestAds)
            {
                RewardedAdManager.Preload(AdUnitIds.RewardedTestAndroid);
                InterstitialAdManager.Preload(AdUnitIds.InterstitialTestAndroid);
            }

            SceneFlowManager.Load(SaveManager.Data.tutorialCompleted
                ? SceneFlowManager.Scenes.Home
                : SceneFlowManager.Scenes.Tutorial);
        }
    }
}
