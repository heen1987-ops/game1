using System;
using System.Collections.Generic;
using UnityEngine;

namespace CircuitShift.Modules
{
    [Serializable]
    internal class LocalizationEntry
    {
        public string key;
        public string value;
    }

    [Serializable]
    internal class LocalizationTable
    {
        public LocalizationEntry[] entries;
    }

    /// <summary>
    /// Flat key -> string lookup loaded from Resources/Localization/{code}.json.
    /// JsonUtility can't deserialize a bare dictionary, so the file is an
    /// { "entries": [{ "key": ..., "value": ... }] } array instead.
    /// </summary>
    public static class LocalizationManager
    {
        private const string ResourceFolder = "Localization";
        private const string PrefsKey = "localization.language";
        private const string FallbackLanguage = "en";

        private static readonly Dictionary<string, string> table = new Dictionary<string, string>();
        private static bool initialized;

        public static string CurrentLanguage { get; private set; } = FallbackLanguage;

        public static void Initialize(string languageOverride = null)
        {
            CurrentLanguage = languageOverride ?? PlayerPrefs.GetString(PrefsKey, DetectSystemLanguage());
            LoadTable(CurrentLanguage);
            initialized = true;
        }

        public static void SetLanguage(string code)
        {
            CurrentLanguage = code;
            PlayerPrefs.SetString(PrefsKey, code);
            LoadTable(code);
            initialized = true;
        }

        public static string Get(string key)
        {
            if (!initialized) Initialize();

            if (table.TryGetValue(key, out var value)) return value;
            Debug.LogWarning($"LocalizationManager: missing key '{key}' for language '{CurrentLanguage}'");
            return key;
        }

        private static void LoadTable(string code)
        {
            table.Clear();

            var asset = Resources.Load<TextAsset>($"{ResourceFolder}/{code}");
            if (asset == null && code != FallbackLanguage)
            {
                Debug.LogWarning($"LocalizationManager: no table for '{code}', falling back to '{FallbackLanguage}'");
                asset = Resources.Load<TextAsset>($"{ResourceFolder}/{FallbackLanguage}");
            }
            if (asset == null)
            {
                Debug.LogError("LocalizationManager: no localization tables found under Resources/Localization");
                return;
            }

            var parsed = JsonUtility.FromJson<LocalizationTable>(asset.text);
            if (parsed?.entries == null) return;
            foreach (var entry in parsed.entries) table[entry.key] = entry.value;
        }

        private static string DetectSystemLanguage() =>
            Application.systemLanguage == SystemLanguage.Korean ? "ko" : FallbackLanguage;
    }
}
