using System;
using System.Collections.Generic;
using CircuitShift.Core;
using UnityEngine;

namespace CircuitShift.UnityLayer
{
    /// <summary>
    /// Visual + input front-end for one grid cell. Owns no gameplay state -
    /// it just mirrors a Core.TileData and reports taps upward. GameController
    /// decides whether a tap is allowed to actually rotate the tile.
    /// </summary>
    [RequireComponent(typeof(SpriteRenderer), typeof(BoxCollider2D))]
    public class TileView : MonoBehaviour
    {
        [Serializable]
        public struct TypeSprite
        {
            public TileType Type;
            public Sprite Sprite;
        }

        [SerializeField] private TypeSprite[] spritesByType;
        [SerializeField] private SpriteRenderer spriteRenderer;

        public event Action<TileView> Tapped;

        public GridPos GridPosition { get; private set; }
        public TileData Data { get; private set; }

        private Dictionary<TileType, Sprite> spriteLookup;

        private void Awake()
        {
            if (spriteRenderer == null) spriteRenderer = GetComponent<SpriteRenderer>();
            spriteLookup = new Dictionary<TileType, Sprite>();
            foreach (var entry in spritesByType)
                spriteLookup[entry.Type] = entry.Sprite;
        }

        public void Bind(GridPos gridPosition, TileData data)
        {
            GridPosition = gridPosition;
            Data = data;
            Refresh();
        }

        public void SetTint(Color color) => spriteRenderer.color = color;

        /// <summary>Re-reads Data (type + rotation) and updates the sprite/transform to match.</summary>
        public void Refresh()
        {
            if (spriteLookup != null && spriteLookup.TryGetValue(Data.Type, out var sprite))
                spriteRenderer.sprite = sprite;
            else if (Data.Type != TileType.Empty)
                Debug.LogWarning($"TileView: no sprite assigned for {Data.Type}", this);

            // Clockwise on screen = negative Z rotation under Unity's standard 2D (Y-up) convention.
            transform.localRotation = Quaternion.Euler(0f, 0f, -90f * Data.RotationSteps);
        }

        private void OnMouseDown() => Tapped?.Invoke(this);
    }
}
