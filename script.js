document.addEventListener('DOMContentLoaded', () => {
    const dataContainer = document.getElementById('data-container');
    const categoryFilter = document.getElementById('category-filter');
    const loadingMessage = document.getElementById('loading-message');
    let allData = []; // 存储所有数据的数组

    // JSON 数据文件路径
    const jsonFilePath = 'data.json';

    // --- 数据加载 ---
    fetch(jsonFilePath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            allData = data; // 存储所有数据
            loadingMessage.style.display = 'none'; // 隐藏加载消息
            renderCards(allData); // 首次渲染所有卡片
            createCategoryFilters(allData); // 创建分类按钮
        })
        .catch(error => {
            console.error('获取或处理数据时出错:', error);
            loadingMessage.textContent = '加载数据失败。';
            loadingMessage.style.color = 'red';
        });

    // --- 渲染卡片 ---
    function renderCards(dataToRender) {
        dataContainer.innerHTML = ''; // 清空当前显示的卡片

        if (dataToRender.length === 0) {
            dataContainer.innerHTML = '<p>没有找到匹配的数据。</p>';
            return;
        }

        dataToRender.forEach((item, index) => {
            const card = document.createElement('div');
            card.classList.add('data-card');

            // 计算动画延迟，制造错落效果
            card.style.animationDelay = `${index * 0.05}s`;

            card.innerHTML = `
                <h3>${item.title}</h3>
                <p class="card-content">${truncateContent(item.content)}</p>
                ${item.content.length > 150 ? '<button class="toggle-content">显示全部</button>' : ''}
            `;

            const contentElement = card.querySelector('.card-content');
            const toggleButton = card.querySelector('.toggle-content');

            // 存储完整内容到元素的数据属性中
            if (item.content.length > 150) {
                 contentElement.dataset.fullContent = item.content;
                 contentElement.dataset.truncatedContent = truncateContent(item.content); // 存储截断内容
            } else {
                // 如果内容不长，直接设置内容并移除按钮（如果JS模板里误加了）
                contentElement.textContent = item.content;
                 if(toggleButton) toggleButton.classList.add('hidden'); // 隐藏按钮
            }


            // 添加“显示全部”按钮事件监听器
            if (toggleButton) {
                toggleButton.addEventListener('click', () => {
                    const isExpanded = contentElement.classList.contains('expanded');

                    if (isExpanded) {
                        // 收起
                        contentElement.classList.remove('expanded');
                        contentElement.textContent = contentElement.dataset.truncatedContent; // 使用存储的截断内容
                        toggleButton.textContent = '显示全部';
                    } else {
                        // 展开
                        contentElement.classList.add('expanded');
                        contentElement.textContent = contentElement.dataset.fullContent; // 使用存储的完整内容
                        toggleButton.textContent = '收起';
                    }
                });
            }

            dataContainer.appendChild(card);
        });
    }

    // --- 内容截断函数 ---
    function truncateContent(content, maxLength = 150) {
        if (content.length <= maxLength) {
            return content;
        }
        return content.substring(0, maxLength) + '...';
    }


    // --- 创建分类按钮 ---
    function createCategoryFilters(data) {
        const categories = ['all']; // 总是包含“全部”
        data.forEach(item => {
            if (item.category && !categories.includes(item.category)) {
                categories.push(item.category);
            }
        });

        // 清空除“全部”按钮外的其他按钮
        categoryFilter.querySelectorAll('.category-button:not([data-category="all"])').forEach(button => button.remove());

        categories.forEach(category => {
            if (category === 'all') return; // “全部”按钮已经有了

            const button = document.createElement('button');
            button.classList.add('category-button');
            button.dataset.category = category; // 存储类别信息
            button.textContent = category; // 按钮文本

            // 添加点击事件监听器
            button.addEventListener('click', () => {
                // 移除所有按钮的 active 类
                categoryFilter.querySelectorAll('.category-button').forEach(btn => btn.classList.remove('active'));
                // 给当前点击的按钮添加 active 类
                button.classList.add('active');

                // 过滤数据
                const selectedCategory = button.dataset.category;
                const filteredData = selectedCategory === 'all'
                    ? allData
                    : allData.filter(item => item.category === selectedCategory);

                // 渲染过滤后的数据
                renderCards(filteredData);
            });

            categoryFilter.appendChild(button);
        });
    }

});
