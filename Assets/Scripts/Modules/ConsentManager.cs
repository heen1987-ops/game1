using System;

namespace CircuitShift.Modules
{
    /// <summary>
    /// Shaped after Google's User Messaging Platform (UMP) SDK flow so the real
    /// implementation is a drop-in: on each launch, request a consent info update;
    /// if CanRequestAds is false, show the consent form before any ad request;
    /// expose a settings-menu entry point via ShowPrivacyOptionsForm when required.
    /// </summary>
    public interface IConsentProvider
    {
        void RequestConsentUpdate(Action<bool, string> onComplete);
        bool CanRequestAds { get; }
        bool IsPrivacyOptionsRequired { get; }
        void ShowPrivacyOptionsForm(Action<string> onComplete);
    }

    /// <summary>
    /// Dev-time stub that always grants consent immediately. Replace ConsentManager.Provider
    /// with a wrapper over GoogleMobileAds.Ump.Api.ConsentInformation / ConsentForm once the
    /// UMP SDK is imported - do not ship this stub, ad requests must gate on real consent.
    /// </summary>
    public class NoOpConsentProvider : IConsentProvider
    {
        public bool CanRequestAds { get; private set; }
        public bool IsPrivacyOptionsRequired => false;

        public void RequestConsentUpdate(Action<bool, string> onComplete)
        {
            CanRequestAds = true;
            onComplete?.Invoke(CanRequestAds, null);
        }

        public void ShowPrivacyOptionsForm(Action<string> onComplete) => onComplete?.Invoke(null);
    }

    public static class ConsentManager
    {
        public static IConsentProvider Provider { get; set; } = new NoOpConsentProvider();

        public static bool CanRequestAds => Provider.CanRequestAds;
        public static bool IsPrivacyOptionsRequired => Provider.IsPrivacyOptionsRequired;

        public static void RequestConsentUpdate(Action<bool, string> onComplete) => Provider.RequestConsentUpdate(onComplete);
        public static void ShowPrivacyOptionsForm(Action<string> onComplete) => Provider.ShowPrivacyOptionsForm(onComplete);
    }
}
