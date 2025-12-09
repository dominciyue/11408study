#!/usr/bin/env node

/**
 * Bookstore MCP HTTP Server
 * 将MCP工具包装成HTTP API，供n8n调用
 */

import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';

const app = express();
const PORT = 3001;

// 数据库配置
const DB_CONFIG = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'Zy050811',
    database: 'bookstore_db'
};

// 创建数据库连接池
const pool = mysql.createPool({
    ...DB_CONFIG,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// 中间件
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5678', 'http://127.0.0.1:5678'],
    credentials: true
}));
app.use(express.json());

// 工具函数：搜索书籍
async function searchBooks(params) {
    const { query, searchType = 'all', limit = 10 } = params;

    let sql = 'SELECT id, title, author, isbn, publisher, price, category, description FROM books WHERE deleted = 0';
    const queryParams = [];

    if (query && query.trim() !== '') {
        switch (searchType) {
            case 'title':
                sql += ' AND title LIKE ?';
                queryParams.push(`%${query}%`);
                break;
            case 'author':
                sql += ' AND author LIKE ?';
                queryParams.push(`%${query}%`);
                break;
            case 'isbn':
                sql += ' AND isbn = ?';
                queryParams.push(query);
                break;
            case 'category':
                sql += ' AND category LIKE ?';
                queryParams.push(`%${query}%`);
                break;
            default:
                sql += ' AND (title LIKE ? OR author LIKE ? OR isbn LIKE ? OR category LIKE ?)';
                queryParams.push(`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`);
        }
    }

    const limitValue = Math.max(1, Math.min(100, parseInt(limit) || 10));
    sql += ` LIMIT ${limitValue}`;

    const [rows] = await pool.execute(sql, queryParams);
    return rows;
}

// 工具函数：获取书籍详情
async function getBookById(params) {
    const { bookId } = params;
    const sql = 'SELECT * FROM books WHERE id = ? AND deleted = 0';
    const [rows] = await pool.execute(sql, [Number(bookId)]);
    return rows.length > 0 ? rows[0] : null;
}

// 工具函数：按分类获取书籍
async function getBooksByCategory(params) {
    const { category, limit = 20 } = params;
    const limitValue = Math.max(1, Math.min(100, parseInt(limit) || 20));
    const sql = `SELECT id, title, author, price, category FROM books WHERE category = ? AND deleted = 0 LIMIT ${limitValue}`;
    const [rows] = await pool.execute(sql, [category]);
    return rows;
}

// 工具函数：获取所有分类
async function getAllCategories() {
    const sql = 'SELECT DISTINCT category FROM books WHERE deleted = 0 AND category IS NOT NULL ORDER BY category';
    const [rows] = await pool.execute(sql);
    return rows.map(row => row.category);
}

// 工具函数：按价格区间获取书籍
async function getBooksByPriceRange(params) {
    const { minPrice = 0, maxPrice = 999999, limit = 20 } = params;
    const limitValue = Math.max(1, Math.min(100, parseInt(limit) || 20));
    const sql = `SELECT id, title, author, price, category FROM books WHERE price BETWEEN ? AND ? AND deleted = 0 LIMIT ${limitValue}`;
    const [rows] = await pool.execute(sql, [Number(minPrice), Number(maxPrice)]);
    return rows;
}

// API路由

// 健康检查
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'bookstore-mcp-http' });
});

// 获取所有可用工具列表
app.get('/tools', (req, res) => {
    res.json({
        tools: [
            {
                name: "search_books",
                description: "搜索书籍信息。支持按标题、作者、ISBN、分类或全文搜索。",
                parameters: {
                    query: "搜索关键词",
                    searchType: "搜索类型：all(全部), title(标题), author(作者), isbn(ISBN号), category(分类)",
                    limit: "返回结果数量限制"
                }
            },
            {
                name: "get_book_by_id",
                description: "根据书籍ID获取详细信息",
                parameters: { bookId: "书籍ID" }
            },
            {
                name: "get_books_by_category",
                description: "根据分类获取书籍列表",
                parameters: { category: "书籍分类", limit: "返回结果数量限制" }
            },
            {
                name: "get_all_categories",
                description: "获取所有书籍分类列表",
                parameters: {}
            },
            {
                name: "get_books_by_price_range",
                description: "根据价格区间获取书籍",
                parameters: { minPrice: "最低价格", maxPrice: "最高价格", limit: "返回结果数量限制" }
            }
        ]
    });
});

// 搜索书籍
app.post('/api/search_books', async (req, res) => {
    try {
        const result = await searchBooks(req.body);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 获取书籍详情
app.post('/api/get_book_by_id', async (req, res) => {
    try {
        const result = await getBookById(req.body);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 按分类获取书籍
app.post('/api/get_books_by_category', async (req, res) => {
    try {
        const result = await getBooksByCategory(req.body);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 获取所有分类
app.get('/api/get_all_categories', async (req, res) => {
    try {
        const result = await getAllCategories();
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 按价格区间获取书籍
app.post('/api/get_books_by_price_range', async (req, res) => {
    try {
        const result = await getBooksByPriceRange(req.body);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 统一工具调用接口（供n8n使用）
app.post('/api/call_tool', async (req, res) => {
    const { tool_name, parameters } = req.body;
    
    try {
        let result;
        switch (tool_name) {
            case 'search_books':
                result = await searchBooks(parameters || {});
                break;
            case 'get_book_by_id':
                result = await getBookById(parameters || {});
                break;
            case 'get_books_by_category':
                result = await getBooksByCategory(parameters || {});
                break;
            case 'get_all_categories':
                result = await getAllCategories();
                break;
            case 'get_books_by_price_range':
                result = await getBooksByPriceRange(parameters || {});
                break;
            default:
                return res.status(400).json({ success: false, error: `未知工具: ${tool_name}` });
        }
        res.json({ success: true, tool: tool_name, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 启动服务器
async function main() {
    try {
        const connection = await pool.getConnection();
        console.log('✓ 数据库连接成功');
        connection.release();
    } catch (error) {
        console.error('✗ 数据库连接失败:', error.message);
        process.exit(1);
    }

    app.listen(PORT, () => {
        console.log(`✓ Bookstore MCP HTTP Server 运行在 http://localhost:${PORT}`);
        console.log(`  - 工具列表: GET http://localhost:${PORT}/tools`);
        console.log(`  - 调用工具: POST http://localhost:${PORT}/api/call_tool`);
    });
}

main();

