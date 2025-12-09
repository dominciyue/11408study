# E-BookStore MCP Server

用于E-BookStore系统的MCP（Model Context Protocol）服务器，允许AI助手直接查询书店数据库中的书籍信息。

## 功能

提供以下5个工具函数：

1. **search_books** - 搜索书籍（支持标题、作者、ISBN、分类或全文搜索）
2. **get_book_by_id** - 根据ID获取书籍详情
3. **get_books_by_category** - 按分类获取书籍列表
4. **get_all_categories** - 获取所有书籍分类
5. **get_books_by_price_range** - 按价格区间查询书籍

## 环境要求

- Node.js >= 18.0.0
- MySQL 8.0
- 数据库：bookstore_db

## 安装

```bash
npm install
```

## 配置

数据库连接信息位于 `index.js` 中：

```javascript
const DB_CONFIG = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'Zy050811',
    database: 'bookstore_db'
};
```

## 在AI应用中配置

以Cherry Studio为例：

1. 打开设置 → MCP Servers
2. 添加新的MCP服务器：
   - 名称: E-BookStore
   - 命令: node
   - 参数: E:\bookstore-mcp-server\index.js
   - 类型: stdio

3. 启用服务器（绿色开关）
4. 重启应用

## 使用示例

在AI应用中可以使用以下命令：

```
使用get_all_categories工具获取所有书籍分类
```

```
使用search_books工具搜索标题包含"Python"的书籍
```

```
使用get_books_by_price_range工具查找价格在50到100元之间的书
```

## 启动服务器

```bash
node index.js
```

成功启动后应看到：
```
✓ 数据库连接成功
Bookstore MCP Server 运行中...
```

## 技术说明

- 使用MySQL连接池管理数据库连接
- LIMIT参数使用字符串拼接（MySQL prepared statement限制）
- 参数验证确保安全（防止SQL注入）
- deleted字段使用bit(1)类型，查询时使用0/1

## 版本

当前版本：1.0.0



