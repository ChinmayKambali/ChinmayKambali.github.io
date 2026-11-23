# Chinmay Kambali: Portfolio

Live site: **https://chinmaykambali.github.io/**

## Updating the portfolio (no code)

1. Double-click **`Portfolio Manager.bat`**. A browser tab opens with the manager.
2. Pick a category on the left (Projects, Experience, Skills, Education, Certifications, Achievements, Testimonials, Profile, Site Settings).
3. Click **+ Add new** (or **Edit**), fill in the form and hit **Save**. You can upload images, PDFs and certificates right from the form.
4. Click **Preview** to see the site with your changes.
5. Click **Publish**. The live site updates in about a minute.

Keep the black console window open while you use the manager, and close it when you're done.

## What's where

| Path | What it is |
|---|---|
| `docs/` | The website itself (GitHub Pages serves this folder) |
| `docs/data.json` | All the content. The manager edits this file for you |
| `docs/uploads/` | Uploaded images, resume and certificate files |
| `manager/` | The Portfolio Manager app (Node.js, no installs needed) |
| `manager/schema.js` | The categories and the fields each one asks for |
| `manager/backups/` | Automatic backup of `data.json` before every save (last 30, not published) |

Requirements: Node.js and Git (already set up on this PC), and the GitHub CLI logged in.
