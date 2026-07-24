using System;
using System.Collections.Generic;
using System.Globalization;

namespace CircuitShift.Modules
{
    /// <summary>Swap-in target for a real config backend (Firebase Remote Config) without touching call sites.</summary>
    public interface IRemoteConfigProvider
    {
        void FetchAndActivate(Action<bool> onComplete);
        bool GetBool(string key, bool defaultValue);
        int GetInt(string key, int defaultValue);
        float GetFloat(string key, float defaultValue);
        string GetString(string key, string defaultValue);
    }

    /// <summary>
    /// Hardcoded fallback so the game runs identically offline or before Firebase
    /// is wired up. Values mirror the design doc's section 5 ad-frequency defaults.
    /// </summary>
    public class LocalDefaultsProvider : IRemoteConfigProvider
    {
        private readonly Dictionary<string, string> defaults = new Dictionary<string, string>
        {
            ["ads.interstitial.enabled"] = "true",
            ["ads.interstitial.first_run_grace_seconds"] = "180",
            ["ads.interstitial.min_seconds_between"] = "180",
            ["ads.interstitial.rounds_per_interstitial"] = "4",
            ["ads.interstitial.max_per_day"] = "4",
            ["ads.rewarded.enabled"] = "true",
        };

        public void FetchAndActivate(Action<bool> onComplete) => onComplete?.Invoke(true);

        public bool GetBool(string key, bool defaultValue) =>
            defaults.TryGetValue(key, out var raw) && bool.TryParse(raw, out var value) ? value : defaultValue;

        public int GetInt(string key, int defaultValue) =>
            defaults.TryGetValue(key, out var raw) && int.TryParse(raw, NumberStyles.Integer, CultureInfo.InvariantCulture, out var value) ? value : defaultValue;

        public float GetFloat(string key, float defaultValue) =>
            defaults.TryGetValue(key, out var raw) && float.TryParse(raw, NumberStyles.Float, CultureInfo.InvariantCulture, out var value) ? value : defaultValue;

        public string GetString(string key, string defaultValue) =>
            defaults.TryGetValue(key, out var raw) ? raw : defaultValue;
    }

    /// <summary>Static facade so call sites don't juggle provider instances. Replace Provider once Firebase is imported.</summary>
    public static class RemoteConfigManager
    {
        public static IRemoteConfigProvider Provider { get; set; } = new LocalDefaultsProvider();

        public static void Initialize(Action<bool> onComplete = null) => Provider.FetchAndActivate(onComplete);

        public static bool GetBool(string key, bool defaultValue = false) => Provider.GetBool(key, defaultValue);
        public static int GetInt(string key, int defaultValue = 0) => Provider.GetInt(key, defaultValue);
        public static float GetFloat(string key, float defaultValue = 0f) => Provider.GetFloat(key, defaultValue);
        public static string GetString(string key, string defaultValue = "") => Provider.GetString(key, defaultValue);
    }
}
