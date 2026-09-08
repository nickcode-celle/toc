# TOC

Prototype du Jeu de Toc contre la machine.

## Objectif de la première version

- 4 joueurs, 2 équipes de 2
- 1 joueur humain + 3 joueurs contrôlés par la machine
- moteur de règles indépendant de l'interface
- règles de déplacement conformes à la variante définie pour ce projet
- IA ajoutée progressivement après validation du moteur

## Architecture

- `src/game/types.ts` : types du jeu
- `src/game/constants.ts` : constantes du plateau et des cartes
- `src/game/state.ts` : création de l'état initial
- `src/game/movement.ts` : logique de déplacement

Le moteur est volontairement séparé de l'affichage afin de pouvoir tester chaque règle avant de construire le plateau graphique.
