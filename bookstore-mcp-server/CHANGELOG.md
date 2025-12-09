# MCP服务器修复日志

## 修复内容 (2024-11-13)

### 🐛 修复的问题

1. **根本原因：MySQL prepared statement不支持LIMIT占位符**
   - 错误：`Incorrect arguments to mysqld_stmt_execute`
   - 问题SQL：`SELECT ... LIMIT ?` 
   - 修复：改用字符串拼接 `LIMIT ${limitValue}`
   - 安全措施：严格验证limit参数 `parseInt()` + 边界检查(1-100)
   
2. **deleted字段类型** - 数据库中是 `bit(1)` 类型
   - 修复：使用 `deleted = 0` 而不是 `deleted = false`
   - 原因：bit类型需要用数字(0/1)比较

2. **参数类型错误**
   - 修复：将所有 `parseInt()` 改为 `Number()`，并添加了边界检查
   - 添加：`Math.max(1, Math.min(100, Number(limit) || 默认值))`

3. **空查询处理**
   - 修复：改进了空字符串查询的判断逻辑
   - 从 `if (query)` 改为 `if (query && query.trim() !== '')`

4. **错误信息不清晰**
   - 添加：详细的调试日志和错误信息
   - 包含：SQL语句、参数、错误堆栈等信息

### ✅ 修复后的功能

所有5个工具现在应该可以正常工作：
- ✓ search_books - 搜索书籍
- ✓ get_book_by_id - 获取书籍详情  
- ✓ get_books_by_category - 按分类获取
- ✓ get_all_categories - 获取所有分类
- ✓ get_books_by_price_range - 按价格区间查询

### 🧪 测试方法

#### 方法1：运行测试脚本
```bash
node test.js
```

#### 方法2：在AI应用中测试
重启MCP服务器后，在聊天界面使用：
- "使用get_all_categories工具"
- "使用search_books工具查询所有书籍，限制5条"
- "使用get_books_by_price_range工具查找100元以下的书"

### 📝 注意事项

1. 修改代码后，必须重启MCP服务器
2. 可能需要重启AI应用才能生效
3. 查看终端日志以了解详细的执行情况

