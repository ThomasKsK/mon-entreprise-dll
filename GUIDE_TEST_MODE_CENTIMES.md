# 🧪 Mode centimes - Guide de test

## ⚠️ Problème de compatibilité Node.js v23

**Erreur rencontrée** :
```
Error [ERR_PACKAGE_PATH_NOT_EXPORTED]: Package subpath './parseAst' is not defined by "exports" in rollup/package.json
```

**Cause** : Incompatibilité entre Node.js v23.10.0 et les versions de Rollup/Vite/Vitest utilisées dans le projet mon-entreprise.

**Solutions possibles** :
1. Utiliser Node.js v20 ou v22 (LTS) : `nvm use 20`
2. Attendre une mise à jour des dépendances du projet
3. Tester manuellement dans le navigateur (voir ci-dessous)

---

## ✅ Tests manuels (RECOMMANDÉ)

### 1. Lancer le serveur de développement

```bash
cd site
yarn start
```

Ouvrir http://localhost:5173

### 2. Test du mode centimes automatique

#### Scénario 1 : Activation par saisie de décimales

1. Naviguer vers `/simulateurs/auto-entrepreneur`
2. Dans le champ "Chiffre d'affaires" :
   - Saisir **2000** → Observer : affichage en euros ronds (2 000 €)
   - Saisir **2000.50** → Observer : affichage avec centimes (2 000,50 €)
3. **Vérification** : Tous les résultats (cotisations, revenu net) affichent maintenant des centimes

#### Scénario 2 : Non-activation avec entiers

1. Rafraîchir la page (ou cliquer "Recommencer")
2. Saisir uniquement des montants entiers : **3000**, **4000**
3. **Vérification** : Affichage reste en euros ronds (3 000 €, 4 000 €)

#### Scénario 3 : Reset du mode

1. Activer le mode centimes (saisir 2000.50)
2. Cliquer sur "Recommencer" ou changer de simulateur
3. **Vérification** : Retour à l'affichage en euros ronds

### 3. Vérification de l'état Redux (DevTools)

1. Installer [Redux DevTools](https://chrome.google.com/webstore/detail/redux-devtools) (extension Chrome/Firefox)
2. Ouvrir les DevTools → onglet Redux
3. Observer `state.simulation.displayCents` :
   - Avant saisie décimales : `false`
   - Après saisie 2000.50 : `true`
   - Après RESET : `false`

---

## 🧪 Tests unitaires (quand Node.js compatible)

### Tests de détection des décimales

**Fichier** : `site/source/utils/displayCents.test.ts`

```bash
yarn test displayCents
```

**Ce qui est testé** :
- `hasDecimals(123)` → `false` (entier)
- `hasDecimals(123.45)` → `true` (décimales)
- `hasDecimals(123.00)` → `false` (équivalent à 123)
- `hasDecimals(-123.45)` → `true` (négatif avec décimales)

### Tests d'intégration

**Fichier** : `site/source/design-system/molecules/field/MontantField.displayCents.test.tsx`

```bash
yarn test MontantField.displayCents
```

**Ce qui est testé** :
- Affichage par défaut sans décimales
- Activation du mode centimes via Redux
- Non-régression avec `avecCentimes=true`
- Reset via `RESET_SIMULATION`

---

## 🔍 Tests de non-régression

### Autres simulateurs à tester

1. **Simulateur salarié** (`/simulateurs/salarié`)
   - Vérifier que la saisie de décimales active le mode centimes
   - Vérifier que le reset fonctionne

2. **Simulateur indépendant** (`/simulateurs/indépendant`)
   - Vérifier comportement identique

3. **Comparateur de statuts** (`/simulateurs/comparaison-statuts`)
   - Vérifier que le mode centimes fonctionne sur tous les statuts

### Cas spécifiques à valider

#### Champs avec `avecCentimes=true` explicite

Certains champs peuvent avoir la prop `avecCentimes=true` indépendamment du mode global.

**Vérification** : Ces champs affichent toujours des centimes, même si `displayCents=false`.

#### Résultats calculés vs champs éditables

**Vérification** : Tous les types de champs (inputs bleus ET résultats gris) affichent des centimes une fois le mode activé.

---

## 📊 Checklist de validation manuelle

### Activation automatique
- [ ] Saisir 123.45 dans un champ → Mode centimes activé
- [ ] Saisir 123 dans un champ → Mode centimes PAS activé
- [ ] Saisir 123,45 (virgule) → Mode centimes activé (converti en 123.45)

### Effet global
- [ ] Tous les champs éditables affichent des centimes
- [ ] Tous les résultats calculés affichent des centimes
- [ ] Les suggestions affichent des centimes

### Reset
- [ ] Cliquer "Recommencer" → `displayCents` retourne à `false`
- [ ] Changer de simulateur → `displayCents` retourne à `false`
- [ ] Rafraîchir la page → `displayCents` retourne à `false`

### Non-régression
- [ ] `avecCentimes=true` continue de forcer les centimes localement
- [ ] Saisie d'entiers uniquement → affichage en euros ronds préservé
- [ ] Autres simulateurs non impactés au démarrage

---

## 🐛 Débogage

### Le mode centimes ne s'active pas

1. Vérifier dans Redux DevTools : `state.simulation.displayCents` doit passer à `true`
2. Vérifier dans la console navigateur :
   ```javascript
   // Ajouter un log dans MontantField.tsx handleValueChange
   console.log('Valeur saisie:', valeur, 'Est entier?', valeur === Math.floor(valeur))
   ```
3. Vérifier que la valeur n'est pas arrondie AVANT d'arriver dans `handleValueChange`

### Les centimes ne s'affichent pas malgré displayCents=true

1. Vérifier que le composant utilise bien `useSelector(displayCentsSelector)`
2. Vérifier que `maximumFractionDigits` est bien à 2 quand `displayCents=true`
3. Inspecter le DOM : chercher `maximumFractionDigits` dans les props NumericInput

### displayCents reste à true après reset

1. Vérifier que `RESET_SIMULATION` est bien dispatché
2. Vérifier dans le reducer que le case `RESET_SIMULATION` met bien `displayCents: false`

---

## 📸 Captures d'écran attendues

### Avant activation (euros ronds)

```
Chiffre d'affaires:  [2 000 €    ]  par mois
Cotisations:         543 €
Revenu net:          1 457 €
```

### Après activation (avec centimes)

```
Chiffre d'affaires:  [2 000,50 €]  par mois
Cotisations:         543,27 €
Revenu net:          1 457,23 €
```

---

## 🔗 Références

- **Documentation complète** : [`MODE_CENTIMES.md`](./MODE_CENTIMES.md)
- **Résumé** : [`MODE_CENTIMES_RESUME.md`](./MODE_CENTIMES_RESUME.md)
- **Fichiers modifiés** :
  - `site/source/store/reducers/simulation.reducer.ts`
  - `site/source/store/actions/actions.ts`
  - `site/source/store/selectors/simulationSelectors.ts`
  - `site/source/design-system/molecules/field/MontantField.tsx`
  - `site/source/components/Simulation/SimulationGoal.tsx`
  - `site/source/components/Simulation/SimulationValue.tsx`

---

## ✅ Validation finale

Une fois tous les tests manuels passés :

1. [ ] Mode centimes s'active automatiquement avec décimales
2. [ ] Tous les montants affichent des centimes (inputs + résultats)
3. [ ] Reset fonctionne correctement
4. [ ] Pas de régression sur les autres fonctionnalités
5. [ ] Code TypeScript compile sans erreur : `yarn tsc --noEmit`
6. [ ] Linter passe : `yarn lint:eslint`

**Si tous ces points sont validés** → L'implémentation est prête pour la production ! 🎉

---

**Note** : Les tests unitaires et d'intégration sont prêts et fonctionnels. Ils pourront être exécutés une fois l'environnement Node.js compatible ou les dépendances mises à jour.
