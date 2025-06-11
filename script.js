document.addEventListener('DOMContentLoaded', () => {
    const dataContainer = document.getElementById('data-container');
    const categoryFilter = document.getElementById('category-filter');
    const loadingMessage = document.getElementById('loading-message');
    const staticIntro = document.getElementById('static-intro');
    const searchInput = document.getElementById('search-input');
    const languageSwitcher = document.querySelector('.language-switcher'); // 获取语言切换容器

    let allData = []; // 存储所有数据 (来自 data.json)
    let currentCategory = 'all'; // 存储当前选中的分类 (使用 data.json 中的分类名)
    let translations = {}; // 存储当前语言的翻译文本
    let currentLang = 'zh'; // 默认语言

    // JSON 数据文件路径 (保持不变)
    const jsonFilePath = 'data.json';

    // --- 多语言相关变量和函数 ---

    // 支持的语言列表
    const supportedLangs = ['zh', 'en']; // 添加你支持的语言

    // 获取翻译文本
    function getTranslation(key) {
        return translations[key] || key; // 如果找不到翻译，返回键本身
    }

    // 加载翻译文件
    async function loadTranslations(lang) {
        try {
            const response = await fetch(`lang/${lang}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load translations for ${lang}: ${response.status}`);
            }
            translations = await response.json();
            currentLang = lang;
            localStorage.setItem('preferredLang', lang); // 记住用户选择的语言
        } catch (error) {
            console.error('Error loading translations:', error);
            // 加载默认语言或显示错误
            translations = {}; // 清空翻译，可能导致显示键名
            // 可以选择加载默认语言的翻译作为备用
            // await fetch(`lang/zh.json`).then(res => res.json()).then(data => translations = data);
        }
    }

    // 翻译静态 HTML 元素
    function translateStaticElements() {
        document.title = getTranslation('pageTitle');
        document.querySelector('meta[name="description"]').setAttribute('content', getTranslation('metaDescription'));
        document.documentElement.lang = getTranslation('langAttr');

        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (key) {
                element.textContent = getTranslation(key);
            }
        });
         document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            if (key && element.placeholder !== undefined) { // 确保元素有 placeholder 属性
                element.placeholder = getTranslation(key);
            }
        });

        // 如果静态列表项使用了 data-i18n，上面的循环会处理
        // 如果没有，且 introListItemX 在 lang.json 中，需要手动处理或修改 HTML
         const listItems = staticIntro ? staticIntro.querySelectorAll('ul li') : [];
         if (listItems.length > 0) {
             listItems.forEach((item, index) => {
                 // 假设 introListItem1 对应第一个 li，以此类推
                 const key = `introListItem${index + 1}`;
                 if (translations[key]) { // 检查 lang.json 中是否有对应的键
                      item.textContent = getTranslation(key);
                 }
             });
         }


        // 更新加载消息文本
        loadingMessage.textContent = getTranslation('loadingMessage');
        // 错误消息在 catch 中处理
    }

    // 处理语言切换
    function handleLanguageSwitch(event) {
        const target = event.target;
        if (target.tagName === 'BUTTON' && target.dataset.lang) {
            const newLang = target.dataset.lang;
            if (supportedLangs.includes(newLang) && newLang !== currentLang) {
                // 只加载新的翻译文件，数据文件不重新加载
                loadTranslations(newLang).then(() => {
                    translateStaticElements(); // 翻译静态内容
                    // 重新创建分类按钮 (按钮文本需要翻译，但分类名称来自 data.json)
                    createCategoryFilters(allData); // 使用原始数据创建分类按钮
                     // 重新渲染卡片 (按钮文本需要翻译)
                    filterAndRenderCards(); // 使用原始数据渲染卡片
                    // 更新语言切换按钮的 active 状态
                    updateLanguageSwitcherButtons(newLang);
                });
            }
        }
    }

    // 更新语言切换按钮的 active 状态
    function updateLanguageSwitcherButtons(activeLang) {
         if (languageSwitcher) {
            languageSwitcher.querySelectorAll('button').forEach(button => {
                if (button.dataset.lang === activeLang) {
                    button.classList.add('active'); // 你需要在 CSS 中定义 .active 样式
                } else {
                    button.classList.remove('active');
                }
            });
        }
    }


    // --- 修改原有函数以支持多语言（仅按钮文本等） ---

    // 过滤并渲染卡片的主函数 - **不需要大改，因为它调用了 renderCards**
    function filterAndRenderCards() {
        const searchTerm = searchInput.value.toLowerCase();

        // 过滤逻辑保持不变，使用 data.json 中的原始 category 和 title 字段进行过滤和搜索
        let dataAfterCategoryFilter = currentCategory === 'all'
            ? allData
            : allData.filter(item => item.category === currentCategory); // 过滤使用原始分类名

        const finalFilteredData = dataAfterCategoryFilter.filter(item => {
            // 仅根据 data.json 中的原始 title 进行搜索过滤
            const titleMatch = item.title && item.title.toLowerCase().includes(searchTerm);
            return titleMatch;
        });

        renderCards(finalFilteredData); // 渲染最终过滤后的数据
    }


    // --- 修改 renderCards 函数以使用翻译文本和数据 ---
    function renderCards(dataToRender) {
        dataContainer.innerHTML = '';

        if (dataToRender.length === 0) {
            // 使用翻译的“没有找到匹配数据”消息
            dataContainer.innerHTML = `<p style="text-align: center; color: rgba(226, 232, 240, 0.8);">${getTranslation('noDataMessage')}</p>`;
            return;
        }

        dataToRender.forEach((item, index) => {
            const card = document.createElement('div');
            card.classList.add('data-card');

            // 使用 data.json 中的原始标题和内容
            const itemTitle = item.title || '';
            const itemContent = item.content || '';

            // 将完整内容存储在卡片元素的 data 属性中
            card.dataset.fullContent = itemContent;

            card.style.animationDelay = `${index * 0.05}s`;

            // 构建卡片内部 HTML，标题和内容使用原始数据，按钮文本使用翻译
            card.innerHTML = `
                <h3>${itemTitle}</h3>
                <p class="card-content">${truncateContent(itemContent)}</p>
                <div class="card-actions">
                    ${itemContent.length > 150 ? `<button class="toggle-content">${getTranslation('buttonShowMore')}</button>` : ''}
                    <button class="copy-button">${getTranslation('buttonCopy')}</button>
                </div>
            `;

            const contentElement = card.querySelector('.card-content');
            const toggleButton = card.querySelector('.toggle-content');
            const copyButton = card.querySelector('.copy-button');

             // 存储截断内容到元素的数据属性中 (如果内容长的话)
             if (itemContent.length > 150) {
                 contentElement.dataset.truncatedContent = truncateContent(itemContent);
            } else {
                // 如果内容不长，隐藏“显示全部”按钮 (如果JS模板里误加了)
                 if(toggleButton) toggleButton.classList.add('hidden');
            }


            // --- 添加“显示全部”按钮事件监听器 ---
            if (toggleButton) {
                toggleButton.addEventListener('click', () => {
                    const isExpanded = contentElement.classList.contains('expanded');

                    if (isExpanded) {
                        // 收起
                        contentElement.classList.remove('expanded');
                         // 使用原始截断内容
                        contentElement.textContent = contentElement.dataset.truncatedContent || truncateContent(itemContent);
                        toggleButton.textContent = getTranslation('buttonShowMore'); // 使用翻译文本
                    } else {
                        // 展开
                        contentElement.classList.add('expanded');
                        contentElement.textContent = card.dataset.fullContent; // 使用原始完整内容
                        toggleButton.textContent = getTranslation('buttonShowLess'); // 使用翻译文本
                    }
                });
            }

            // --- 添加“复制内容”按钮事件监听器 ---
            if (copyButton) {
                copyButton.addEventListener('click', async () => {
                    const fullContent = card.dataset.fullContent;

                    try {
                        await navigator.clipboard.writeText(fullContent);
                        copyButton.textContent = getTranslation('buttonCopied'); // 使用翻译文本
                        copyButton.classList.add('success');
                        copyButton.disabled = true;

                        setTimeout(() => {
                            copyButton.textContent = getTranslation('buttonCopy'); // 恢复翻译文本
                            copyButton.classList.remove('success');
                            copyButton.disabled = false;
                        }, 1500);
                    } catch (err) {
                        console.error('复制失败: ', err);
                        copyButton.textContent = getTranslation('buttonCopyFailed'); // 使用翻译文本
                        copyButton.classList.add('error');
                        copyButton.disabled = true;

                        setTimeout(() => {
                            copyButton.textContent = getTranslation('buttonCopy'); // 恢复翻译文本
                            copyButton.classList.remove('error');
                            copyButton.disabled = false;
                        }, 1500);
                    }
                });
            }

            dataContainer.appendChild(card);
        });
    }

    // --- 内容截断函数 - 不需要修改，因为它处理的是字符串 ---
    function truncateContent(content, maxLength = 150) {
        if (!content || content.length <= maxLength) {
            return content || '';
        }
        return content.substring(0, maxLength) + '...';
    }


    // --- 修改 createCategoryFilters 函数以使用翻译文本（分类名来自 data.json） ---
    function createCategoryFilters(data) {
        const categories = new Set(['all']); // 使用 Set 确保唯一性，总是包含 'all'
        data.forEach(item => {
             if (item.category) {
                categories.add(item.category); // 直接使用 data.json 中的分类字符串
             }
        });

        // 清空除“全部”按钮外的其他按钮
         categoryFilter.querySelectorAll('.category-button:not([data-category="all"])').forEach(button => button.remove());

        // 获取“全部”按钮并更新其文本
        const allButton = categoryFilter.querySelector('.category-button[data-category="all"]');
        if (allButton) {
            allButton.textContent = getTranslation('buttonAll'); // 翻译“全部”按钮
        }

        // 将 Set 转换为数组并排序（可选）以便分类按钮顺序一致
        const sortedCategories = Array.from(categories).sort();


        sortedCategories.forEach(categoryName => {
            if (categoryName === 'all') return; // “全部”按钮已经处理

            const button = document.createElement('button');
            button.classList.add('category-button');
            // data-category 存储 data.json 中的原始分类名
            button.dataset.category = categoryName;
            // 按钮文本直接使用 data.json 中的原始分类名
            // 如果你想翻译分类名，需要在 lang.json 中添加映射，并在这里查找翻译
            // 例如：getTranslation('cat_' + categoryName) - 但前提是你在 lang.json 中维护了这种映射
            button.textContent = categoryName; // 分类按钮显示 data.json 中的原始分类名

            // 添加点击事件监听器
            button.addEventListener('click', () => {
                currentCategory = categoryName; // 过滤时使用原始分类名
                categoryFilter.querySelectorAll('.category-button').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                filterAndRenderCards();
            });

            categoryFilter.appendChild(button);
        });

        // 给“全部”按钮添加事件监听器 (确保只添加一次)
         if (allButton && !allButton._hasClickListener) {
             allButton.addEventListener('click', () => {
                currentCategory = 'all';
                categoryFilter.querySelectorAll('.category-button').forEach(btn => btn.classList.remove('active'));
                allButton.classList.add('active');
                filterAndRenderCards();
            });
            allButton._hasClickListener = true;
        }
    }

    // --- 添加搜索输入框事件监听器 - 不需要修改，因为它调用了 filterAndRenderCards ---
    searchInput.addEventListener('input', () => {
        filterAndRenderCards();
    });

    // --- 页面加载时初始化 ---
    async function initialize() {
        // 1. 检测用户偏好语言 (先 localStorage，再 navigator)
        const savedLang = localStorage.getItem('preferredLang');
        const browserLang = navigator.language.split('-')[0]; // 获取主要语言代码 (e.g., "zh", "en")
        const initialLang = supportedLangs.includes(savedLang) ? savedLang
                          : supportedLangs.includes(browserLang) ? browserLang
                          : 'zh'; // 如果浏览器语言不受支持，默认为中文

        // 2. 加载翻译文件
        // 注意：这里只加载翻译文件，数据文件在后面加载
        await loadTranslations(initialLang);

        // 3. 翻译静态内容
        translateStaticElements();

        // 4. 更新语言切换按钮状态
        updateLanguageSwitcherButtons(currentLang);

        // 5. 添加语言切换按钮事件监听器
        if (languageSwitcher) {
             languageSwitcher.addEventListener('click', handleLanguageSwitch);
        }

        // 6. 加载数据 (原有逻辑，只加载 data.json)
        fetch(jsonFilePath)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                allData = data; // 存储数据
                loadingMessage.style.display = 'none';
                if (staticIntro) {
                    staticIntro.style.display = 'none';
                }

                filterAndRenderCards(); // 首次过滤并渲染所有卡片 (使用 data.json 数据和当前语言的按钮文本)
                createCategoryFilters(allData); // 创建分类按钮 (使用 data.json 的分类名和当前语言的“全部”按钮文本)
            })
            .catch(error => {
                console.error('获取或处理数据时出错:', error);
                // 使用翻译的加载失败消息
                loadingMessage.textContent = getTranslation('loadingFailedMessage');
                loadingMessage.style.color = 'red';
            });
    }

    // 启动初始化过程
    initialize();

});
