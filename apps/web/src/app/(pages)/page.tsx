'use client'

import { track } from '@vercel/analytics'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Skip to main content link */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md z-50"
      >
        Aller au contenu principal
      </a>
      {/* Header Navigation */}
      <header className="bg-slate-800 border-b border-slate-700" role="banner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-blue-400">AIcontext</h1>
            </div>
            <div className="flex items-center space-x-4">
              <nav className="hidden md:flex space-x-8" role="navigation" aria-label="Navigation principale">
                <a href="#features" className="text-slate-300 hover:text-blue-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800 rounded px-2 py-1">Fonctionnalités</a>
                <a href="#solution" className="text-slate-300 hover:text-blue-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800 rounded px-2 py-1">Solution</a>
                <a href="#social-proof" className="text-slate-300 hover:text-blue-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800 rounded px-2 py-1">Témoignages</a>
              </nav>
              <Link 
                href="/login"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-2 md:px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800 text-sm md:text-base"
                onClick={() => track('Header_Login_Click')}
              >
                Se connecter
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main id="main-content" role="main">
      <section className="relative px-4 sm:px-6 lg:px-8 py-24 lg:py-32" aria-labelledby="hero-title">
        <div className="max-w-4xl mx-auto text-center">
          <h1 id="hero-title" className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            <span className="text-blue-400">Context Engineering</span> Software
          </h1>
          <h2 className="text-xl sm:text-2xl text-slate-300 font-medium mb-8">
            Améliorez votre vélocité de dev grâce à une plateforme de context engineering
          </h2>
          <p className="text-lg sm:text-xl text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed">
            Une IA qui analyse et comprend votre codebase pour vous aider à spec les epics et user stories plus rapidement et précisément. 
            Permettez à vos devs et aux IA de code de shipper plus facilement avec des tâches mieux définies.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/login"
              onClick={() => track('CTA_Essayer_Hero')}
              aria-label="Essayer AIcontext maintenant"
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 text-center"
            >
              Essayer Maintenant
            </Link>
            <Link
              href="/login"
              onClick={() => track('CTA_Inscrire_Hero')}
              aria-label="S&apos;inscrire à AIcontext"
              className="w-full sm:w-auto border border-slate-600 hover:border-slate-500 text-slate-300 hover:text-white font-semibold py-4 px-8 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-900 text-center"
            >
              S&apos;inscrire
            </Link>
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section id="solution" className="py-24 bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Pourquoi la vélocité dev <span className="text-red-400">stagne</span> ?
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Les specs d&apos;epics et user stories sont floues, causant hallucinations IA et régressions
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Problem */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-red-400 mb-4">❌ Problèmes actuels</h3>
              <div className="space-y-4">
                <div className="bg-slate-900 p-6 rounded-lg border border-red-400/20">
                  <h4 className="font-semibold text-red-300 mb-2">Specs floues</h4>
                  <p className="text-slate-400">Les epics et user stories manquent de contexte technique précis</p>
                </div>
                <div className="bg-slate-900 p-6 rounded-lg border border-red-400/20">
                  <h4 className="font-semibold text-red-300 mb-2">Hallucinations IA</h4>
                  <p className="text-slate-400">Les IA de code n&apos;ont pas le bon contexte et produisent des erreurs</p>
                </div>
                <div className="bg-slate-900 p-6 rounded-lg border border-red-400/20">
                  <h4 className="font-semibold text-red-300 mb-2">Régressions fréquentes</h4>
                  <p className="text-slate-400">Dépendances non gérées, impacts sous-estimés lors du développement</p>
                </div>
              </div>
            </div>

            {/* Solution */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-blue-400 mb-4">✅ Context Engineering Software</h3>
              <div className="space-y-4">
                <div className="bg-slate-900 p-6 rounded-lg border border-blue-400/20">
                  <h4 className="font-semibold text-blue-300 mb-2">Specs techniques précises</h4>
                  <p className="text-slate-400">IA qui analyse votre codebase pour enrichir epics et user stories</p>
                </div>
                <div className="bg-slate-900 p-6 rounded-lg border border-blue-400/20">
                  <h4 className="font-semibold text-blue-300 mb-2">Contexte automatique</h4>
                  <p className="text-slate-400">Mise à jour continue via analyse des PRs GitHub</p>
                </div>
                <div className="bg-slate-900 p-6 rounded-lg border border-blue-400/20">
                  <h4 className="font-semibold text-blue-300 mb-2">Zéro régression</h4>
                  <p className="text-slate-400">Gestion automatique des dépendances et impacts</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Bénéficiez du Context Engineering complet
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Gérez et enrichissez votre contexte pour booster votre équipe de développement
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-800 p-8 rounded-lg border border-slate-700">
              <div className="text-blue-400 text-4xl mb-4">📝</div>
              <h3 className="text-xl font-bold mb-4">Specs Techniques Précises</h3>
              <p className="text-slate-400 mb-4">
                Spécifications d&apos;epics et user stories enrichies automatiquement avec le contexte technique
              </p>
              <ul className="text-sm text-slate-500 space-y-2">
                <li>• Scoping automatisé</li>
                <li>• Dépendances identifiées</li>
                <li>• Impact analysis intégré</li>
              </ul>
            </div>

            <div className="bg-slate-800 p-8 rounded-lg border border-slate-700">
              <div className="text-blue-400 text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-bold mb-4">Onboarding Facilité</h3>
              <p className="text-slate-400 mb-4">
                Nouveaux développeurs et IA de code comprennent rapidement le contexte
              </p>
              <ul className="text-sm text-slate-500 space-y-2">
                <li>• Context mapping automatique</li>
                <li>• Guidelines techniques claires</li>
                <li>• Parcours d&apos;onboarding guidé</li>
              </ul>
            </div>

            <div className="bg-slate-800 p-8 rounded-lg border border-slate-700">
              <div className="text-blue-400 text-4xl mb-4">🔄</div>
              <h3 className="text-xl font-bold mb-4">Contexte Auto-Enrichi</h3>
              <p className="text-slate-400 mb-4">
                Une fois configuré, le contexte se met à jour automatiquement via l&apos;analyse des PRs GitHub
              </p>
              <ul className="text-sm text-slate-500 space-y-2">
                <li>• Analyse continue des PRs</li>
                <li>• Détection des changements d&apos;architecture</li>
                <li>• Mise à jour automatique du contexte</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section id="social-proof" className="py-24 bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Témoignages
            </h2>
            <p className="text-xl text-slate-400">
              Les équipes qui préparent déjà le futur du développement
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-900 p-8 rounded-lg border border-slate-700">
              <div className="mb-6">
                <div className="flex text-yellow-400 mb-4">
                  {'★'.repeat(5)}
                </div>
                <p className="text-slate-300 italic mb-4">
                  &ldquo;Nos user stories sont maintenant précises, nos devs juniors livrent sans régression et nos IA de code font du bon travail !&rdquo;
                </p>
              </div>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold mr-4">
                  A
                </div>
                <div>
                  <div className="font-semibold">Alex Martin</div>
                  <div className="text-sm text-slate-400">Tech Lead, Startup FinTech</div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 p-8 rounded-lg border border-slate-700">
              <div className="mb-6">
                <div className="flex text-yellow-400 mb-4">
                  {'★'.repeat(5)}
                </div>
                <p className="text-slate-300 italic mb-4">
                  &ldquo;Plus de specs floues ! Le context engineering nous fait gagner 60% de temps sur les spécifications techniques.&rdquo;
                </p>
              </div>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold mr-4">
                  S
                </div>
                <div>
                  <div className="font-semibold">Sarah Chen</div>
                  <div className="text-sm text-slate-400">Engineering Manager, Scale-up</div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 p-8 rounded-lg border border-slate-700">
              <div className="mb-6">
                <div className="flex text-yellow-400 mb-4">
                  {'★'.repeat(5)}
                </div>
                <p className="text-slate-300 italic mb-4">
                  &ldquo;Enfin un outil qui permet aux IA de code de produire des versions correctes en one shot !&rdquo;
                </p>
              </div>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold mr-4">
                  M
                </div>
                <div>
                  <div className="font-semibold">Marc Dubois</div>
                  <div className="text-sm text-slate-400">CTO, Entreprise SaaS</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Prêt à Booster Votre Vélocité Dev ?
          </h2>
          <p className="text-xl text-slate-400 mb-12">
            Rejoignez les équipes qui utilisent le context engineering pour des specs précises et du code sans régression
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/login"
              onClick={() => track('CTA_Commencer_Final')}
              aria-label="Commencer à utiliser AIcontext maintenant"
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 text-center"
            >
              Commencer Maintenant
            </Link>
            <Link
              href="/login"
              onClick={() => track('CTA_Demo_Final')}
              aria-label="Demander une démonstration d'AIcontext"
              className="w-full sm:w-auto border border-slate-600 hover:border-slate-500 text-slate-300 hover:text-white font-semibold py-4 px-8 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-900 text-center"
            >
              Demander une Démo
            </Link>
          </div>
        </div>
      </section>

      </main>

      {/* Footer */}
      <footer className="bg-slate-800 border-t border-slate-700 py-12" role="contentinfo">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-blue-400 mb-4">AIcontext</h3>
            <p className="text-slate-400 mb-6">
              Context Engineering Software pour améliorer la vélocité de développement
            </p>
            <div className="text-sm text-slate-500">
              © 2025 AIcontext. Ingénierie Contextuelle pour le développement de demain.
          </div>
        </div>
      </div>
      </footer>
    </div>
  )
}
