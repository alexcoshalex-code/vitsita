import React, { useState, useEffect } from 'react';
import { ChevronRight, Download, CheckCircle, ArrowRight, Instagram, Send, ShieldCheck, Star } from 'lucide-react';
import { supabase, getDownloadLink } from './supabaseClient'; // 👈 импортируем нашу функцию

// --- Компонент плавной анимации (FadeIn) ---
const FadeIn = ({ children, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);
  
  return (
    <div className={`transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
      {children}
    </div>
  );
};

// ❌ Локальная функция getDownloadLink удалена – теперь используем импортированную из supabaseClient

export default function App() {
  // Состояния роутинга: 'home' | 'processing' | 'yookassa_mock' | 'success'
  const [view, setView] = useState('home');
  
  // Состояния для работы с заказом
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);

  // --- Диагностика переменных окружения Supabase ---
  useEffect(() => {
    console.log('🔍 Проверка переменных окружения:');
    console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? '✅ определён' : '❌ не определён');
    console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ определён' : '❌ не определён');
    
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      console.error('🚨 Переменные окружения Supabase не заданы! Проверь настройки Vercel или файл .env');
    }
  }, []);

  // Создание заказа и переход к имитации оплаты
  const handleBuyClick = async () => {
    setView('processing');
    
    try {
      // Вставляем запись о заказе и получаем её ID
      const { data, error } = await supabase
        .from('orders')
        .insert([{ email: 'test@example.com', amount: 290, status: 'pending' }])
        .select();

      if (error) {
        console.error('❌ Ошибка БД при создании заказа:', error.message);
        // В реальном проекте можно показать уведомление пользователю
        // Пока просто покажем ошибку и вернёмся на главную
        setView('home');
        return;
      }

      if (data && data.length > 0) {
        setCurrentOrderId(data[0].id);
        console.log('✅ Заказ создан, ID:', data[0].id);
      }
      
      // Имитируем запрос к нашему Node.js API (1.5 секунды)
      setTimeout(() => {
        setView('yookassa_mock');
      }, 1500);
    } catch (err) {
      console.error('🔥 Неожиданная ошибка при создании заказа:', err);
      setView('home');
    }
  };

  // Имитация успешной оплаты на стороне ЮKassa
  const handleMockPayment = async () => {
    setView('processing');

    if (currentOrderId) {
      // Обновляем статус заказа в базе данных
      const { error } = await supabase
        .from('orders')
        .update({ status: 'paid' })
        .eq('id', currentOrderId);

      if (error) {
        console.error('❌ Ошибка обновления статуса заказа:', error.message);
        // Даже при ошибке можно показать success, но лучше уведомить пользователя
      } else {
        console.log('✅ Статус заказа обновлён на paid');
      }
    } else {
      console.warn('⚠️ currentOrderId отсутствует при оплате');
    }

    // Переходим на страницу успеха
    setTimeout(() => {
      setView('success');
    }, 1000);
  };

  // Проверка статуса оплаты на странице успеха
  useEffect(() => {
    if (view === 'success' && currentOrderId) {
      const checkPayment = async () => {
        setIsCheckingPayment(true);
        try {
          const { data, error } = await supabase
            .from('orders')
            .select('status')
            .eq('id', currentOrderId)
            .single();

          if (error) {
            console.error('❌ Ошибка проверки статуса:', error.message);
            return;
          }

          if (data?.status === 'paid') {
            console.log('✅ Заказ оплачен, генерируем временную ссылку');
            // Используем импортированную функцию getDownloadLink (асинхронную)
            try {
              const url = await getDownloadLink('pixar_guide.pdf'); // замените на актуальное имя файла
              setDownloadUrl(url);
            } catch (linkErr) {
              console.error('❌ Ошибка получения ссылки на скачивание:', linkErr);
              // Можно показать сообщение пользователю, что ссылка временно недоступна
            }
          } else {
            console.log('⏳ Статус заказа не оплачен:', data?.status);
            // Можно показать сообщение об ошибке или предложить обратиться в поддержку
          }
        } catch (err) {
          console.error('🔥 Неожиданная ошибка при проверке оплаты:', err);
        } finally {
          setIsCheckingPayment(false);
        }
      };
      
      checkPayment();
    }
  }, [view, currentOrderId]);

  // Сброс состояния при возврате на главную
  const handleReturnHome = () => {
    setView('home');
    setCurrentOrderId(null);
    setDownloadUrl(null);
    setIsCheckingPayment(false);
  };

  return (
    <div className="min-h-screen bg-black text-[#f5f5f7] font-sans selection:bg-white selection:text-black">
      
      {/* --- НАВИГАЦИЯ --- */}
      <nav className="fixed top-0 w-full z-50 bg-black/50 backdrop-blur-md border-b border-white/10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-semibold tracking-tighter cursor-pointer" onClick={handleReturnHome}>
            НЕЙРОМАСТЕРСКАЯ.
          </span>
          <div className="flex gap-4">
            <a href="https://t.me/your_channel" target="_blank" rel="noreferrer" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors flex items-center gap-2">
              <Send size={16} />
              <span className="hidden sm:inline">Telegram</span>
            </a>
          </div>
        </div>
      </nav>

      {/* --- ГЛАВНАЯ СТРАНИЦА --- */}
      {view === 'home' && (
        <main className="pt-16">
          {/* Hero Section */}
          <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-6 overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-zinc-800/30 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
            
            <FadeIn delay={100}>
              <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-6">
                Нейромастерская.
              </h1>
            </FadeIn>
            <FadeIn delay={300}>
              <p className="text-xl md:text-2xl text-zinc-400 max-w-2xl mx-auto font-light tracking-wide mb-12">
                Настрой разум - получи результат
              </p>
            </FadeIn>
            <FadeIn delay={500}>
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => document.getElementById('guide').scrollIntoView({ behavior: 'smooth' })}
                  className="px-8 py-4 bg-white text-black rounded-full font-medium hover:scale-105 transition-transform duration-300 flex items-center justify-center gap-2"
                >
                  Посмотреть гайды <ArrowRight size={18} />
                </button>
              </div>
            </FadeIn>
          </section>

          {/* Обо мне */}
          <section className="py-24 px-6 bg-[#111111]">
            <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
              <FadeIn delay={200}>
                <div className="aspect-4/5 bg-linear-to-tr from-zinc-800 to-zinc-900 rounded-3xl relative overflow-hidden group">
                  <div className="absolute inset-0 flex items-center justify-center text-zinc-600 font-medium">
                    [ Эстетичное фото ]
                  </div>
                  <div className="absolute top-0 -left-full w-1/2 h-full bg-linear-to-r from-transparent via-white/5 to-transparent skew-x-[-20deg] group-hover:left-[200%] transition-all duration-1000 ease-in-out"></div>
                </div>
              </FadeIn>
              <FadeIn delay={400}>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-8">Кто я?</h2>
                <div className="space-y-6 text-lg text-zinc-400 font-light leading-relaxed">
                  <p>
                    Я прошла путь от хаоса к четкой системе. Мой подход — это баланс между железной дисциплиной и любовью к себе.
                  </p>
                  <p>
                    В этом блоге и моих материалах нет "волшебных таблеток". Только рабочие механики, проверенные на собственном опыте: как ставить цели, внедрять привычки и не сливаться на полпути.
                  </p>
                </div>
              </FadeIn>
            </div>
          </section>

          {/* Секция продукта (Гайд) */}
          <section id="guide" className="py-32 px-6">
            <div className="max-w-3xl mx-auto">
              <FadeIn delay={100}>
                <div className="text-center mb-16">
                  <h2 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">Гайд.</h2>
                  <p className="text-xl text-zinc-400">PDF-руководство по созданию.</p>
                </div>
              </FadeIn>

              <FadeIn delay={300}>
                <div className="bg-[#1d1d1f]/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-zinc-500 to-transparent"></div>
                  
                  <h3 className="text-2xl font-semibold mb-8">Что внутри гайда?</h3>
                  
                  <ul className="space-y-6 mb-12">
                    {[
                      "Пошаговые инструкции для новичков — никаких сложных терминов, только понятные шаги.",
                      "Готовые промпты (запросы для нейросетей), чтобы создавать персонажей, похожих на ваших родных.",
                      "Идеи для оформления разворотов: от «первой улыбки малыша» до «нашего первого путешествия».",
                      "Секреты, как сделать альбом не просто красивым, а настоящей семейной реликвией."
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-4">
                        <div className="mt-1 bg-white/10 p-1 rounded-full text-white">
                          <CheckCircle size={16} />
                        </div>
                        <span className="text-zinc-300 text-lg">{item}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mb-10 text-center">
                    <p className="text-xl md:text-2xl font-medium text-white leading-relaxed mb-2">
                      Подарите своим детям мультик, в котором они живут.
                    </p>
                    <p className="text-xl md:text-2xl font-medium text-zinc-400">
                      Начните творить уже сегодня!
                    </p>
                  </div>

                  <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div>
                      <p className="text-sm text-zinc-500 uppercase tracking-widest mb-1">Стоимость</p>
                      <p className="text-5xl font-bold">290 ₽</p>
                    </div>
                    
                    <button 
                      onClick={handleBuyClick}
                      className="w-full md:w-auto px-10 py-5 bg-white text-black rounded-full font-semibold text-lg hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      Купить гайд <ChevronRight size={20} />
                    </button>
                  </div>
                  
                  <div className="mt-6 flex items-center justify-center gap-2 text-sm text-zinc-500">
                    <ShieldCheck size={16} />
                    <span>Безопасная оплата через ЮKassa</span>
                  </div>
                </div>
              </FadeIn>
            </div>
          </section>

          {/* Footer */}
          <footer className="py-12 border-t border-white/10 text-center text-zinc-600 text-sm">
            <p>© {new Date().getFullYear()} Нейромастерская. Все права защищены.</p>
            <div className="flex justify-center gap-6 mt-4">
              <a href="#" className="hover:text-white transition-colors">Оферта</a>
              <a href="#" className="hover:text-white transition-colors">Политика конфиденциальности</a>
            </div>
          </footer>
        </main>
      )}

      {/* --- ЭКРАН ЗАГРУЗКИ --- */}
      {view === 'processing' && (
        <div className="h-screen flex flex-col items-center justify-center text-center px-6">
          <div className="w-12 h-12 border-4 border-zinc-800 border-t-white rounded-full animate-spin mb-6"></div>
          <h2 className="text-2xl font-semibold mb-2">Обработка...</h2>
          <p className="text-zinc-500">Подключение к платежному шлюзу</p>
        </div>
      )}

      {/* --- ИМИТАЦИЯ ОКНА ЮKASSA --- */}
      {view === 'yookassa_mock' && (
        <div className="h-screen flex items-center justify-center p-6 bg-[#f5f5f5] text-black transition-colors duration-500">
          <FadeIn>
            <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full">
              <div className="flex items-center gap-2 mb-8">
                <div className="w-6 h-6 bg-blue-600 rounded-sm"></div>
                <span className="font-bold text-xl tracking-tight">ЮKassa</span>
              </div>
              <p className="text-sm text-gray-500 mb-1">К оплате</p>
              <p className="text-4xl font-bold mb-8">290 ₽</p>
              
              <div className="space-y-4 mb-8">
                <div className="h-12 bg-gray-100 rounded-xl flex items-center px-4 text-gray-400 text-sm border border-gray-200">
                  Номер карты
                </div>
                <div className="flex gap-4">
                  <div className="h-12 bg-gray-100 rounded-xl flex-1 flex items-center px-4 text-gray-400 text-sm border border-gray-200">ММ/ГГ</div>
                  <div className="h-12 bg-gray-100 rounded-xl flex-1 flex items-center px-4 text-gray-400 text-sm border border-gray-200">CVC</div>
                </div>
              </div>

              <button 
                onClick={handleMockPayment}
                className="w-full py-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors"
              >
                Оплатить 290 ₽
              </button>
              
              <button 
                onClick={handleReturnHome}
                className="w-full mt-4 py-4 text-gray-400 hover:text-gray-600 font-medium transition-colors text-sm"
              >
                Отменить и вернуться
              </button>
            </div>
          </FadeIn>
        </div>
      )}

      {/* --- СТРАНИЦА УСПЕХА --- */}
      {view === 'success' && (
        <div className="h-screen flex flex-col items-center justify-center text-center px-6 bg-linear-to-b from-[#111] to-black">
          <FadeIn delay={100}>
            <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-8 mx-auto">
              <CheckCircle size={48} className="text-white" />
            </div>
          </FadeIn>
          
          <FadeIn delay={300}>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4">
              Спасибо за покупку
            </h1>
            <p className="text-xl text-zinc-400 mb-12 max-w-md mx-auto">
              Оплата прошла успешно. Твой гайд готов к скачиванию. Начинай менять свою реальность уже сегодня.
            </p>
          </FadeIn>

          <FadeIn delay={500}>
            <div className="flex flex-col sm:flex-row gap-4">
              {isCheckingPayment ? (
                <div className="px-8 py-4 bg-zinc-800 text-zinc-400 rounded-full font-medium flex items-center justify-center gap-3 text-lg">
                  <div className="w-5 h-5 border-2 border-zinc-600 border-t-white rounded-full animate-spin"></div>
                  Проверка оплаты...
                </div>
              ) : downloadUrl ? (
                <a
                  href={downloadUrl}
                  download
                  className="px-8 py-4 bg-white text-black rounded-full font-medium hover:scale-105 transition-transform duration-300 flex items-center justify-center gap-3 text-lg"
                >
                  <Download size={20} /> Скачать гайд
                </a>
              ) : (
                <div className="px-8 py-4 bg-zinc-800 text-zinc-400 rounded-full font-medium flex items-center justify-center gap-3 text-lg cursor-not-allowed">
                  <Download size={20} /> Ссылка временно недоступна
                </div>
              )}
              
              <a 
                href="https://t.me/your_channel" 
                target="_blank" 
                rel="noreferrer"
                className="px-8 py-4 bg-zinc-800 text-white rounded-full font-medium hover:bg-zinc-700 transition-colors duration-300 flex items-center justify-center gap-3 text-lg"
              >
                <Send size={20} /> Telegram-канал
              </a>
            </div>
          </FadeIn>
          
          <FadeIn delay={800}>
             <button 
                onClick={handleReturnHome}
                className="mt-16 text-zinc-500 hover:text-white transition-colors border-b border-transparent hover:border-white pb-1"
              >
                Вернуться на главную
              </button>
          </FadeIn>
        </div>
      )}

    </div>
  );
}