#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import mysql from "mysql2/promise";

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

// 创建MCP服务器
const server = new Server(
    {
        name: "bookstore-mcp-server",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

// 工具：搜索书籍
async function searchBooks(params) {
    const { query, searchType = 'all', limit = 10 } = params;

    let sql = 'SELECT id, title, author, isbn, publisher, price, category, description FROM books WHERE deleted = 0';
    const queryParams = [];

    // 只有当query存在且不为空字符串时才添加搜索条件
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

    // 确保limit是有效的正整数（防止SQL注入）
    const limitValue = Math.max(1, Math.min(100, parseInt(limit) || 10));
    sql += ` LIMIT ${limitValue}`;

    const [rows] = await pool.execute(sql, queryParams);
    return rows;
}

// 工具：获取书籍详情
async function getBookById(params) {
    const { bookId } = params;

    const sql = 'SELECT * FROM books WHERE id = ? AND deleted = 0';
    const [rows] = await pool.execute(sql, [Number(bookId)]);

    return rows.length > 0 ? rows[0] : null;
}

// 工具：按分类获取书籍
async function getBooksByCategory(params) {
    const { category, limit = 20 } = params;

    // 确保limit是有效的正整数（防止SQL注入）
    const limitValue = Math.max(1, Math.min(100, parseInt(limit) || 20));
    const sql = `SELECT id, title, author, price, category FROM books WHERE category = ? AND deleted = 0 LIMIT ${limitValue}`;
    const [rows] = await pool.execute(sql, [category]);

    return rows;
}

// 工具：获取所有分类
async function getAllCategories() {
    const sql = 'SELECT DISTINCT category FROM books WHERE deleted = 0 AND category IS NOT NULL ORDER BY category';
    const [rows] = await pool.execute(sql);

    return rows.map(row => row.category);
}

// 工具：获取价格区间内的书籍
async function getBooksByPriceRange(params) {
    const { minPrice = 0, maxPrice = 999999, limit = 20 } = params;

    // 确保limit是有效的正整数（防止SQL注入）
    const limitValue = Math.max(1, Math.min(100, parseInt(limit) || 20));
    const sql = `SELECT id, title, author, price, category FROM books WHERE price BETWEEN ? AND ? AND deleted = 0 LIMIT ${limitValue}`;
    const [rows] = await pool.execute(sql, [Number(minPrice), Number(maxPrice)]);

    return rows;
}

// 注册工具列表
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "search_books",
                description: "搜索书籍信息。支持按标题、作者、ISBN、分类或全文搜索。",
                inputSchema: {
                    type: "object",
                    properties: {
                        query: {
                            type: "string",
                            description: "搜索关键词"
                        },
                        searchType: {
                            type: "string",
                            enum: ["all", "title", "author", "isbn", "category"],
                            description: "搜索类型：all(全部), title(标题), author(作者), isbn(ISBN号), category(分类)",
                            default: "all"
                        },
                        limit: {
                            type: "number",
                            description: "返回结果数量限制",
                            default: 10
                        }
                    }
                }
            },
            {
                name: "get_book_by_id",
                description: "根据书籍ID获取详细信息",
                inputSchema: {
                    type: "object",
                    properties: {
                        bookId: {
                            type: "number",
                            description: "书籍ID"
                        }
                    },
                    required: ["bookId"]
                }
            },
            {
                name: "get_books_by_category",
                description: "根据分类获取书籍列表",
                inputSchema: {
                    type: "object",
                    properties: {
                        category: {
                            type: "string",
                            description: "书籍分类"
                        },
                        limit: {
                            type: "number",
                            description: "返回结果数量限制",
                            default: 20
                        }
                    },
                    required: ["category"]
                }
            },
            {
                name: "get_all_categories",
                description: "获取所有书籍分类列表",
                inputSchema: {
                    type: "object",
                    properties: {}
                }
            },
            {
                name: "get_books_by_price_range",
                description: "根据价格区间获取书籍",
                inputSchema: {
                    type: "object",
                    properties: {
                        minPrice: {
                            type: "number",
                            description: "最低价格",
                            default: 0
                        },
                        maxPrice: {
                            type: "number",
                            description: "最高价格",
                            default: 999999
                        },
                        limit: {
                            type: "number",
                            description: "返回结果数量限制",
                            default: 20
                        }
                    }
                }
            }
        ]
    };
});

// 处理工具调用
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        let result;

        switch (name) {
            case "search_books":
                result = await searchBooks(args);
                break;
            case "get_book_by_id":
                result = await getBookById(args);
                break;
            case "get_books_by_category":
                result = await getBooksByCategory(args);
                break;
            case "get_all_categories":
                result = await getAllCategories();
                break;
            case "get_books_by_price_range":
                result = await getBooksByPriceRange(args);
                break;
            default:
                throw new Error(`未知的工具: ${name}`);
        }

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(result, null, 2)
                }
            ]
        };
    } catch (error) {
        console.error(`[ERROR] ${name} 调用失败:`, error.message);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        error: error.message,
                        tool: name,
                        timestamp: new Date().toISOString()
                    }, null, 2)
                }
            ],
            isError: true
        };
    }
});

// 启动服务器
async function main() {
    // 测试数据库连接
    try {
        const connection = await pool.getConnection();
        console.error('✓ 数据库连接成功');
        connection.release();
    } catch (error) {
        console.error('✗ 数据库连接失败:', error.message);
        process.exit(1);
    }

    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Bookstore MCP Server 运行中...');
}

main().catch((error) => {
    console.error('服务器启动失败:', error);
    process.exit(1);
});