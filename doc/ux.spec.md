# **Spécification UI/UX - Ingénierie Contextuelle**

## **1. Introduction**

Ce document définit les objectifs de l'expérience utilisateur, l'architecture de l'information, les parcours utilisateurs et les spécifications de design visuel pour le projet d'ingénierie contextuelle. Il sert de fondation pour le design visuel et le développement front-end, garantissant une expérience cohérente et centrée sur l'utilisateur.

### **Mise à Jour Post-Refactorisation**

Suite à la refactorisation complète du codebase (Story 1.7), l'interface utilisateur bénéficie d'une architecture technique améliorée qui permet une meilleure maintenabilité, performance et évolutivité. Les composants sont maintenant organisés de manière modulaire, facilitant l'ajout de nouvelles fonctionnalités et l'amélioration de l'expérience utilisateur.

### **Objectifs et Principes UX Généraux**

- **Personas Cibles :**
  - **Le "Gardien du Contexte" (CTO, Tech Lead) :** A besoin de contrôle, de précision et d'efficacité pour superviser et enrichir la connaissance.
  - **Le "Consommateur de Contexte" (Développeur) :** A besoin de clarté, de rapidité et d'un chemin sans friction pour obtenir le contexte dont il a besoin pour coder.
- **Objectifs d'Utilisabilité :**
  - **Efficacité :** Réduire drastiquement le temps de collecte de contexte avant de commencer une tâche (passer de plusieurs heures à quelques minutes).
  - **Confiance :** L'utilisateur doit avoir une confiance absolue dans la qualité et la pertinence des informations présentées.
  - **Intuitivité :** L'interface à trois panneaux doit permettre une navigation et une interaction fluides, même avec une grande densité d'informations.
- **Principes de Design :**
  1. **Clarté avant tout :** Chaque élément de l'interface doit être sans ambiguïté. Privilégier la lisibilité et la compréhension immédiate.
  2. **Efficacité et Rapidité :** Le design doit minimiser le nombre de clics et le temps nécessaire pour accomplir les tâches clés.
  3. **Fiabilité et Transparence :** L'interface doit clairement indiquer l'état du système, la source des informations et l'impact des actions de l'utilisateur.

## **2. Architecture de l'Information (IA)**

### **Plan du Site / Inventaire des Écrans**

```
graph TD
    subgraph "Hors d'un Espace de Travail"
        A[Page de Connexion]
        E[Paramètres du Compte]
        E -- "Gérer les repos connectés" --> E
    end

    subgraph "Espace de Travail Actif (Repo Sélectionné)"
        subgraph "Barre de Titre"
            DD["Sélecteur de Repo (ex: mon-projet-principal)"]
        end
        subgraph "Navigation Principale (Sidebar)"
            S1["(Futur) Inbox"]
            S2["(Futur) My Issues"]
            C["Onglet: Context"]
            D["Onglet: Issues"]
            F["Lien: Paramètres du Projet"]
        end
        subgraph "Vues"
            V1[Vue Explorateur de Contexte (Triple Panneau)]
            V2[Vue Génération de Tâches]
            V3[Page des Paramètres du Projet]
        end
    end

    A --> DD;
    DD -- "Ouvre le menu" --> E;
    DD -- "Change de repo" --> C;

    C --> V1;
    D --> V2;
    F --> V3;

```

### **Structure de Navigation**

- **Navigation Principale :** Le changement d'espace de travail (dépôt Git) se fait via un **sélecteur/menu déroulant** en haut à gauche de l'interface. Les paramètres globaux du compte sont accessibles depuis ce menu.
- **Navigation Secondaire :** Une fois dans un espace de travail, une barre latérale affiche les sections principales de cet espace : `Context` et `Issues`. Des liens pour de futures fonctionnalités (`Inbox`, `My Issues`) y sont présents.
- **Fil d'Ariane (_Breadcrumbs_) :** Maintenu dans les vues `Context` et `Issues` pour faciliter la navigation en profondeur.

## **3. Parcours Utilisateurs**

### **Parcours 1 : Enrichissement de la Base de Connaissances**

- **Objectif de l'Utilisateur :** "En tant que 'Gardien du Contexte', mon but est de valider, corriger et enrichir la documentation générée par l'IA pour qu'elle devienne une source de vérité fiable pour mon équipe."
- **Diagramme du Parcours :**

```
graph TD
    A[Arrivée sur l'onglet 'Context'] --> B[Navigue dans l'arborescence de la connaissance];
    B --> C[Sélectionne un fichier .md];
    C --> D[Lit le contenu dans le panneau central];
    D --> E{Le contenu est-il correct et complet?};
    E -- "Non, à corriger" --> F{Choix de l'action};
    F -- "Édition Directe" --> G[Modifie le texte dans le panneau central];
    F -- "Utiliser le Chat IA" --> H[Donne une commande de correction à l'IA];
    G --> I[Sauvegarde des modifications];
    H --> I;
    I --> D;
    E -- "Oui, mais à enrichir" --> J[Donne une commande d'ajout à l'IA dans le chat];
    J --> I;
    E -- "Oui, et complet" --> K[Fin du parcours pour ce fichier];

```

### **Parcours 2 : Génération et Export d'un Contexte de Tâche**

- **Objectif de l'Utilisateur :** "En tant que 'Consommateur de Contexte' (Développeur), mon but est de transformer rapidement un brief fonctionnel en un contexte technique complet et fiable."
- **Diagramme du Parcours :**

```
graph TD
    A[Arrivée sur l'onglet 'Issues'] --> B[Clique sur 'Nouvelle Tâche'];
    B --> C[Saisit un brief fonctionnel];
    C --> D[Clique sur 'Générer'];
    D --> E[L'IA génère un brouillon de story/tâches au format .md];
    E --> F[Affiche le brouillon .md en mode édition];
    F --> G{Le brouillon est-il satisfaisant?};
    G -- "Non, à modifier" --> H[L'utilisateur édite le .md ou itère avec l'IA via le chat];
    H --> F;
    G -- "Oui" --> I[L'utilisateur clique sur 'Approuver et Finaliser'];
    I --> J[Le système affiche la liste de tâches à cocher];
    J --> K[Le développeur sélectionne les tâches à réaliser];
    K --> L[Clique sur 'Exporter le Contexte'];
    L --> M[Le fichier context.md est téléchargé];
    M --> N[Fin du parcours];

```

### **Parcours 3 : Documentation Personnalisée**

- **Objectif de l'Utilisateur :** "En tant que 'Gardien du Contexte', mon but est de créer et maintenir une documentation personnalisée adaptée à mes besoins métier."
- **Diagramme du Parcours :**

```
graph TD
    A[Arrivée sur l'onglet 'Documentation'] --> B[Navigue dans la structure personnalisée];
    B --> C[Sélectionne un fichier ou dossier];
    C --> D{Action souhaitée?};
    D -- "Créer nouveau" --> E[Clique sur 'Nouveau fichier/dossier'];
    D -- "Éditer existant" --> F[Ouvre l'éditeur TipTap];
    E --> G[Saisit le nom et le type];
    G --> H[Crée l'élément dans la structure];
    F --> I[Édite le contenu en markdown];
    I --> J[Auto-sauvegarde en temps réel];
    H --> K[Fin du parcours];
    J --> K;

```

## **4. Wireframes & Maquettes**

- **Outil de Design :** **Figma**. Les maquettes haute-fidélité seront créées et maintenues dans un projet Figma partagé.
- **Écran Clé : Explorateur de Contexte (Vue Triple Panneau)**
  - **Objectif :** Fournir une interface intégrée pour naviguer, lire, et enrichir la base de connaissances.
  - **Éléments Clés :**
    - **Panneau de Gauche (Navigation) :** Sélecteur de vue (défaut/personnalisé), arborescence des fichiers, barre de recherche.
    - **Panneau Central (Contenu) :** Visionneuse/éditeur de Markdown, affichage en mode "diff" pour les suggestions.
    - **Panneau de Droite (Action/IA) :** Interface de chat conversationnel avec agents spécialisés.

## **5. Bibliothèque de Composants / Design System**

- **Approche :** Création d'un Design System personnalisé en utilisant **Tailwind CSS** pour un équilibre entre vitesse de développement et design unique.
- **Composants Fondamentaux (MVP) :** Boutons, champs de saisie, menus déroulants, navigation latérale, onglets, composants de chat, panneaux.

### **Composants Universels Implémentés**

L'architecture a évolué vers un système de composants universels réutilisables :

#### **ThreePanelsLayout**
- **Objectif :** Layout triple panneau réutilisable pour toutes les vues principales
- **Props :** `leftPanel`, `centerPanel`, `rightPanel`, `layoutConfig`
- **Utilisation :** Pages Context, Documentation, Issues

#### **UniversalTreePanel**
- **Objectif :** Navigation arborescente universelle avec support CRUD
- **Fonctionnalités :** Drag & drop, édition inline, recherche, sélection multiple
- **Utilisation :** Navigation des fichiers, structure de documentation

#### **UniversalContentPanel**
- **Objectif :** Affichage et édition de contenu avec support multi-mode
- **Modes :** Monaco Editor (code), TipTap Editor (markdown), Vue diff
- **Utilisation :** Affichage de fichiers, édition de documentation

#### **UniversalChatPanel**
- **Objectif :** Interface de chat avec agents IA spécialisés
- **Fonctionnalités :** Streaming, historique, agents contextuels, markdown
- **Utilisation :** Chat avec agents analysis/documentation

#### **RichTextEditor (TipTap)**
- **Objectif :** Éditeur markdown riche pour la documentation
- **Fonctionnalités :** Auto-sauvegarde, extensions markdown, thème sombre
- **Utilisation :** Édition de documentation personnalisée

## **6. Branding & Guide de Style**

- **Palette de Couleurs (Thème Sombre) :**
  - **Fond :** `#111827` (Gris foncé)
  - **Panneaux :** `#1F2937` (Gris moyen)
  - **Accent :** `#3B82F6` (Bleu vif)
  - **Texte :** `#D1D5DB` / `#FFFFFF`
- **Typographie :**
  - **Interface :** `Inter` (ou police système sans-serif)
  - **Code :** `JetBrains Mono`
- **Iconographie :** `Heroicons`
- **Espacement & Grille :** Basé sur une grille de **8px**.

## **7. Exigences d'Accessibilité**

- **Standard :** Conformité au niveau **WCAG 2.1 AA**.
- **Exigences Clés :** Contrastes de couleurs suffisants, navigation au clavier complète, compatibilité avec les lecteurs d'écran.

## **8. Stratégie de Responsive Design**

- **Bureau / Grand Écran :** Vue à trois panneaux par défaut.
- **Tablette :** Vue à deux panneaux (Navigation + Contenu), avec le chat accessible via un bouton.
- **Mobile :** Affichage d'un seul panneau à la fois, avec une navigation par onglets/icônes pour basculer entre les vues.

## **9. Animation & Micro-interactions**

- **Principes :** Les animations seront fonctionnelles, rapides (150-300ms) et subtiles.
- **Animations Clés :** Transitions douces pour les états (survol, focus), apparition fluide des panneaux, indicateurs de chargement discrets.

## **10. Considérations de Performance**

- **Objectifs :** First Contentful Paint < 1.8s, Interaction to Next Paint < 100ms.
- **Stratégies :** Optimisation des images, chargement progressif avec des "squelettes", découpage du code par route, mise en cache.

## **11. État d'Implémentation Actuel**

### **Pages Implémentées ✅**

- **Page de Connexion :** Interface OAuth GitHub avec Supabase Auth
- **Page des Dépôts :** Listing des repositories avec authentification
- **Page Context :** Vue triple panneau avec exploration de codebase
- **Page Documentation :** Éditeur TipTap avec structure personnalisée
- **Page Issues :** Workflow de génération de tâches (placeholder fonctionnel)

### **Composants Universels ✅**

- **ThreePanelsLayout :** Layout réutilisable pour toutes les vues
- **UniversalTreePanel :** Navigation arborescente avec React Arborist
- **UniversalContentPanel :** Affichage multi-mode (Monaco/TipTap)
- **UniversalChatPanel :** Chat avec agents IA (en développement)

### **Fonctionnalités Implémentées ✅**

- **Authentification OAuth GitHub :** Intégration complète avec Supabase
- **Analyse de Codebase :** API GitHub Trees pour exploration
- **Documentation Personnalisée :** CRUD complet avec TipTap
- **Architecture Universelle :** Refactorisation et nettoyage des composants

### **Architecture Technique Post-Refactorisation ✅**

- **Organisation Modulaire :** Composants organisés par domaine (layout, ui, documentation, workspace)
- **Types TypeScript Stricts :** Types bien organisés et typés pour toutes les API
- **Client API Unifié :** Gestion centralisée des appels API avec gestion d'erreurs
- **Constants Centralisées :** Endpoints, routes et configurations centralisés
- **Utilitaires Réutilisables :** Fonctions de formatage, authentification et gestion d'erreurs
- **Tests Améliorés :** 90% de succès des tests unitaires (133/148)
- **Documentation Technique :** Guide de développement complet et architecture mise à jour

## **12. Prochaines Étapes**

1. **Finalisation du Chat IA :** Compléter l'intégration Claude Code SDK
2. **Workflow de Génération de Tâches :** Implémenter la logique métier complète
3. **Tests et Optimisations :** Couverture de tests et optimisations de performance
4. **Documentation Utilisateur :** Guides d'utilisation et tutoriels
