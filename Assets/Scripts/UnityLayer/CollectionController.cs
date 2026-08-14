using System.Collections.Generic;
using CircuitShift.Modules;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace CircuitShift.UnityLayer
{
    /// <summary>Collection screen: unlock themes with coins, pick the active one. Design doc's "코인과 테마 해제".</summary>
    public class CollectionController : MonoBehaviour
    {
        [SerializeField] private ThemeCardView cardPrefab;
        [SerializeField] private Transform cardContainer;
        [SerializeField] private TMP_Text titleText;
        [SerializeField] private TMP_Text coinsText;
        [SerializeField] private Button backButton;
        [SerializeField] private GameObject insufficientCoinsToast;

        private readonly List<ThemeCardView> cards = new List<ThemeCardView>();

        private void Start()
        {
            titleText.text = LocalizationManager.Get("collection.title");
            backButton.onClick.AddListener(() => SceneFlowManager.Load(SceneFlowManager.Scenes.Home));
            if (insufficientCoinsToast != null) insufficientCoinsToast.SetActive(false);

            BuildCards();
            RefreshCoins();
        }

        private void OnDestroy()
        {
            foreach (var card in cards)
            {
                if (card != null) card.Tapped -= OnCardTapped;
            }
        }

        private void BuildCards()
        {
            foreach (var theme in ThemeManager.AllThemes)
            {
                var card = Instantiate(cardPrefab, cardContainer);
                card.Tapped += OnCardTapped;
                cards.Add(card);
            }
            RefreshCards();
        }

        private void RefreshCards()
        {
            var themes = ThemeManager.AllThemes;
            for (int i = 0; i < cards.Count; i++)
            {
                var theme = themes[i];
                cards[i].Bind(theme, ThemeManager.IsUnlocked(theme.Id), theme.Id == ThemeManager.ActiveThemeId);
            }
        }

        private void RefreshCoins() => coinsText.text = SaveManager.Data.coins.ToString();

        private void OnCardTapped(string themeId)
        {
            if (ThemeManager.IsUnlocked(themeId))
            {
                ThemeManager.SetActive(themeId);
                RefreshCards();
                return;
            }

            if (ThemeManager.TryUnlock(themeId))
            {
                ThemeManager.SetActive(themeId);
                RefreshCards();
                RefreshCoins();
            }
            else
            {
                ShowInsufficientCoinsToast();
            }
        }

        private void ShowInsufficientCoinsToast()
        {
            if (insufficientCoinsToast == null) return;
            insufficientCoinsToast.SetActive(true);
            CancelInvoke(nameof(HideToast));
            Invoke(nameof(HideToast), 1.5f);
        }

        private void HideToast() => insufficientCoinsToast.SetActive(false);
    }
}
