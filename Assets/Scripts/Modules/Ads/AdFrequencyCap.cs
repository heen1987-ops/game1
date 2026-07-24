using System;
using UnityEngine;

namespace CircuitShift.Modules.Ads
{
    /// <summary>
    /// Interstitial pacing policy from design doc section 5: no ads in the first
    /// N seconds of a session, only after every K completed rounds, a minimum
    /// cooldown between shows, and a daily cap. All thresholds come from
    /// RemoteConfigManager so they can be tuned live. The daily count survives
    /// app restarts via PlayerPrefs; the round/cooldown counters are per-session.
    /// </summary>
    public class AdFrequencyCap
    {
        private const string ShownTodayKey = "ads.interstitial.shownToday";
        private const string ResetDateKey = "ads.interstitial.resetDate";

        private readonly float sessionStartRealtime;
        private float lastAdRealtime = float.NegativeInfinity;

        public int RoundsSinceLastAd { get; private set; }

        public AdFrequencyCap()
        {
            sessionStartRealtime = Time.realtimeSinceStartup;
        }

        public void NotifyRoundCompleted() => RoundsSinceLastAd++;

        public bool CanShowInterstitial()
        {
            EnsureDayCurrent();

            if (!RemoteConfigManager.GetBool("ads.interstitial.enabled", true)) return false;

            float sessionTime = Time.realtimeSinceStartup - sessionStartRealtime;
            if (sessionTime < RemoteConfigManager.GetFloat("ads.interstitial.first_run_grace_seconds", 180f)) return false;

            if (RoundsSinceLastAd < RemoteConfigManager.GetInt("ads.interstitial.rounds_per_interstitial", 4)) return false;

            float sinceLastAd = Time.realtimeSinceStartup - lastAdRealtime;
            if (sinceLastAd < RemoteConfigManager.GetFloat("ads.interstitial.min_seconds_between", 180f)) return false;

            int shownToday = PlayerPrefs.GetInt(ShownTodayKey, 0);
            if (shownToday >= RemoteConfigManager.GetInt("ads.interstitial.max_per_day", 4)) return false;

            return true;
        }

        public void NotifyAdShown()
        {
            EnsureDayCurrent();
            RoundsSinceLastAd = 0;
            lastAdRealtime = Time.realtimeSinceStartup;
            PlayerPrefs.SetInt(ShownTodayKey, PlayerPrefs.GetInt(ShownTodayKey, 0) + 1);
        }

        private static void EnsureDayCurrent()
        {
            string today = DateTime.UtcNow.ToString("yyyyMMdd");
            if (PlayerPrefs.GetString(ResetDateKey, "") != today)
            {
                PlayerPrefs.SetString(ResetDateKey, today);
                PlayerPrefs.SetInt(ShownTodayKey, 0);
            }
        }
    }
}
