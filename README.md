# TOC

Jeu de Toc numérique contre la machine.

## Prototype jouable

- 4 joueurs, 2 équipes de 2 ;
- 1 joueur humain + 3 machines ;
- cycle complet 5–4–4 et rotation du donneur ;
- échange simultané et secret entre partenaires ;
- moteur de règles indépendant de l'interface ;
- As/Roi, déplacements standards, 4, 7 séquentiel et Valet ;
- bases, captures, arrivées, défausse complète et contrôle du partenaire ;
- victoire d'équipe avec règle atomique du 7 ;
- modes d'assistance Facile, Normal et Expert ;
- IA tactique respectant les informations cachées ;
- échange IA orienté coopération avec le partenaire ;
- interface responsive ordinateur/tablette/mobile ;
- défausse publique limitée à sa carte supérieure ;
- nouvelle partie et écran victoire/défaite ;
- manifeste d'installation mobile et fonctionnement hors connexion via service worker.

## Lancer localement

```bash
npm install
npm run dev
```

## Validation

```bash
npm run typecheck
npm test
npm run build
```

La CI exécute automatiquement ces validations à chaque modification de `main`.

## Mise en ligne

Le dépôt contient un workflow GitHub Pages et Vite est configuré avec la base `/toc/`. Le déploiement devient opérationnel dès que GitHub Pages est autorisé pour le dépôt dans ses paramètres.

## Architecture

- `src/game/` : moteur, règles, déroulement des donnes et IA ;
- `src/main.tsx` : interface et interactions joueur ;
- `src/ui.css` : plateau, cartes, billes et adaptation mobile ;
- `public/manifest.webmanifest` et `public/sw.js` : installation et hors connexion ;
- `.github/workflows/test.yml` : validation automatique ;
- `.github/workflows/pages.yml` : publication web.

Le moteur reste indépendant de l'affichage afin de permettre une IA plus avancée et un futur mode multijoueur sans réécrire les règles.
