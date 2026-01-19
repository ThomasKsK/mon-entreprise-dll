# 🎯 Mode centimes automatique - Résumé

## Fonctionnalité implémentée

**Mode centimes automatique** : Dès qu'un utilisateur saisit un montant avec des décimales (ex: 123.45€) dans un champ, **tous** les montants du simulateur s'affichent avec 2 décimales au lieu d'arrondir à l'euro.

## Déclenchement

- ✅ Détection automatique dans `MontantField` lors de la saisie
- ✅ Condition : `valeur !== Math.floor(valeur)` (nombre avec décimales)
- ✅ Action : `dispatch(setDisplayCents(true))`

## Architecture

```
État Redux (simulation.displayCents: boolean)
      ↓
displayCentsSelector
      ↓
Composants : MontantField, SimulationGoal, SimulationValue
      ↓
formatOptions.maximumFractionDigits: displayCents ? 2 : 0
```

## Fichiers modifiés (7 fichiers)

### Core
1. **`simulation.reducer.ts`** : Ajout de `displayCents: boolean` au state
2. **`actions.ts`** : Action `setDisplayCents(displayCents: boolean)`
3. **`simulationSelectors.ts`** : Selector `displayCentsSelector`

### Composants
4. **`MontantField.tsx`** : Détection + dispatch + utilisation du selector
5. **`SimulationGoal.tsx`** : Utilisation du selector pour `precision`
6. **`SimulationValue.tsx`** : Utilisation du selector pour `precision`

### Tests & Documentation
7. **Tests unitaires** : `displayCents.test.ts` (détection des décimales)
8. **Tests intégration** : `MontantField.displayCents.test.tsx` (comportement global)
9. **Documentation** : `MODE_CENTIMES.md` (architecture complète)

## Comportement

| Saisie utilisateur | displayCents | Affichage |
|--------------------|--------------|-----------|
| 2000 (entier) | `false` | 2 000 € |
| 2000.50 (décimales) | `true` → activation | 2 000,50 € |
| Après activation | `true` | Tous les montants : X XXX,XX € |

## Reset

`RESET_SIMULATION` → `displayCents: false` (retour à l'euro rond)

## Tests

✅ Détection des décimales : `hasDecimals(123.45)` → `true`  
✅ Activation globale : Tous les champs affichent des centimes  
✅ Non-régression : `avecCentimes=true` continue de fonctionner  
✅ Reset : `displayCents` revient à `false`

## Avantages

- ✅ Pas de bouton UI (activation transparente)
- ✅ Global au simulateur (cohérence)
- ✅ Compatible avec `avecCentimes` prop existante
- ✅ Minimal : 1 boolean dans le state Redux
- ✅ Réversible via `RESET_SIMULATION`

## Points d'attention

- ⚠️ Pas de désactivation manuelle (seulement via reset)
- ⚠️ Global au simulateur actif (pas par champ)
- ⚠️ Impacte tous les champs montants (éditables + calculés)

## Références

- Issue : #2778
- Connexe : #2497, #618
- Documentation complète : [`MODE_CENTIMES.md`](./MODE_CENTIMES.md)
