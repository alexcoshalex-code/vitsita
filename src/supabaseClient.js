import { createClient } from '@supabase/supabase-js'

// Переменные окружения должны быть определены в файле .env с префиксом VITE_
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Создаём и экспортируем экземпляр клиента Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Получает временную ссылку на скачивание файла из бакета 'guides'
 * @param {string} fileName - Имя файла в хранилище
 * @returns {Promise<string|null>} - Временная ссылка или null в случае ошибки
 */
export const getDownloadLink = async (fileName) => {
  try {
    const { data, error } = await supabase
      .storage
      .from('guides')
      .createSignedUrl(fileName, 600) // 600 секунд = 10 минут

    if (error) {
      console.error('Ошибка получения ссылки:', error.message)
      return null
    }

    return data.signedUrl
  } catch (err) {
    console.error('Непредвиденная ошибка:', err)
    return null
  }
}