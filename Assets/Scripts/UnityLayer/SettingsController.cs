using System;
using System.Collections.Generic;
using CircuitShift.Modules;
using TMPro;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

namespace CircuitShift.UnityLayer
{
    /// <summary>Settings screen: music/SFX mute toggles and a language switcher (design doc: "한국어·영어 지원").</summary>
    public class SettingsController : MonoBehaviour
    {
        // Language names are shown in their own language regardless of the current UI
        // language, so a player can always find their language - not run through Get().
        private static readonly Dictionary<string, string> LanguageDisplayNames = new Dictionary<string, string>
        {
            ["ko"] = "한국어",
            ["en"] = "English",
        };

        [SerializeField] private TMP_Text titleText;
        [SerializeField] private TMP_Text musicLabel;
        [SerializeField] private TMP_Text sfxLabel;
        [SerializeField] private TMP_Text languageLabel;
        [SerializeField] private TMP_Text languageValueText;
        [SerializeField] private Toggle musicToggle;
        [SerializeField] private Toggle sfxToggle;
        [SerializeField] private Button languageButton;
        [SerializeField] private Button backButton;

        private void Start()
        {
            titleText.text = LocalizationManager.Get("settings.title");
            musicLabel.text = LocalizationManager.Get("settings.music");
            sfxLabel.text = LocalizationManager.Get("settings.sound");
            languageLabel.text = LocalizationManager.Get("settings.language");

            var audio = AudioManager.Instance;
            musicToggle.isOn = audio == null || !audio.MusicMuted;
            sfxToggle.isOn = audio == null || !audio.SfxMuted;
            musicToggle.onValueChanged.AddListener(OnMusicToggleChanged);
            sfxToggle.onValueChanged.AddListener(OnSfxToggleChanged);

            RefreshLanguageValue();
            languageButton.onClick.AddListener(CycleLanguage);
            backButton.onClick.AddListener(() => SceneFlowManager.Load(SceneFlowManager.Scenes.Home));
        }

        private void OnMusicToggleChanged(bool isOn) => AudioManager.Instance?.SetMusicMuted(!isOn);

        private void OnSfxToggleChanged(bool isOn) => AudioManager.Instance?.SetSfxMuted(!isOn);

        private void CycleLanguage()
        {
            var languages = LocalizationManager.SupportedLanguages;
            int currentIndex = Array.IndexOf(languages, LocalizationManager.CurrentLanguage);
            string next = languages[(currentIndex + 1) % languages.Length];

            LocalizationManager.SetLanguage(next);

            // Reload this scene so every LocalizationManager.Get() call re-runs with the new language,
            // rather than wiring a live-refresh event through every screen.
            SceneFlowManager.Load(SceneManager.GetActiveScene().name);
        }

        private void RefreshLanguageValue()
        {
            languageValueText.text = LanguageDisplayNames.TryGetValue(LocalizationManager.CurrentLanguage, out var name)
                ? name
                : LocalizationManager.CurrentLanguage;
        }
    }
}
