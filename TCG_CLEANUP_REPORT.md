# TCG Cleanup Report

## Data Ownership

- Backend is now the source of truth for cards, decks, trainers, validation, room logic, and match setup.
- Frontend no longer owns duplicated TCG card or deck databases.
- Frontend keeps UI rendering helpers, style themes, and asset/image cache logic only.

## Backend Changes

- Added `GET /tcg/cards`, `GET /tcg/decks`, and `GET /tcg/trainers`.
- Added `POST /tcg/rooms/{id}/loadout` with `user_id`, `deck_id`, and `trainer_id`.
- Added `utils/tcg/tcg_trainers.py`.
- Refactored `utils/tcg/tcg_decks.py` to use `utils/tcg/tcg_cards.py` instead of maintaining a duplicate card DB.
- Match start now waits for both player loadouts to be ready.
- Game setup shuffles each deck, draws 5, sets 5 life, and places the selected trainer into a trainer zone.
- Room sanitization now includes `trainer_confirmed` and `loadouts`.

## Frontend Changes

- Removed duplicated `src/data/tcgCards.js` and `src/data/tcgDecks.js`.
- Added one-shot TCG data loading through the API layer.
- Added memory/localStorage caching for cards, decks, and trainers.
- Added card image blob preload cache for local/external image URLs.
- Practice and online modes now consume the same backend deck/card/trainer data.
- Added deck and trainer selection to loadout confirmation.
- Added trainer zone rendering on the board.
- Kept multi-select, selected glow, drag selection, and hotkeys wired through the shared board.

## Controls

- Space is prevented from triggering focused board buttons.
- Hotkeys:
  - `R`: tap hovered or selected cards
  - `D`: move selected cards to discard
  - `H`: move selected cards to hand
  - `Esc`: clear selection

## Verification

- `python -m compileall D:\UmaDnDBot` passed.
- `npm run build` passed in `D:\UmaBotApp\uma-dashboard-ui`.
- Vite reported only the existing large chunk warning.
