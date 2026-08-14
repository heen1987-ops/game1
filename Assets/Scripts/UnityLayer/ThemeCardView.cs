using System;
using CircuitShift.Core.Meta;
using CircuitShift.Modules;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace CircuitShift.UnityLayer
{
    /// <summary>One tile in the Collection grid: shows the theme's name/cost/lock state and reports taps upward.</summary>
    public class ThemeCardView : MonoBehaviour
    {
        [SerializeField] private TMP_Text nameText;
        [SerializeField] private TMP_Text costText;
        [SerializeField] private GameObject lockedOverlay;
        [SerializeField] private GameObject selectedOverlay;
        [SerializeField] private Button actionButton;

        public event Action<string> Tapped;

        private string themeId;

        private void Awake() => actionButton.onClick.AddListener(() => Tapped?.Invoke(themeId));

        public void Bind(ThemeDefinition theme, bool unlocked, bool selected)
        {
            themeId = theme.Id;
            nameText.text = LocalizationManager.Get(theme.NameKey);

            costText.gameObject.SetActive(!unlocked);
            if (!unlocked) costText.text = theme.CoinCost.ToString();

            lockedOverlay.SetActive(!unlocked);
            selectedOverlay.SetActive(selected);
        }
    }
}
