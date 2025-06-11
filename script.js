document.addEventListener('DOMContentLoaded', () => {
    // ... (原有变量获取)
    const dataContainer = document.getElementById('data-container');
    const categoryFilter = document.getElementById('category-filter');
    const loadingMessage = document.getElementById('loading-message');
    const staticIntro = document.getElementById('static-intro');
    const searchInput = document.getElementById('search-input');
    const languageSwitcher = document.querySelector('.language-switcher');

    let allData = [];
    let currentCategory = 'all'; // 'all' or a category name from data.json
    let translations = {};
    let currentLang = 'zh'; // Default language

    // JSON 数据文件路径 (保持不变)
    const jsonFilePath = 'data.json';

    // --- 新增: 获取评论相关的元素 ---
    const commentsButton = document.getElementById('comments-button');
    const commentsContainer = document.getElementById('comments-container');
    const dataContentWrapper = document.getElementById('data-content-wrapper'); // 获取数据内容包裹容器
    const giscusScript = document.querySelector('script[src^="https://giscus.app/client.js"]'); // 获取 Giscus 脚本标签


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

            // 新增: 更新 Giscus 脚本的语言属性
            if (giscusScript) {
                 // Giscus uses language codes like 'zh-CN', 'en'
                 // Need to map your lang codes ('zh', 'en') to Giscus codes
                 const giscusLang = lang === 'zh' ? 'zh-CN' : lang; // Example mapping
                 giscusScript.setAttribute('data-lang', giscusLang);
                 // To force Giscus to reload with the new language, you might need to remove and re-add the script
                 // This is more complex, usually setting the attribute is enough for subsequent loads or interactions.
                 // A simpler approach might be to destroy and recreate the giscus instance.
                 // For this simple example, just setting the attribute is ok.
                 // For a robust solution, refer to Giscus documentation on changing themes/languages dynamically.
            }


        } catch (error) {
            console.error('Error loading translations:', error);
            translations = {};
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
            if (key && element.placeholder !== undefined) {
                element.placeholder = getTranslation(key);
            }
        });

         // 翻译静态列表项
         const listItems = staticIntro ? staticIntro.querySelectorAll('ul li') : [];
         if (listItems.length > 0) {
             listItems.forEach((item, index) => {
                 const key = `introListItem${index + 1}`;
                 if (translations[key]) {
                      item.textContent = getTranslation(key);
                 }
             });
         }

        // 更新加载消息文本
        loadingMessage.textContent = getTranslation('loadingMessage');
        // 更新加载失败消息文本 (在 catch 块中使用)
        // loadingMessage.textContent = getTranslation('loadingFailedMessage');

        // 新增: 翻译评论按钮文本
        if (commentsButton) {
             commentsButton.textContent = getTranslation('buttonComments');
        }
    }

     // --- 新增: 处理按钮的 active 状态 ---
    function updateActiveButton(activeButton) {
        // 移除所有分类按钮和评论按钮的 active 类
        categoryFilter.querySelectorAll('.category-button').forEach(btn => btn.classList.remove('active'));
        // 给当前点击的按钮添加 active 类
        if (activeButton) {
             activeButton.classList.add('active');
        }
    }


    // 处理语言切换
    function handleLanguageSwitch(event) {
        const target = event.target;
        if (target.tagName === 'BUTTON' && target.dataset.lang) {
            const newLang = target.dataset.lang;
            if (supportedLangs.includes(newLang) && newLang !== currentLang) {
                loadTranslations(newLang).then(() => {
                    translateStaticElements(); // 翻译所有静态/JS文本
                    // 分类按钮的文本 (来自 data.json) 不需要翻译
                    // "全部" 按钮文本已在 translateStaticElements 中更新
                    // 评论按钮文本已在 translateStaticElements 中更新
                    // 数据卡片中的按钮文本会在 filterAndRenderCards -> renderCards 中使用 getTranslation 自动更新

                    // 重新渲染当前选中的分类 (会使用新的按钮翻译)
                    // 如果当前是评论页面，则保持评论页面
                    if (currentCategory !== 'comments') {
                         filterAndRenderCards();
                    } else {
                         // 如果当前是评论页面，只需要确保评论按钮文本更新即可
                         // 评论内容本身由 Giscus 控制语言，通常取决于浏览器或 data-lang 属性
                    }


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
                    button.classList.add('active');
                } else {
                    button.classList.remove('active');
                }
            });
        }
    }


    // --- 修改原有函数以支持显示/隐藏数据或评论 ---

    // 过滤并渲染卡片的主函数
    function filterAndRenderCards() {
        // 新增: 确保在渲染数据时显示数据区域，隐藏评论区域
        if (dataContentWrapper && commentsContainer) {
            dataContentWrapper.classList.remove('hidden');
            commentsContainer.classList.add('hidden');
        }

        const searchTerm = searchInput.value.toLowerCase();

        let dataAfterCategoryFilter = currentCategory === 'all'
            ? allData
            : allData.filter(item => item.category === currentCategory); // 过滤使用原始分类名

        const finalFilteredData = dataAfterCategoryFilter.filter(item => {
            const titleMatch = item.title && item.title.toLowerCase().includes(searchTerm);
            return titleMatch;
        });

        renderCards(finalFilteredData);
    }


    // --- 修改 renderCards 函数以使用翻译文本和数据 ---
    function renderCards(dataToRender) {
        dataContainer.innerHTML = '';

        if (dataToRender.length === 0) {
            dataContainer.innerHTML = `<p style="text-align: center; color: rgba(226, 232, 240, 0.8);">${getTranslation('noDataMessage')}</p>`;
            return;
        }

        dataToRender.forEach((item, index) => {
            const card = document.createElement('div');
            card.classList.add('data-card');

            const itemTitle = item.title || '';
            const itemContent = item.content || '';

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

             if (itemContent.length > 150) {
                 contentElement.dataset.truncatedContent = truncateContent(itemContent);
            } else {
                 if(toggleButton) toggleButton.classList.add('hidden');
            }

            // --- 添加“显示全部”按钮事件监听器 ---
            if (toggleButton) {
                toggleButton.addEventListener('click', () => {
                    const isExpanded = contentElement.classList.contains('expanded');
                    if (isExpanded) {
                        contentElement.classList.remove('expanded');
                        contentElement.textContent = contentElement.dataset.truncatedContent || truncateContent(itemContent);
                        toggleButton.textContent = getTranslation('buttonShowMore'); // 使用翻译文本
                    } else {
                        contentElement.classList.add('expanded');
                        contentElement.textContent = card.dataset.fullContent;
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

    // --- 内容截断函数 - 不需要修改 ---
    function truncateContent(content, maxLength = 150) {
        if (!content || content.length <= maxLength) {
            return content || '';
        }
        return content.substring(0, maxLength) + '...';
    }


    // --- 修改 createCategoryFilters 函数以处理新的评论按钮 ---
    function createCategoryFilters(data) {
        const categories = new Set(['all']);
        data.forEach(item => {
             if (item.category) {
                categories.add(item.category); // 直接使用 data.json 中的分类字符串
             }
        });

        // 清空除“全部”按钮和“评论”按钮外的其他按钮
         categoryFilter.querySelectorAll('.category-button:not([data-category="all"]):not([data-category="comments"])').forEach(button => button.remove());

        // 获取“全部”按钮并更新其文本
        const allButton = categoryFilter.querySelector('.category-button[data-category="all"]');
        if (allButton) {
            allButton.textContent = getTranslation('buttonAll'); // 翻译“全部”按钮
        }

        // 评论按钮文本已在 translateStaticElements 中处理

        const sortedCategories = Array.from(categories).sort();

        sortedCategories.forEach(categoryName => {
            if (categoryName === 'all') return; // “全部”按钮已经处理

            const button = document.createElement('button');
            button.classList.add('category-button');
            button.dataset.category = categoryName;
            button.textContent = categoryName; // 分类按钮显示 data.json 中的原始分类名

            // 添加点击事件监听器
            button.addEventListener('click', () => {
                currentCategory = categoryName; // 过滤时使用原始分类名
                updateActiveButton(button); // 更新 active 状态
                filterAndRenderCards(); // 过滤并渲染数据 (会显示数据区域)
            });

            // 将新创建的分类按钮插入到“全部”按钮和“评论”按钮之间
            if (commentsButton) {
                 categoryFilter.insertBefore(button, commentsButton);
            } else {
                 // 如果没有评论按钮，就添加到 categoryFilter 的末尾
                 categoryFilter.appendChild(button);
            }

        });

        // 给“全部”按钮添加事件监听器 (确保只添加一次)
         if (allButton && !allButton._hasClickListener) {
             allButton.addEventListener('click', () => {
                currentCategory = 'all';
                updateActiveButton(allButton); // 更新 active 状态
                filterAndRenderCards(); // 过滤并渲染数据 (会显示数据区域)
            });
            allButton._hasClickListener = true;
        }

         // --- 新增: 给“评论”按钮添加事件监听器 ---
         if (commentsButton && !commentsButton._hasClickListener) {
             commentsButton.addEventListener('click', () => {
                 currentCategory = 'comments'; // 设置当前类别为评论
                 updateActiveButton(commentsButton); // 更新 active 状态

                 // 隐藏数据区域，显示评论区域
                 if (dataContentWrapper && commentsContainer) {
                     dataContentWrapper.classList.add('hidden');
                     commentsContainer.classList.remove('hidden');
                 }
                 // Giscus 脚本会自动在 commentsContainer 中加载评论
             });
             commentsButton._hasClickListener = true;
         }

    }

    // --- 添加搜索输入框事件监听器 - 不需要修改 ---
    searchInput.addEventListener('input', () => {
        // 搜索只在数据内容中进行，如果在评论页面，搜索框是隐藏的
        // 如果用户在数据页面搜索，就正常过滤
        if (currentCategory !== 'comments') {
            filterAndRenderCards();
        }
         // 如果在评论页面，搜索框隐藏，此事件不会触发
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

                // 首次加载时，默认显示数据内容，隐藏评论容器
                if (dataContentWrapper && commentsContainer) {
                    dataContentWrapper.classList.remove('hidden');
                    commentsContainer.classList.add('hidden');
                }


                filterAndRenderCards(); // 首次过滤并渲染所有卡片 (使用 data.json 数据和当前语言的按钮文本)
                createCategoryFilters(allData); // 创建分类按钮 (使用 data.json 的分类名和当前语言的“全部”、“评论”按钮文本)

                // 确保“全部”按钮在加载完成后是 active 状态
                const allButton = categoryFilter.querySelector('.category-button[data-category="all"]');
                if(allButton) {
                    updateActiveButton(allButton);
                }

            })
            .catch(error => {
                console.error('获取或处理数据时出错:', error);
                loadingMessage.textContent = getTranslation('loadingFailedMessage'); // 使用翻译的加载失败消息
                loadingMessage.style.color = 'red';
            });
    }

    // 启动初始化过程
    initialize();

});
