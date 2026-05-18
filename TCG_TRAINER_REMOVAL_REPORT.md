# TCG Trainer Removal Report

## Removed files

- Backend: `utils/tcg/tcg_trainers.py`
- Frontend: `uma-dashboard-ui/public/tcg/cards/trainers/UMT_001.webp`
- Frontend: `uma-dashboard-ui/public/tcg/cards/trainers/UMT_002.webp`
- Frontend: `uma-dashboard-ui/public/tcg/cards/trainers/UMT_003.webp`
- Frontend: `uma-dashboard-ui/public/tcg/cards/trainers/UMT_004.webp`
- Frontend: `uma-dashboard-ui/public/tcg/cards/trainers/UMT_005.webp`
- Frontend: `uma-dashboard-ui/public/tcg/cards/trainers/UMT_006.webp`

## Removed systems

- Trainer card records were removed from the backend TCG card database.
- Trainer deck validation and trainer card hydration were removed from deck building.
- Trainer loadout validation and `trainer_id` room state were removed.
- Match setup no longer creates or places a trainer card into the field.
- Trainer zone migration and trainer zone move aliases were removed from backend state handling.
- Frontend TCG data loading no longer requests or caches trainers.
- Online deck select no longer renders trainer selection or waits for trainer confirmation.
- Practice setup no longer creates local trainer cards.
- Deck preview no longer displays a trainer slot or trainer card in the deck list modal.
- TCG trainer image assets were removed from the frontend public card assets.

## Remaining deck structure

```json
{
  "id": "deck-id",
  "name": "Deck Name",
  "description": "Deck description",
  "style": "Speed",
  "mainDeck": {
    "CARD-ID": 4
  }
}
```

Deck validation now requires exactly 40 main deck cards and at most 4 copies per card. There is no trainer slot.

## APIs removed

- `GET /tcg/trainers`

The remaining loadout API is:

```json
{
  "user_id": "user-id",
  "deck_id": "deck-id"
}
```
