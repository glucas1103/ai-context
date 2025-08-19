## Product Requirements Document (PRD) — Ingénierie Contextuelle

### 1. Objectifs et Contexte Général

#### Objectifs

- **Objectifs Commerciaux**
  - Réduire le temps d’intégration (onboarding) d’un nouveau développeur sur un projet complexe de 50% en 3 mois.
  - Augmenter la vélocité de l’équipe (ex: nombre de story points par sprint) sur un projet Brownfield de 25% en 6 mois.
- **Objectifs Utilisateur**
  - Pour le "Gardien du Contexte" : Diminuer de 75% le temps passé à répondre à des questions récurrentes sur le projet.
  - Pour le "Consommateur de Contexte" : Réduire le temps de "collecte de contexte" avant de commencer une tâche complexe de plusieurs heures à moins de 15 minutes.

#### Contexte Général

Les équipes de développement sur des projets complexes (Brownfield) ne bénéficient pas des gains de productivité des outils d’IA modernes, car ces derniers manquent d’un contexte projet suffisant. Ce PRD décrit la création d’un outil web qui analyse les projets existants, permet à des experts d’enrichir cette analyse pour créer une base de connaissances vivante, et utilise cette base pour générer des tâches de développement contextualisées, les intégrer à l’IDE et maintenir la documentation à jour automatiquement. L’objectif est de résoudre ce problème de "mauvais contexte" pour décupler l’efficacité des développeurs.

#### Journal des Modifications

|       Date | Version | Description              | Auteur    |
| ---------: | :-----: | ------------------------ | --------- |
| 09/08/2025 |   1.0   | Création initiale du PRD | John (PM) |

> Note: Exporter vers Sheets (optionnel)

---

### 2. Exigences

#### Exigences Fonctionnelles (FR)

- **FR1** : Le système doit pouvoir se connecter à un dépôt Git distant (via URL et authentification) et analyser la codebase existante.
- **FR2** : Le système doit générer une base de connaissances structurée (fichiers `.md`) à partir de l’analyse du code.
- **FR3** : Le système doit fournir une interface conversationnelle (chat) permettant à un utilisateur expert de réviser, corriger et enrichir la base de connaissances.
- **FR4** : L’IA du système doit pouvoir ingérer un brief fonctionnel en langage naturel (ex: une user story).
- **FR5** : L’IA doit utiliser la base de connaissances pour identifier les dépendances et les fichiers impactés par le brief fonctionnel.
- **FR6** : L’IA doit générer une liste détaillée de tâches techniques et de sous-tâches à partir du brief et de son analyse.
- **FR7** : Le système doit afficher les tâches générées dans une interface utilisateur claire.
- **FR8** : Le système doit permettre d’exporter le contexte complet (dépendances, extraits de code pertinents, standards, etc.) pour une ou plusieurs tâches sélectionnées dans un unique fichier `.md`.
- **FR9** : Lors de l’export, le système doit s’intégrer à l’API du VCS (ex: GitHub) pour créer automatiquement une nouvelle branche Git.
- **FR10** : (Optionnel, si faisable) Le système doit tenter d’ouvrir l’IDE local du développeur avec le fichier de contexte nouvellement créé.
- **FR11** : Le système doit analyser les Pull Requests (PRs) approuvées pour détecter les changements dans le code.
- **FR12** : Le système doit mettre à jour la base de connaissances automatiquement en se basant sur les changements validés dans les PRs.

#### Exigences Non Fonctionnelles (NFR)

- **NFR1** : L’analyse initiale d’une codebase de taille moyenne (ex: 100 000 lignes de code) doit se terminer en moins de 30 minutes.
- **NFR2** : L’interface utilisateur web doit être sécurisée, réactive et compatible avec les dernières versions des navigateurs modernes (Chrome, Firefox, Safari, Edge).
- **NFR3** : Le système doit gérer de manière sécurisée les informations d’authentification pour les dépôts Git privés, en utilisant des standards comme OAuth ou les jetons d’accès personnels.
- **NFR4** : Le code source analysé et la base de connaissances générée doivent être stockés et traités de manière confidentielle et sécurisée.

---

### 3. Objectifs de l’Interface Utilisateur (UI/UX)

#### Vision Globale de l’UX

Une interface professionnelle, dense en informations mais intuitive, qui permet aux leaders techniques d’analyser et de gérer efficacement des contextes de projet complexes. L’expérience utilisateur doit inspirer la confiance et la précision, en privilégiant la clarté et la rapidité plutôt que les éléments décoratifs.

#### Paradigmes d’Interaction Clés

- **Vue à triple panneau (inspirée de Cursor)**
  - Gauche : La structure de la base de connaissances (arborescence des fichiers `.md`) pour la navigation.
  - Centre : Le contenu du fichier `.md` sélectionné, affiché pour la lecture.
  - Droite : Le panneau de l’agent conversationnel (chat), permettant à l’expert d’enrichir ou de poser des questions sur le contenu affiché au centre.
- **Édition Directe du Contenu**
  - En plus du chat, l’utilisateur (principalement le "Gardien du Contexte") peut directement éditer le contenu des fichiers `.md` dans le panneau central pour des modifications rapides.

#### Écrans et Vues Principales

- **Tableau de Bord des Projets** : Vue d’ensemble de tous les projets connectés et de l’état de leur analyse.
- **Explorateur de Contexte** : La vue principale à trois panneaux pour naviguer, lire, et enrichir la connaissance (via le chat ou l’édition directe).
- **Vue de Génération de Tâches (Workflow détaillé)** :
  - Saisie du Brief : L’utilisateur (PM, Lead) saisit un brief fonctionnel.
  - Génération IA ("La Magie") : Le système génère une user story complète avec son contexte et une liste de tâches techniques associées.
  - Validation & Sélection : Après validation de la user story, les tâches techniques apparaissent sous forme de to-do list. Le développeur peut sélectionner les tâches spécifiques qu’il va traiter.
  - Export du Contexte : En cliquant sur "Exporter", le système génère un fichier `context.md` contenant uniquement le contexte nécessaire pour les tâches sélectionnées.
- **Paramètres** : Écrans standards pour la gestion des utilisateurs, la connexion aux dépôts Git, etc.

#### Accessibilité

- **Norme visée** : WCAG 2.1 Niveau AA.

#### Identité Visuelle (Branding)

- À définir. Esthétique sobre, professionnelle et axée développeurs, avec un thème sombre par défaut.

#### Plateformes et Appareils Cibles

- **Plateforme** : Application web responsive, priorité desktop et laptop.

---

### 4. Hypothèses Techniques

- **Structure du Dépôt** : Monorepo (front-end et fonctions back-end serverless) avec séparation claire UI/Endpoints: UI sous `app/(pages)` et endpoints sous `app/api` (+ handlers techniques sous `app/auth`).
- **Architecture des Services** : Serverless (fonctions déployées indépendamment, ex: Vercel Functions, AWS Lambda).
- **Exigences de Test** : Pyramide de tests complète (unitaires, intégration, E2E).
- **Plateforme de Déploiement** : Vercel.
- **Langage et Framework** : TypeScript, Next.js (front + API routes).
- **Considération Future** : Python pour data science (potentiellement dépôt séparé), hors périmètre actuel.

---

### 5. Liste des Epics

- **Epic 1** : Fondation et Création de la Base de Connaissances
  - Objectif : Établir la fondation technique et livrer l’analyse de code -> base de connaissances enrichie/validée.
- **Epic 2** : Génération de Tâches par l’IA et Export de Contexte
  - Objectif : Transformer un brief fonctionnel en plan d’action technique détaillé et exporter un contexte complet.
- **Epic 3** : Intégration à l’IDE et Automatisation du Workflow
  - Objectif : Automatiser la préparation de l’environnement de développement (branche, commit `context.md`, ouverture IDE).
- **Epic 4** : Apprentissage Continu et Cycle de Vie de la Documentation
  - Objectif : Analyser les PRs fusionnées et mettre à jour automatiquement la base de connaissances.

---

### 6. Détail de l’Epic 1 : Fondation et Création de la Base de Connaissances

Objectif détaillé : Établir l’infrastructure technique et livrer la première fonctionnalité tangible (connexion à un dépôt Git, analyse, génération d’une base de connaissances, enrichissement via chat).

#### Story 1.1 : Initialisation du Projet et Configuration du Monorepo

- En tant que Développeur, je veux initialiser le projet avec un Monorepo Next.js/TypeScript et le configurer pour un déploiement sur Vercel.
- **Critères d’Acceptation**
  - Le Monorepo est créé.
  - Une application Next.js est initialisée.
  - TypeScript, ESLint et Prettier sont configurés.
  - Une page "Hello World" est déployée avec succès sur Vercel.

#### Story 1.2 : Connexion Sécurisée aux Dépôts Git

- En tant que Gardien du Contexte, je veux connecter l’application à mon dépôt Git (ex: GitHub) via OAuth.
- **Critères d’Acceptation**
  - L’utilisateur peut lancer un processus d’authentification OAuth depuis l’interface.
  - L’application reçoit et stocke de manière sécurisée un jeton d’accès.
  - Une fois connecté, l’utilisateur voit une liste de ses dépôts Git.

#### Story 1.3 : Analyse Statique de la Codebase

- En tant que Système, je veux cloner un dépôt sélectionné et analyser sa structure de fichiers.
- **Critères d’Acceptation**
  - Le back-end peut analyser l’arborescence d’un dépôt privé en utilisant le jeton d’accès de l’utilisateur.
  - Le système parcourt l’arborescence du projet cloné.
  - Le système génère une représentation structurée (ex: JSON) de l’arborescence des fichiers.

#### Story 1.4 : Génération et Affichage de la Documentation par Défaut

- En tant que Gardien du Contexte, je veux une documentation de base qui reflète la structure des fichiers du code.
- **Critères d’Acceptation**
  - Le système génère une structure de fichiers `.md` miroir de l’arborescence du code.
  - L’interface à trois panneaux affiche cette structure et permet la lecture.

#### Story 1.5 : Création d’une Structure de Documentation Personnalisée

- En tant que Gardien du Contexte, je veux créer ma propre arborescence de dossiers et fichiers `.md` vides.
- **Critères d’Acceptation**
  - L’interface fournit des boutons pour créer de nouveaux dossiers et fichiers `.md` dans une vue "personnalisée".
  - L’utilisateur peut basculer entre la vue "par défaut" et la vue "personnalisée".

#### Story 1.6 : Remplissage de la Documentation Personnalisée par l’IA

- En tant que Gardien du Contexte, je veux commander à l’IA de remplir un fichier personnalisé à partir d’une instruction de haut niveau.
- **Critères d’Acceptation**
  - L’utilisateur peut sélectionner un fichier dans sa structure personnalisée.
  - Dans le panneau de chat, il peut donner une commande (ex: "Remplis ce document avec toutes les informations sur l’authentification").
  - L’IA analyse la codebase, synthétise les informations pertinentes et rédige le contenu dans le fichier sélectionné.
  - Les modifications sont sauvegardées.

---

### 7. Détail de l’Epic 2 : Génération de Tâches par l’IA et Export de Contexte

Objectif détaillé : Livrer la fonctionnalité centrale de transformation d’un brief en plan d’action technique détaillé, affiché et raffinable, puis exportable en contexte.

#### Story 2.1 : Interface de Saisie du Brief et de Visualisation des Tâches

- En tant que Gardien du Contexte, je veux soumettre un brief fonctionnel et visualiser la liste de tâches générée.
- **Critères d’Acceptation**
  - Nouvelle vue "Génération de Tâches".
  - Zone de texte pour écrire le brief (ex: user story).
  - Zone d’affichage pour le résultat, initialement vide.

#### Story 2.2 : Moteur IA de Génération de Tâches

- En tant que Système, je veux analyser un brief et la base de connaissances pour générer une user story détaillée et des tâches techniques.
- **Critères d’Acceptation**
  - Une API back-end accepte un brief et un identifiant de projet.
  - L’IA identifie les dépendances via la base de connaissances.
  - L’API retourne une réponse structurée (ex: JSON) avec user story formatée et liste de tâches techniques.

#### Story 2.3 : Affichage et Raffinement Itératif du Brouillon

- En tant que Gardien du Contexte, je veux afficher le résultat comme Markdown éditable et demander des modifications via le chat.
- **Critères d’Acceptation**
  - Résultat affiché comme `.md` standard dans le panneau central.
  - Édition directe du texte possible.
  - Chat à droite pour commander des modifications.
  - Tous les changements sont sauvegardés.

#### Story 2.4 : Finalisation de la Story et Création de la To-do List

- En tant que Gardien du Contexte, je veux "approuver" le document pour le transformer en liste de tâches exploitable.
- **Critères d’Acceptation**
  - Bouton "Approuver et Finaliser".
  - Au clic, parsing du Markdown et bascule vers une liste à cocher non-éditable.

#### Story 2.5 : Sélection de Tâches et Moteur d’Export de Contexte

- En tant que Développeur, je veux cocher des tâches et déclencher la création d’un fichier de contexte.
- **Critères d’Acceptation**
  - Cases à cocher fonctionnelles.
  - Bouton "Exporter le Contexte" actif si ≥ 1 tâche cochée.
  - Le clic déclenche la compilation du contexte en back-end.

#### Story 2.6 : Téléchargement du Fichier `context.md`

- En tant que Développeur, je veux télécharger le `context.md` généré.
- **Critères d’Acceptation**
  - Le clic sur "Exporter" déclenche le téléchargement du fichier dans le navigateur.

---

### 8. Détail de l’Epic 3 : Intégration à l’IDE et Automatisation du Workflow

Objectif détaillé : Automatiser la préparation de l’environnement développeur à partir du fichier de contexte (création de branche, commit, ouverture IDE).

#### Story 3.1 : Création de Branche via l’API Git

- En tant que Système, je veux créer une nouvelle branche via l’API du VCS (ex: GitHub).
- **Critères d’Acceptation**
  - Nouvelle branche créée à partir de la branche principale.
  - Convention de nommage standardisée (ex: `feature/TASK-123-description-courte`).
  - Gestion correcte des erreurs (branche existante, permissions).

#### Story 3.2 : Commit Automatique du Fichier de Contexte

- En tant que Système, je veux commiter le fichier `context.md` généré à la racine de la nouvelle branche.
- **Critères d’Acceptation**
  - Après création de la branche, ajout d’un commit via l’API du VCS.
  - Le commit contient un seul fichier `context.md` à la racine.
  - Message de commit standardisé (ex: `feat: Add context for TASK-123`).

#### Story 3.3 : Mise à Jour du Workflow d’Export dans l’UI

- En tant que Développeur, je veux que "Exporter" déclenche le workflow automatisé.
- **Critères d’Acceptation**
  - Bouton renommé (ex: "Préparer l’environnement de dev").
  - État de chargement pendant les opérations Git.
  - En cas de succès, affichage du nom de la branche et de la commande à copier/coller (ex: `git fetch && git checkout feature/TASK-123...`).

#### Story 3.4 (Optionnelle) : Lancement de l’IDE via un Protocole Personnalisé

- En tant que Développeur, je veux que l’application tente d’ouvrir mon IDE local directement sur la bonne branche.
- **Critères d’Acceptation**
  - Configuration d’un gestionnaire de protocole (ex: `vscode://`).
  - Après la création de la branche, tentative d’ouverture de l’URL personnalisée.
  - En cas d’échec, affichage des instructions manuelles de la Story 3.3 sans erreur.

---

### 9. Détail de l’Epic 4 : Apprentissage Continu et Cycle de Vie de la Documentation

Objectif détaillé : Fermer la boucle via l’analyse des PRs fusionnées, comparaison aux spécifications, et mise à jour de la base de connaissances.

#### Story 4.1 : Détection et Analyse des Pull Requests Fusionnées

- En tant que Système, je veux détecter la fusion d’une PR liée à nos tâches.
- **Critères d’Acceptation**
  - Abonnement aux webhooks du VCS (ex: GitHub) pour les événements de PR.
  - Identification des PRs liées aux tâches (ex: via le nom de la branche).
  - Récupération des informations de la PR (fichiers modifiés, diff) une fois fusionnée.

#### Story 4.2 : IA de Comparaison et de Suggestion de Mise à Jour

- En tant que Système, je veux comparer les changements de code de la PR avec la base de connaissances pour suggérer des mises à jour.
- **Critères d’Acceptation**
  - Analyse du diff de code de la PR.
  - Identification des fichiers de la base de connaissances impactés.
  - Génération de suggestions de mise à jour (ex: "La fonction X a été modifiée, mettre à jour sa description dans `module_Y.md`").

#### Story 4.3 : Affichage des Suggestions en Mode "Diff"

- En tant que Gardien du Contexte, je veux voir les suggestions directement dans le fichier concerné sous forme de diff.
- **Critères d’Acceptation**
  - Signalement des fichiers avec suggestions (ex: icône).
  - À l’ouverture, affichage du contenu avec ajouts/suppressions mis en évidence.
  - Boutons "Accepter" et "Rejeter" pour chaque bloc.

#### Story 4.4 : Application des Mises à Jour depuis la Vue "Diff"

- En tant que Gardien du Contexte, je veux appliquer mes décisions (accepter/rejeter) au document.
- **Critères d’Acceptation**
  - "Accepter" intègre la suggestion et retire la mise en évidence.
  - "Rejeter" annule la suggestion et retire la mise en évidence.
  - Les changements finaux sont sauvegardés dans le fichier `.md` de la base de connaissances.
