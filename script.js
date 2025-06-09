document.addEventListener('DOMContentLoaded', () => {
    const dataContainer = document.getElementById('data-container');

    // 获取 JSON 数据的路径
    // 如果 data.json 在根目录，路径就是 'data.json'
    // 如果在 data 文件夹里，路径就是 'data/data.json'
    const jsonFilePath = 'data.json';

    fetch(jsonFilePath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // 清空加载提示
            dataContainer.innerHTML = '';

            // 遍历数据并创建 HTML 元素
            data.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.classList.add('data-item'); // 添加一个类以便样式化

                itemElement.innerHTML = `
                    <h2>${item.name}</h2>
                    <p>价格: ${item.price.toFixed(2)}</p>
                    <p>${item.description}</p>
                    <hr>
                `; // 使用 innerHTML 简单创建结构

                dataContainer.appendChild(itemElement);
            });
        })
        .catch(error => {
            console.error('获取或处理数据时出错:', error);
            dataContainer.innerHTML = '<p style="color: red;">加载数据失败。</p>';
        });
});
