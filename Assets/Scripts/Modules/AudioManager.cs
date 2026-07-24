using UnityEngine;

namespace CircuitShift.Modules
{
    /// <summary>
    /// Cross-scene audio singleton. Volume/mute are device settings, not game
    /// progress, so they live in PlayerPrefs rather than SaveManager's SaveData.
    /// </summary>
    public class AudioManager : MonoBehaviour
    {
        private const string MusicVolumeKey = "audio.musicVolume";
        private const string SfxVolumeKey = "audio.sfxVolume";
        private const string MutedKey = "audio.muted";

        public static AudioManager Instance { get; private set; }

        [SerializeField] private AudioSource musicSource;
        [SerializeField] private AudioSource sfxSource;

        public float MusicVolume { get; private set; } = 1f;
        public float SfxVolume { get; private set; } = 1f;
        public bool Muted { get; private set; }

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }

            Instance = this;
            DontDestroyOnLoad(gameObject);

            if (musicSource == null) musicSource = gameObject.AddComponent<AudioSource>();
            if (sfxSource == null) sfxSource = gameObject.AddComponent<AudioSource>();
            musicSource.loop = true;

            MusicVolume = PlayerPrefs.GetFloat(MusicVolumeKey, 1f);
            SfxVolume = PlayerPrefs.GetFloat(SfxVolumeKey, 1f);
            Muted = PlayerPrefs.GetInt(MutedKey, 0) == 1;
            ApplyVolumes();
        }

        public void PlayMusic(AudioClip clip)
        {
            if (clip == null || musicSource.clip == clip) return;
            musicSource.clip = clip;
            musicSource.Play();
        }

        public void StopMusic() => musicSource.Stop();

        public void PlaySfx(AudioClip clip, float volumeScale = 1f)
        {
            if (clip == null || Muted) return;
            sfxSource.PlayOneShot(clip, SfxVolume * volumeScale);
        }

        public void SetMusicVolume(float value)
        {
            MusicVolume = Mathf.Clamp01(value);
            PlayerPrefs.SetFloat(MusicVolumeKey, MusicVolume);
            ApplyVolumes();
        }

        public void SetSfxVolume(float value)
        {
            SfxVolume = Mathf.Clamp01(value);
            PlayerPrefs.SetFloat(SfxVolumeKey, SfxVolume);
        }

        public void SetMuted(bool muted)
        {
            Muted = muted;
            PlayerPrefs.SetInt(MutedKey, muted ? 1 : 0);
            ApplyVolumes();
        }

        private void ApplyVolumes()
        {
            musicSource.volume = Muted ? 0f : MusicVolume;
        }
    }
}
