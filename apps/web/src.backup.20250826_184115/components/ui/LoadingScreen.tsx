'use client'

interface LoadingScreenProps {
  message?: string
}

export default function LoadingScreen({ 
  message = "Chargement de l'espace de travail..." 
}: LoadingScreenProps) {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-300">{message}</p>
      </div>
    </div>
  )
}
