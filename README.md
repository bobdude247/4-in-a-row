# 4 in a Row

A 2-player, single-screen **Connect Four** style game built with plain HTML, CSS, and JavaScript.

## Game rules

- The board is **6 rows x 7 columns**.
- Two players take turns dropping colored discs into a column.
- A disc always falls to the **lowest open row** in that column.
- First player to connect **4 discs in a row** wins.
  - Horizontal, vertical, and diagonal wins are supported.
- If the board fills and nobody has 4 in a row, the game is a **draw**.

## Features

- 2-player local gameplay on one screen
- Left/right player chip stacks
- Active player drags a chip from their stack and releases over a column to drop
- Custom color picker for each player
- Win detection + highlight of winning 4 discs
- Draw detection
- Reset game button
- Responsive layout for desktop/mobile browser sizes

## Run locally

This is a static site, so you can run it by opening [`index.html`](index.html).

## GitHub Pages deployment

This repo includes a GitHub Actions workflow at [`deploy-pages.yml`](.github/workflows/deploy-pages.yml) that publishes the site to the `gh-pages` branch on every push to `main`.

### One-time GitHub setup

1. Push this repo to GitHub.
2. In GitHub, open **Settings → Pages**.
3. Under **Build and deployment**, set:
   - **Source**: `Deploy from a branch`
   - **Branch**: `gh-pages` and `/ (root)`
4. Save.

After that, each push to `main` auto-deploys via GitHub Actions.

### Expected site URL

For this repository, Pages should be served at:

`https://bobdude247.github.io/4-in-a-row/`

## Project structure

- [`index.html`](index.html) – app markup and layout
- [`styles.css`](styles.css) – game styling and responsive behavior
- [`app.js`](app.js) – game state, turn logic, drop behavior, win/draw checks
- [`deploy-pages.yml`](.github/workflows/deploy-pages.yml) – GitHub Pages deployment workflow
