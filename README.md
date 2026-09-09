# TOC

Jeu de Toc numérique contre la machine.

## État actuel

Le prototype est maintenant jouable dans le navigateur :

- 4 joueurs, 2 équipes de 2 ;
- 1 joueur humain + 3 machines ;
- cycle complet de cartes 5–4–4 avec échange secret entre partenaires ;
- moteur de règles séparé de l'interface ;
- déplacements normaux, sorties As/Roi, 4, 7 séquentiel et Valet ;
- arrivées, bases, captures, défausse complète et contrôle du partenaire ;
- victoire d'équipe, y compris la règle atomique du 7 ;
- trois niveaux d'aide visuelle : Facile, Normal et Expert ;
- IA stratégique avec anticipation d'un coup ;
- interface responsive ordinateur/tablette/mobile ;
- carte supérieure de la défausse visible pendant le cycle.

## Lancer le jeu

```bash
npm install
npm run dev
```

Puis ouvrir l'adresse locale indiquée par Vite.

## Vérification

```bash
npm run typecheck
npm test
npm run build
```

La CI GitHub exécute automatiquement ces trois validations à chaque modification de `main`.

## Architecture

- `src/game/` : moteur, règles, déroulement des donnes et IA ;
- `src/main.tsx` : interface et interactions joueur ;
- `src/ui.css` : plateau, cartes, billes et adaptation mobile ;
- `.github/workflows/test.yml` : validation automatique.

Le moteur reste indépendant de l'affichage afin de permettre l'amélioration de l'IA, une future interface mobile native ou un mode multijoueur sans réécrire les règles.
