// 塔罗牌数据库
const tarotCards = [
    { name: '愚人牌', meaning: '新的开始、冒险、天真的决定' },
    { name: '魔术师', meaning: '力量、聪慧、创造、掌控' },
    { name: '女祭司', meaning: '直觉、奥秘、内在知识、智慧' },
    { name: '皇后', meaning: '创造力、美丽、丰盛、温暖' },
    { name: '皇帝', meaning: '权力、权威、父权、理性' },
    { name: '教皇', meaning: '传统、信仰、保守、教导' },
    { name: '恋人', meaning: '爱情、关系、选择、调和' },
    { name: '战车', meaning: '胜利、掌控、决心、目标' },
    { name: '力量', meaning: '勇气、耐力、自制力、毅力' },
    { name: '隐者', meaning: '冥想、反思、内省、寻求' },
    { name: '命运之轮', meaning: '幸运、周期、命运、转机' },
    { name: '正义', meaning: '正义、公平、真理、因果' },
    { name: '吊人', meaning: '暂停、视角改变、释放、灵感' },
    { name: '死神', meaning: '结束、变化、转变、重生' },
    { name: '节制', meaning: '平衡、温和、耐心、适度' },
    { name: '恶魔', meaning: '束缚、欲望、物质、迷惑' },
    { name: '塔', meaning: '混乱、摧毁、突变、启示' },
    { name: '星星', meaning: '希望、梦想、精神、灵感' },
    { name: '月亮', meaning: '幻觉、恐惧、潜意识、直觉' },
    { name: '太阳', meaning: '成功、快乐、光明、积极' },
    { name: '审判', meaning: '觉醒、重生、评估、变革' },
    { name: '世界', meaning: '完成、统一、圆满、旅程终点' }
];

// 页面元素
const questionInput = document.getElementById('question');
const startBtn = document.getElementById('startBtn');
const cardsSection = document.getElementById('cardsSection');
const resultSection = document.getElementById('resultSection');
const errorMessage = document.getElementById('errorMessage');
const restartBtn = document.getElementById('restartBtn');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const historyModal = document.getElementById('historyModal');
const historyModalBackdrop = document.getElementById('historyModalBackdrop');
const historyModalClose = document.getElementById('historyModalClose');
const historyModalTime = document.getElementById('historyModalTime');
const historyModalTitle = document.getElementById('historyModalTitle');
const historyModalCards = document.getElementById('historyModalCards');
const historyModalInterpretation = document.getElementById('historyModalInterpretation');
const tarotApiEndpoint = '/api/tarot';
const historyList = document.getElementById('historyList');
const interpretationIntro = document.getElementById('interpretationIntro');
const HISTORY_STORAGE_KEY = 'tarot-divination-history';
const TYPEWRITER_DELAY = 22;
const TYPEWRITER_SECTION_DELAY = 220;

// 状态变量
let selectedCards = [];
let isAnimating = false;
let activeTypewriterRun = 0;

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    startBtn.addEventListener('click', startDivination);
    restartBtn.addEventListener('click', resetDivination);
    clearHistoryBtn.addEventListener('click', clearHistory);
    historyList.addEventListener('click', handleHistoryListClick);
    historyModalBackdrop.addEventListener('click', closeHistoryModal);
    historyModalClose.addEventListener('click', closeHistoryModal);
    document.addEventListener('keydown', handleDocumentKeydown);
    renderHistory();
});

// 开始占卜
function startDivination() {
    const question = questionInput.value.trim();
    
    // 验证输入
    if (!question) {
        showError('请输入您的问题');
        return;
    }

    if (question.length < 2) {
        showError('问题长度至少需要 2 个字');
        return;
    }

    hideError();
    isAnimating = true;
    startBtn.disabled = true;
    questionInput.disabled = true;

    // 隐藏输入区域
    document.querySelector('.input-section').style.display = 'none';
    
    // 显示卡牌区域
    cardsSection.style.display = 'block';
    resultSection.style.display = 'none';

    // 随机抽取3张卡牌
    selectedCards = drawCards(3);

    // 执行翻牌动画
    setTimeout(() => flipCards(), 500);
}

// 随机抽取卡牌
function drawCards(count) {
    const cards = [];
    const indices = new Set();
    
    while (indices.size < count) {
        indices.add(Math.floor(Math.random() * tarotCards.length));
    }

    indices.forEach(index => {
        cards.push(tarotCards[index]);
    });

    return cards;
}

// 翻牌动画
function flipCards() {
    const cards = [
        document.getElementById('card1'),
        document.getElementById('card2'),
        document.getElementById('card3')
    ];

    cards.forEach((card, index) => {
        setTimeout(() => {
            card.classList.add('flipped');
            
            // 填充卡牌背面内容
            const cardBack = document.getElementById(`cardBack${index + 1}`);
            cardBack.textContent = selectedCards[index].name;
            
            // 最后一张卡翻完后，显示结果
            if (index === 2) {
                setTimeout(() => showResults(), 800);
            }
        }, index * 400);
    });
}

// 显示结果
async function showResults() {
    cardsSection.style.display = 'none';
    resultSection.style.display = 'block';

    // 填充卡牌信息
    selectedCards.forEach((card, index) => {
        document.getElementById(`cardName${index + 1}`).textContent = card.name;
        document.getElementById(`cardMeaning${index + 1}`).textContent = card.meaning;
    });

    // 生成 AI 占卜解读
    await generateAIInterpretation();

    isAnimating = false;
}

// 生成 AI 占卜解读
async function generateAIInterpretation() {
    const question = questionInput.value.trim();
    const interpretationContent = document.getElementById('interpretationContent');
    const interpretationLoading = document.getElementById('interpretationLoading');

    interpretationLoading.style.display = 'flex';
    interpretationContent.style.display = 'none';
    interpretationContent.innerHTML = '';
    interpretationIntro.textContent = '命运的星图正在成形，每一段解读都会依次显现。';
    activeTypewriterRun += 1;

    try {
        const prompt = `你是一位神秘的塔罗占卜师。用户提出了以下问题："${question}"

根据以下三张塔罗牌给出深刻的占卜解读：
- 过去：${selectedCards[0].name}（${selectedCards[0].meaning}）
- 现在：${selectedCards[1].name}（${selectedCards[1].meaning}）
- 未来：${selectedCards[2].name}（${selectedCards[2].meaning}）

请用200-300字的神秘且富有诗意的语言，结合这三张牌的含义和用户的问题，给出专业的塔罗占卜解读。要考虑到各个牌位的含义和它们之间的联系。`;

        const response = await fetch(tarotApiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-5.4',
                messages: [
                    {
                        role: 'system',
                        content: '你是一位神秘而智慧的塔罗占卜师，用神秘而优雅的语言提供占卜解读。'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.8,
                max_tokens: 800
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            const errorMessage = errorData?.details?.error?.message
                || errorData?.details?.message
                || errorData?.error
                || `API 错误: ${response.status}`;

            throw new Error(errorMessage);
        }

        const data = await response.json();
        const interpretation = data.choices?.[0]?.message?.content;

        if (!interpretation) {
            throw new Error('接口未返回有效的占卜解读');
        }

        interpretationLoading.style.display = 'none';
        interpretationContent.style.display = 'block';
        await renderInterpretation(interpretation);
        saveHistory(question, interpretation);
        renderHistory();
        interpretationIntro.textContent = '星光已经落定，下面是这次命运回响的三重讯息。';

    } catch (error) {
        console.error('生成占卜解读失败:', error);
        interpretationLoading.style.display = 'none';
        interpretationContent.style.display = 'block';
        interpretationIntro.textContent = '这一次星轨被云层遮住了，但记录与卡面仍然保留。';
        const errorParagraphs = [
            '✨ 神秘的力量暂时难以感知，但命运之轮仍在转动...',
            `提示：${error.message}`
        ];
        await renderInterpretation(errorParagraphs.join('\n\n'));
    }
}

async function renderInterpretation(text) {
    const interpretationContent = document.getElementById('interpretationContent');
    const paragraphs = splitInterpretation(text);
    const runId = ++activeTypewriterRun;

    interpretationContent.innerHTML = paragraphs
        .map(() => '<div class="interpretation-paragraph"></div>')
        .join('');

    const targets = interpretationContent.querySelectorAll('.interpretation-paragraph');

    for (const [index, target] of targets.entries()) {
        if (runId !== activeTypewriterRun) {
            return;
        }

        await typewriteParagraph(target, paragraphs[index], runId);

        if (index < targets.length - 1) {
            await wait(TYPEWRITER_SECTION_DELAY);
        }
    }
}

function splitInterpretation(text) {
    const byLine = text
        .split(/\n+/)
        .map(item => item.trim())
        .filter(Boolean);

    if (byLine.length > 1) {
        return byLine;
    }

    return text
        .split(/(?<=[。！？])/)
        .map(item => item.trim())
        .filter(Boolean)
        .reduce((accumulator, sentence) => {
            const current = accumulator[accumulator.length - 1];

            if (!current || current.length > 42) {
                accumulator.push(sentence);
            } else {
                accumulator[accumulator.length - 1] = `${current}${sentence}`;
            }

            return accumulator;
        }, []);
}

function saveHistory(question, interpretation) {
    const history = getHistory();
    const entry = {
        id: Date.now(),
        question,
        cards: selectedCards.map(card => card.name),
        interpretation,
        createdAt: new Date().toLocaleString('zh-CN', { hour12: false })
    };

    history.unshift(entry);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history.slice(0, 8)));
}

function renderHistory() {
    const history = getHistory();

    if (history.length === 0) {
        historyList.innerHTML = '<p class="history-empty">你的占卜记录会在这里留下星轨。</p>';
        return;
    }

    historyList.innerHTML = history
        .map(item => `
            <article class="history-item">
                <div class="history-question">${escapeHtml(item.question)}</div>
                <div class="history-meta">${escapeHtml(item.createdAt)} · ${escapeHtml(item.cards.join(' / '))}</div>
                <div class="history-preview">${escapeHtml(item.interpretation.slice(0, 88))}${item.interpretation.length > 88 ? '...' : ''}</div>
                <button class="history-view-btn" type="button" data-history-id="${item.id}">点开查看完整解读</button>
            </article>
        `)
        .join('');
}

function handleHistoryListClick(event) {
    const trigger = event.target.closest('[data-history-id]');

    if (!trigger) {
        return;
    }

    const historyId = Number(trigger.dataset.historyId);
    const entry = getHistory().find(item => item.id === historyId);

    if (!entry) {
        return;
    }

    openHistoryModal(entry);
}

function openHistoryModal(entry) {
    historyModalTime.textContent = entry.createdAt;
    historyModalTitle.textContent = entry.question;
    historyModalCards.textContent = entry.cards.join(' / ');
    historyModalInterpretation.innerHTML = splitInterpretation(entry.interpretation)
        .map(paragraph => `<p>${escapeHtml(paragraph)}</p>`)
        .join('');
    historyModal.hidden = false;
    document.body.style.overflow = 'hidden';
}

function closeHistoryModal() {
    historyModal.hidden = true;
    document.body.style.overflow = '';
}

function handleDocumentKeydown(event) {
    if (event.key === 'Escape' && !historyModal.hidden) {
        closeHistoryModal();
    }
}

function clearHistory() {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
    renderHistory();
    closeHistoryModal();
}

function getHistory() {
    try {
        return JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY) || '[]');
    } catch {
        return [];
    }
}

function escapeHtml(text) {
    return text
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

async function typewriteParagraph(container, text, runId) {
    container.innerHTML = '<span class="interpretation-cursor">|</span>';
    const textNode = document.createTextNode('');
    container.prepend(textNode);

    for (const character of text) {
        if (runId !== activeTypewriterRun) {
            return;
        }

        textNode.textContent += character;
        await wait(TYPEWRITER_DELAY);
    }

    const cursor = container.querySelector('.interpretation-cursor');

    if (cursor) {
        cursor.remove();
    }
}

function wait(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

// 重新占卜
function resetDivination() {
    // 重置 UI
    document.querySelector('.input-section').style.display = 'flex';
    cardsSection.style.display = 'none';
    resultSection.style.display = 'none';
    errorMessage.style.display = 'none';
    interpretationIntro.textContent = '命运之镜正在展开，请静心阅读每一道启示。';
    document.getElementById('interpretationContent').innerHTML = '';
    activeTypewriterRun += 1;

    // 重置卡牌状态
    document.querySelectorAll('.card').forEach(card => {
        card.classList.remove('flipped');
    });

    // 重置输入框
    questionInput.value = '';
    questionInput.disabled = false;
    startBtn.disabled = false;

    // 清空选中的卡牌
    selectedCards = [];

    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 显示错误信息
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    setTimeout(() => hideError(), 5000);
}

// 隐藏错误信息
function hideError() {
    errorMessage.style.display = 'none';
}
