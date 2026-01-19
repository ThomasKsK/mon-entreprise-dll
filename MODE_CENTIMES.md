# Mode centimes automatique - Documentation

## 📋 Contexte

Par défaut, les montants du simulateur mon-entreprise sont arrondis à l'euro près pour simplifier l'affichage. Cependant, certains utilisateurs ont besoin de saisir et visualiser des montants avec des centimes (ex: 1234.56€).

**Problème initial** : Il n'existait pas de moyen simple pour activer l'affichage des centimes sans modification du code.

**Solution implémentée** : Mode centimes automatique qui s'active dès qu'un utilisateur saisit un montant avec des décimales.

---

## 🎯 Objectif fonctionnel

1. **Activation automatique** : Dès qu'un utilisateur saisit un montant avec des décimales (ex: 123.45 ou 123,45) dans n'importe quel champ bleu (input éditable).

2. **Effet global** : Une fois activé, **tous** les champs montants du simulateur (éditables et calculés) affichent leurs valeurs avec 2 décimales.

3. **Pas de bouton UI** : L'activation est transparente, sans interface utilisateur dédiée.

4. **Réinitialisation** : Le mode se réinitialise lors d'un `RESET_SIMULATION` (changement de simulateur ou reset explicite).

---

## 🏗️ Architecture technique

### État global (Redux)

Le mode centimes est géré par un flag `displayCents: boolean` dans le state `Simulation`.

**Fichier** : `site/source/store/reducers/simulation.reducer.ts`

```typescript
export type Simulation = {
	config: SimulationConfig
	url: string
	hiddenNotifications: Array<string>
	situation: SituationPublicodes
	targetUnit: string
	displayCents: boolean  // ← NOUVEAU
	questionsRépondues: Array<QuestionRépondue>
	questionsSuivantes?: Array<DottedName>
	currentQuestion?: DottedName | null
}
```

**Initialisation** : `displayCents: false` lors de `SET_SIMULATION` et `RESET_SIMULATION`.

---

### Action Redux

**Fichier** : `site/source/store/actions/actions.ts`

```typescript
export const setDisplayCents = (displayCents: boolean) =>
	({
		type: 'SET_DISPLAY_CENTS',
		displayCents,
	}) as const
```

**Reducer case** :
```typescript
case 'SET_DISPLAY_CENTS':
	return {
		...state,
		displayCents: action.displayCents,
	}
```

---

### Selector Redux

**Fichier** : `site/source/store/selectors/simulationSelectors.ts`

```typescript
export const displayCentsSelector = (state: RootState) =>
	state.simulation?.displayCents ?? false
```

Retourne `false` par défaut si `simulation` est null.

---

### Détection des décimales

**Fichier** : `site/source/design-system/molecules/field/MontantField.tsx`

**Logique** : Dans `handleValueChange`, on vérifie si la nouvelle valeur saisie n'est pas un entier.

```typescript
const handleValueChange = (valeur: number | undefined) => {
	// Détecter si l'utilisateur saisit des décimales
	if (valeur !== undefined && !displayCents) {
		// Vérifier si la valeur a des décimales (n'est pas un entier)
		if (valeur !== Math.floor(valeur)) {
			dispatch(setDisplayCents(true))
		}
	}

	handleChange(valeur === undefined ? undefined : montant<U>(valeur, unité))
}
```

**Condition** :
- `valeur !== Math.floor(valeur)` → détecte si le nombre a une partie décimale
- Exemples : `123.45 !== 123` → true (a des décimales)
- `1000 === 1000` → false (pas de décimales)

---

### Formatage des montants

Les composants suivants utilisent `displayCentsSelector` pour adapter leur affichage :

#### 1. `MontantField.tsx` (champs éditables)

```typescript
const displayCents = useSelector(displayCentsSelector)
const afficherCentimes = avecCentimes || displayCents  // Priorité à avecCentimes si déjà true

<NumericInput
	formatOptions={{
		style: 'currency',
		currency: 'EUR',
		minimumFractionDigits: 0,
		maximumFractionDigits: afficherCentimes ? 2 : 0,
	}}
	// ...
/>
```

#### 2. `SimulationGoal.tsx` (objectifs de simulation)

```typescript
const displayCents = useSelector(displayCentsSelector)

const valeurFormatee = formatValue(evaluation, {
	displayedUnit,
	precision: displayCents ? 2 : round ? 0 : 2,
	language,
})

// Et pour RuleInput :
formatOptions={{
	maximumFractionDigits: displayCents ? 2 : round ? 0 : 2,
}}
```

#### 3. `SimulationValue.tsx` (valeurs calculées)

```typescript
const displayCents = useSelector(displayCentsSelector)

{formatValue(evaluation, {
	displayedUnit,
	precision: displayCents ? 2 : round ? 0 : 2,
	language,
})}
```

---

## 🔄 Flux de données

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Utilisateur saisit "2000.50" dans un champ bleu         │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. MontantField.handleValueChange détecte des décimales    │
│    → dispatch(setDisplayCents(true))                        │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Redux reducer met à jour state.simulation.displayCents  │
│    → displayCents: false  ──>  displayCents: true           │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Tous les composants abonnés à displayCentsSelector      │
│    réagissent au changement (via useSelector)              │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Affichage mis à jour :                                   │
│    - MontantField : maximumFractionDigits: 2                │
│    - SimulationGoal : precision: 2                          │
│    - SimulationValue : precision: 2                         │
│                                                              │
│    Résultat : Tous les montants affichent ".00" ou ".xx"   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 Fichiers modifiés

| Fichier | Changement |
|---------|------------|
| **`simulation.reducer.ts`** | Ajout du champ `displayCents: boolean` au type `Simulation`, initialisation à `false`, gestion de `SET_DISPLAY_CENTS` |
| **`actions.ts`** | Ajout de l'action `setDisplayCents(displayCents: boolean)` et du type dans `Action` |
| **`simulationSelectors.ts`** | Ajout du selector `displayCentsSelector` |
| **`MontantField.tsx`** | Détection des décimales dans `handleValueChange`, dispatch de `setDisplayCents(true)`, utilisation de `displayCentsSelector` |
| **`SimulationGoal.tsx`** | Import et utilisation de `displayCentsSelector` pour adapter `precision` et `maximumFractionDigits` |
| **`SimulationValue.tsx`** | Import et utilisation de `displayCentsSelector` pour adapter `precision` |

---

## 🧪 Tests

### Tests unitaires

**Fichier** : `site/source/utils/displayCents.test.ts`

- Fonction `hasDecimals(value)` pour vérifier si un nombre a des décimales
- Tests de cas limites : entiers, décimales, nombres négatifs, `123.00` (considéré comme entier)

### Tests d'intégration

**Fichier** : `site/source/design-system/molecules/field/MontantField.displayCents.test.tsx`

- Vérification que `displayCents` reste `false` par défaut
- Activation automatique lors de la saisie de décimales
- Vérification que tous les champs affichent des centimes une fois activé
- Non-régression : `avecCentimes=true` fonctionne toujours
- Réinitialisation lors de `RESET_SIMULATION`

---

## 🚀 Cas d'usage

### Scénario 1 : Simulateur auto-entrepreneur

1. L'utilisateur ouvre `/simulateurs/auto-entrepreneur`
2. Par défaut, les montants s'affichent en euros ronds : **2 000 €**
3. L'utilisateur saisit un chiffre d'affaires : **2 450.75 €**
4. **Activation automatique** : Le flag `displayCents` passe à `true`
5. Tous les résultats s'affichent avec centimes :
   - Cotisations : **543.27 €**
   - Revenu net : **1 907.48 €**
   - Impôt : **0.00 €**

### Scénario 2 : Saisie uniquement d'entiers

1. L'utilisateur saisit **2 000 €** (entier)
2. Puis **3 500 €** (entier)
3. **Pas d'activation** : Le flag reste à `false`
4. Affichage reste en euros ronds : **2 000 €**, **3 500 €**

### Scénario 3 : Reset de simulation

1. Mode centimes activé (`displayCents: true`)
2. L'utilisateur clique sur "Recommencer" ou change de simulateur
3. **Action** : `RESET_SIMULATION` dispatché
4. **État réinitialisé** : `displayCents: false`
5. Retour à l'affichage en euros ronds

---

## ⚠️ Points d'attention

### 1. Pas de désactivation manuelle

Une fois le mode centimes activé, l'utilisateur ne peut pas le désactiver manuellement (pas de bouton toggle). La seule façon de revenir à l'affichage en euros ronds est de réinitialiser la simulation.

**Raison** : Simplicité de l'UX. Si l'utilisateur a saisi des décimales, c'est qu'il en a besoin.

### 2. Cohérence avec `avecCentimes` prop

Le prop `avecCentimes` sur `MontantField` continue de fonctionner indépendamment.

**Priorité** : `avecCentimes || displayCents` → Si `avecCentimes=true`, les centimes s'affichent **même si** `displayCents=false`.

**Cas d'usage** : Certains champs spécifiques (ex: montant exact d'une facture) peuvent forcer l'affichage des centimes localement.

### 3. Impact sur les autres simulateurs

Le flag `displayCents` est **global au simulateur actif**. Si activé sur le simulateur auto-entrepreneur, il reste activé tant que l'utilisateur ne change pas de simulateur.

**Non-impacté** : Les autres simulateurs (salarié, indépendant, etc.) démarrent toujours avec `displayCents: false`.

### 4. Formatage avec `publicodes` `formatValue`

La fonction `formatValue` de publicodes utilise le paramètre `precision` :
- `precision: 0` → arrondi à l'euro
- `precision: 2` → arrondi au centime

**Important** : `formatValue` ne modifie PAS les valeurs calculées, seulement l'affichage.

### 5. Arrondi au centime dans `Montant.ts`

Tous les montants sont déjà arrondis au centime lors de leur création :

```typescript
const arrondirAuCentime = (valeur: number): number =>
	Math.round(valeur * 100) / 100
```

Donc même si `displayCents=false`, les valeurs internes sont précises au centime.

---

## 🔍 Diagnostic et débogage

### Vérifier l'état Redux

Dans les DevTools Redux, vérifier :

```javascript
state.simulation.displayCents  // Doit être true/false
```

### Vérifier qu'un composant utilise le selector

```typescript
const displayCents = useSelector(displayCentsSelector)
console.log('displayCents:', displayCents)  // Debug
```

### Vérifier la détection dans MontantField

Dans `handleValueChange`, ajouter un log :

```typescript
if (valeur !== undefined && !displayCents) {
	if (valeur !== Math.floor(valeur)) {
		console.log('Décimales détectées, activation du mode centimes')
		dispatch(setDisplayCents(true))
	}
}
```

---

## 🎨 Références

- **Issue GitHub** : #2778
- **Discussions connexes** : #2497
- **Ancienne tentative** : PR #618 (approche différente)
- **Références externes** : [MDN Intl.NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat)

---

## ✅ Checklist de validation

- [x] Ajout de `displayCents: boolean` au state Simulation
- [x] Action `setDisplayCents` créée et typée
- [x] Selector `displayCentsSelector` créé
- [x] Détection des décimales dans `MontantField.handleValueChange`
- [x] Adaptation du formatage dans `MontantField` (maximumFractionDigits)
- [x] Adaptation du formatage dans `SimulationGoal` (precision)
- [x] Adaptation du formatage dans `SimulationValue` (precision)
- [x] Tests unitaires pour la détection des décimales
- [x] Tests d'intégration pour le comportement global
- [x] Réinitialisation à `false` lors de `RESET_SIMULATION`
- [x] Documentation complète

---

## 📊 Performances

### Impact sur le rendu

**Minimal** : Le selector Redux `displayCentsSelector` est très léger (simple lecture d'un boolean).

**Re-render** : Quand `displayCents` change, seuls les composants qui utilisent `displayCentsSelector` se re-rendent (via `useSelector`).

### Memoization

Les composants `SimulationGoal` et `SimulationValue` ne nécessitent pas de memoization supplémentaire car ils sont déjà optimisés par Redux.

---

## 🔮 Améliorations futures possibles

1. **Bouton toggle manuel** : Ajouter un bouton pour désactiver manuellement le mode centimes
2. **Persistance dans l'URL** : Ajouter `?displayCents=true` dans l'URL pour partager des simulations avec centimes
3. **Détection plus intelligente** : Activer automatiquement si les résultats calculés ont des centimes significatives (ex: 1234.67 vs 1234.02)
4. **Mode "3 décimales"** : Pour des cas encore plus précis
5. **Configuration par simulateur** : Certains simulateurs pourraient forcer le mode centimes par défaut

---

## 📞 Support

Pour toute question ou bug lié au mode centimes :
1. Vérifier l'état Redux (`simulation.displayCents`)
2. Vérifier que les composants utilisent bien `displayCentsSelector`
3. Vérifier que la détection des décimales se déclenche (`Math.floor(valeur) !== valeur`)
4. Consulter les tests unitaires et d'intégration

---

**Date de création** : 19 janvier 2026  
**Auteur** : GitHub Copilot  
**Version** : 1.0
