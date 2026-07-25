# N5帳 (N5-chō) — Minna no Nihongo N5 Flashcards

A single-page flashcard app for drilling N5 vocabulary. Pure HTML/CSS/JS —
no build step, no server, deploys straight to GitHub Pages.

**Front of card:** Kanji (or Hiragana/Katakana if no Kanji exists for that word) + reading
**Back of card:** Romaji + English meaning

Kanji and readings are set in **Klee One**, a free Google Font with a textbook-style
handwritten character.

## Features

- **Lesson filter** — dropdown to study one lesson (1–25) or everything
- **Search** — live search across Kanji, Hiragana, Romaji, and Meaning
- **Favorites** — star any word, then filter to "Favorites only" to drill your weak spots. Saved in your browser (`localStorage`), so it persists between visits
- **Shuffle** — randomize the current deck order
- **Keyboard shortcuts** — `←` `→` navigate, `space`/`enter` flip, `f` favorite, `s` shuffle
- **Swipe** on mobile to move between cards
- **1,106 words** across all 25 lessons, loaded from `data.js`

## Deploying to GitHub Pages

1. Create a new repo on GitHub (e.g. `n5-flashcards`) and push these files to it:
   ```
   git init
   git add .
   git commit -m "N5 flashcards"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git push -u origin main
   ```
2. On GitHub: **Settings → Pages → Source → Deploy from a branch → `main` / `root`** → Save.
3. Your app will be live at `https://<your-username>.github.io/<repo-name>/` within a minute or two.

No other configuration needed — it's a fully static site.

## Updating the vocabulary

The word list lives in `data.js` as a plain JavaScript array assigned to
`VOCAB_DATA`. Each entry looks like:

```js
{ id: 0, lesson: 1, kanji: "", hiragana: "わたし", romaji: "watashi", meaning: "I" }
```

To regenerate `data.js` from an updated CSV (columns: `Lesson, Kanji, Hiragana, Romaji, Meaning`),
run this locally with Python 3. Some source spreadsheets use a dash (`—`) as a
placeholder in the Kanji column instead of leaving it blank — the script below
strips that out so the app correctly falls back to showing Hiragana/Katakana big
on the card instead of a stray dash:

```python
import csv, json

DASH_PLACEHOLDERS = {"—", "-", "ー", "−", "‐", ""}

with open("your_file.csv", encoding="utf-8-sig") as f:
    rows = []
    for i, row in enumerate(csv.DictReader(f)):
        kanji = row["Kanji"].strip()
        if kanji in DASH_PLACEHOLDERS:
            kanji = ""
        rows.append({
            "id": i,
            "lesson": int(row["Lesson"]),
            "kanji": kanji,
            "hiragana": row["Hiragana"].strip(),
            "romaji": row["Romaji"].strip(),
            "meaning": row["Meaning"].strip(),
        })

with open("data.js", "w", encoding="utf-8") as f:
    f.write("const VOCAB_DATA = ")
    json.dump(rows, f, ensure_ascii=False)
    f.write(";")
```

Then commit and push the new `data.js` — no other file needs to change.

## File structure

```
index.html   markup
style.css    design system (Japanese stationery inspired — indigo/hanko-red palette, Klee One kanji font)
app.js       filtering, search, favorites, flip + navigation logic
data.js      vocabulary data (generated from your CSV)
```
