'use client'

import { useRouter } from 'next/navigation'

interface ErrorScreenProps {
  error: string
}

export default function ErrorScreen({ error }: ErrorScreenProps) {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-red-900/50 border border-red-700 rounded p-6">
          <h2 className="text-xl font-semibold text-red-200 mb-2">
            Erreur de chargement
          </h2>
          <p className="text-red-200 mb-4">{error}</p>
          <div className="space-x-2">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Réessayer
            </button>
            <button
              onClick={() => router.push('/repos')}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Retour aux dépôts
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
