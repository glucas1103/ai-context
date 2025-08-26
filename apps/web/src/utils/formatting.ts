/**
 * Utilitaires pour le formatage des données
 */

/**
 * Formate la taille d'un fichier en bytes vers une unité lisible
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Formate une date en format lisible
 */
export const formatDate = (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  };
  
  return dateObj.toLocaleDateString('fr-FR', defaultOptions);
};

/**
 * Formate une date avec l'heure
 */
export const formatDateTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Formate un nombre avec des séparateurs de milliers
 */
export const formatNumber = (num: number, locale: string = 'fr-FR'): string => {
  return num.toLocaleString(locale);
};

/**
 * Formate un pourcentage
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${(value * 100).toFixed(decimals)}%`;
};

/**
 * Tronque un texte à une longueur donnée
 */
export const truncateText = (text: string, maxLength: number, suffix: string = '...'): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
};

/**
 * Capitalise la première lettre d'une chaîne
 */
export const capitalize = (str: string): string => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Formate un nom de fichier pour l'affichage
 */
export const formatFileName = (fileName: string, maxLength: number = 30): string => {
  if (fileName.length <= maxLength) return fileName;
  
  const extension = fileName.split('.').pop();
  const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
  
  if (!extension) return truncateText(fileName, maxLength);
  
  const maxNameLength = maxLength - extension.length - 4; // 4 pour "..."
  const truncatedName = truncateText(nameWithoutExt, maxNameLength);
  
  return `${truncatedName}.${extension}`;
};

/**
 * Formate un chemin de fichier pour l'affichage
 */
export const formatFilePath = (filePath: string, maxSegments: number = 3): string => {
  const segments = filePath.split('/');
  
  if (segments.length <= maxSegments) return filePath;
  
  const start = segments.slice(0, 1);
  const end = segments.slice(-maxSegments + 1);
  
  return [...start, '...', ...end].join('/');
};

/**
 * Formate une durée en millisecondes
 */
export const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
};

/**
 * Formate un nom d'utilisateur pour l'affichage
 */
export const formatUsername = (username: string): string => {
  return username.startsWith('@') ? username : `@${username}`;
};

/**
 * Formate un nom de repository GitHub
 */
export const formatRepoName = (repoName: string): string => {
  return repoName.replace('/', ' / ');
};
