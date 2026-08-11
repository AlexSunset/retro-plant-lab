// Список задач-образцов
const samples = [
    {
        key: 'AS-26075',
        title: 'Миграция EcomDirect и SharelinkDirect в новый алаймент',
        url: 'https://jira.tcsbank.ru/browse/AS-26075'
    },
    {
        key: 'AS-25596',
        title: 'Создание SafeDeal',
        url: 'https://jira.tcsbank.ru/browse/AS-25596'
    },
    {
        key: 'ACQSP-3357',
        title: 'Редактирование параметров sharelinkDirect',
        url: 'https://jira.tcsbank.ru/browse/ACQSP-3357'
    },
    {
        key: 'AS-26308',
        title: '[T-KAT] Доработать процки для проекта по объединению гардов (убрать старый тег)',
        url: 'https://jira.tcsbank.ru/browse/AS-26308'
    },
    {
        key: 'ACQSP-2503',
        title: 'Услуги в FineDog',
        url: 'https://jira.tcsbank.ru/browse/ACQSP-2503'
    },
    {
        key: 'AS-25674',
        title: 'SafeDeal: отображение общих данных по магазину',
        url: 'https://jira.tcsbank.ru/browse/AS-25674'
    },
    {
        key: 'AS-26532',
        title: '[T-KAT] Отключить установку ставок С2А',
        url: 'https://jira.tcsbank.ru/browse/AS-26532'
    },
    {
        key: 'AS-26352',
        title: 'Доступ к админке ИЭ для диспутов',
        url: 'https://jira.tcsbank.ru/browse/AS-26352'
    },
    {
        key: 'AS-26585',
        title: '[T-KAT] Выгрузка по компании в синей с логинами',
        url: 'https://jira.tcsbank.ru/browse/AS-26585'
    },
    {
        key: 'AS-21634',
        title: 'Аналитика в Twork',
        url: 'https://jira.tcsbank.ru/browse/AS-21634'
    },
    {
        key: 'ACQSP-1401',
        title: 'Переход на Angular 21 и Taiga UI 4',
        url: 'https://jira.tcsbank.ru/browse/ACQSP-1401'
    },
    {
        key: 'ACQSP-1805',
        title: 'Магазин safeDeal. Просмотр списка магазинов',
        url: 'https://jira.tcsbank.ru/browse/ACQSP-1805'
    }
];

// Рендеринг списка задач
document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('samplesGrid');
    
    grid.innerHTML = samples.map(sample => `
        <div class="sample-card">
            <div class="sample-header">
                <span class="sample-key">${sample.key}</span>
                <a href="${sample.url}" target="_blank" class="sample-link" title="Открыть в Jira">
                    🔗
                </a>
            </div>
            <div class="sample-title">${sample.title}</div>
        </div>
    `).join('');
});
