# 章节切换问题修复指南

## 🐛 问题描述

在 `ChapterSelection.vue` 中出现错误：
```
切换章节失败: undefined
```

## 🔍 问题原因

**根本原因：** API 响应数据结构处理错误

在前端代码中，直接访问 `response.code`，但实际上 axios 返回的响应结构是：
```javascript
{
  data: {
    code: 200,
    message: "成功",
    // ... 其他数据
  },
  status: 200,
  statusText: "OK",
  headers: {},
  config: {}
}
```

实际的业务数据在 `response.data` 中，而不是直接在 `response` 中。

## ✅ 修复方案

### 1. 修复 ChapterSelection.vue

**修复前：**
```javascript
const response = await switchChapter(chapterId)
if (response.code === 200) {
  // ...
}
```

**修复后：**
```javascript
const response = await switchChapter(chapterId)
const data = response.data || response  // 兼容处理
if (data.code === 200) {
  // ...
}
```

### 2. 修复 AdventureMap.vue

同样的问题也存在于 `AdventureMap.vue` 的 `fetchUserInfo` 函数中，已同步修复。

### 3. 更新 TypeScript 类型定义

在 `auth.ts` 中添加了更准确的类型定义：

```typescript
// axios 实际返回的响应结构
interface AxiosApiResponse<T = any> {
    data: ApiResponse<T>;
    status: number;
    statusText: string;
    headers: any;
    config: any;
}
```

## 🧪 测试验证

修复后，请验证以下功能：

1. **章节选择页面**
   - [ ] 能正确显示用户信息和章节进度
   - [ ] 点击章节卡片能成功切换章节
   - [ ] 切换后能正确跳转到关卡地图

2. **关卡地图页面**
   - [ ] 能正确显示当前章节信息
   - [ ] 关卡状态显示正确（已完成/当前/锁定）
   - [ ] 用户信息加载正常

## 🔧 调试技巧

如果仍有问题，可以通过以下方式调试：

### 1. 检查浏览器控制台
```javascript
// 已添加调试日志
console.log('API响应:', response)
console.log('用户信息API响应:', response)
```

### 2. 检查网络请求
- 打开浏览器开发者工具
- 切换到 Network 标签
- 查看 `/api/auth/switch-chapter` 请求的响应

### 3. 验证后端接口
```bash
# 使用 curl 测试后端接口
curl -X POST http://localhost:3000/api/auth/switch-chapter \
  -H "Content-Type: application/json" \
  -d '{"chapter": "A"}' \
  -b "session_cookie_here"
```

## 📋 常见问题排查

### 问题1: 仍然显示 "undefined"
**可能原因：** 用户未登录或 session 过期
**解决方案：** 重新登录

### 问题2: 网络请求失败
**可能原因：** 后端服务未启动或端口不匹配
**解决方案：** 检查后端服务状态

### 问题3: 数据格式错误
**可能原因：** 后端返回的数据结构与预期不符
**解决方案：** 检查后端 `/auth/switch-chapter` 接口实现

## 🚀 预防措施

为避免类似问题，建议：

1. **统一响应处理**
   ```javascript
   // 创建统一的响应处理函数
   const handleApiResponse = (response) => {
     return response.data || response;
   };
   ```

2. **完善错误处理**
   ```javascript
   try {
     const response = await apiCall();
     const data = handleApiResponse(response);
     // 处理成功响应
   } catch (error) {
     console.error('API调用失败:', error);
     // 显示用户友好的错误信息
   }
   ```

3. **添加类型检查**
   ```typescript
   // 使用 TypeScript 严格类型检查
   interface ApiResponse {
     code: number;
     message: string;
     data?: any;
   }
   ```

---

✅ **修复完成！** 章节切换功能现在应该能正常工作了。