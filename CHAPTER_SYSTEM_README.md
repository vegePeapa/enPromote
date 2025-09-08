# 多章节学习系统升级说明

## 概述

本次升级将原有的单一学习路径改造为多章节"多邻国"风格的学习系统，支持不同场景的英语学习。

## 新功能特性

### 1. 多章节支持
- **A章节**: 酒店场景 - 学习酒店入住、退房等相关英语
- **B章节**: 餐厅场景 - 学习餐厅点餐、用餐等相关英语
- 每个章节都有独特的背景主题和词汇库

### 2. 纵向滚动关卡地图
- 采用纵向滚动的关卡地图布局，类似游戏关卡系统
- 关卡流程：
  ```
  ...
   |           // 用户可向上滑动查看历史完成的关卡
  AI对话 (已完成)
  ------------------
  单词学习 (当前章节 n)
   |
  拼写练习
   |
  情景对话
   |
  ...
  ------------------
  单词学习 (下一章节 n+1，未解锁状态)
  ```
- 关卡解锁机制：
  - 当前章节必须完成所有关卡才能解锁下一章节
  - 未解锁的章节只显示第一个关卡（单词学习）作为预览
  - 用户可以向上滚动查看已完成的历史关卡

### 3. 章节特定内容
- 每个章节有对应的词汇库和AI提示词
- AI对话自动适应当前章节场景（无需用户选择）
  - 酒店场景：AI扮演酒店前台工作人员
  - 餐厅场景：AI扮演餐厅服务员
  - 机场场景：AI扮演机场工作人员
- 章节特定的学习进度跟踪
- 独立的章节完成度统计
- 未解锁章节仅显示第一关（单词学习），其他关卡完全隐藏

## 数据库变更

### User模型更新
```javascript
// 新增字段
chapters: {
  type: Map,
  of: {
    level: Number,
    score: Number, 
    completedWords: Number,
    wordP: Boolean,
    spellP: Boolean,
    listenP: Boolean,
    customsP: Boolean,
    coverP: Boolean
  }
},
currentChapter: String // 'A' 或 'B'
```

### Word模型更新
```javascript
// 新增字段
chapter: String,    // 'A', 'B'
scenario: String    // 'hotel', 'restaurant'
```

## API接口变更

### 新增接口
- `POST /auth/switch-chapter` - 切换学习章节
- 参数: `{ chapter: 'A' | 'B' }`

### 更新接口
- `GET /auth/info` - 返回数据新增章节信息和当前章节
- `GET /commend-words/get-words` - 支持章节参数过滤
- `POST /ai/ai_generate_question` - 自动根据用户当前章节选择对应场景的AI提示词
  - 无需前端传递场景参数，后端自动判断
  - 酒店场景使用酒店前台提示词
  - 餐厅场景使用餐厅服务员提示词

## 前端组件变更

### 新增页面
- `ChapterSelection.vue` - 章节选择页面
- `AdventureMap.vue` - 纵向滚动关卡地图页面

### 关卡地图组件设计
- `LevelNode.vue` - 单个关卡节点组件
  - 支持不同状态：已完成、当前可玩、锁定、预览
  - 显示关卡类型图标和进度
- `ChapterDivider.vue` - 章节分隔线组件
  - 显示章节完成状态和解锁提示
- `ScrollableMap.vue` - 可滚动地图容器
  - 支持向上滚动查看历史关卡
  - 自动定位到当前可玩关卡

### 路由更新
- `/chapters` - 章节选择页面
- `/adventure-map` - 纵向滚动关卡地图页面
- `/level/:type/:chapter` - 具体关卡游戏页面

## 部署步骤

### 1. 数据迁移
```bash
# 运行数据迁移脚本
cd server
node scripts/migrateToChapters.js
```

### 2. 更新依赖
```bash
# 前端
cd en_ui
npm install

# 后端
cd server  
npm install
```

### 3. 启动服务
```bash
# 启动后端
cd server
npm start

# 启动前端
cd en_ui
npm run dev
```

## UI设计详情

### 纵向滚动关卡地图布局
```
┌─────────────────────────────────┐
│        向上滑动查看历史           │
│             ↑                   │
│      AI对话(酒店场景) ✓         │
│           │                     │
│        情景对话 ✓               │
│           │                     │
│        拼写练习 ✓               │
│           │                     │
│        单词学习 ✓               │
│    ═══════════════════════════   │ ← 章节分隔线 (酒店场景完成)
│        单词学习 ●               │ ← 当前可玩关卡 (餐厅场景)
│           │                     │
│        拼写练习 🔒              │
│           │                     │
│        情景对话 🔒              │
│           │                     │
│     AI对话(餐厅场景) 🔒         │
│    ═══════════════════════════   │ ← 章节分隔线
│        单词学习 🔒              │ ← 未解锁章节预览 (机场场景)
│          ？？？                 │ ← 其他关卡完全隐藏
│             ↓                   │
│        向下滑动查看更多           │
└─────────────────────────────────┘
```

### 关卡状态说明
- ✓ **已完成**: 绿色背景，显示完成标记
- ● **当前可玩**: 高亮显示，可点击进入
- 🔒 **锁定**: 灰色显示，不可点击
- **预览**: 半透明显示，仅显示未解锁章节的第一关（单词学习），其他关卡完全隐藏

## 使用流程

1. **登录系统** - 用户登录后会自动迁移到新的章节系统
2. **选择章节** - 在章节选择页面选择要学习的场景
3. **关卡地图** - 进入纵向滚动的关卡地图
4. **关卡挑战** - 点击当前可玩关卡进入学习
5. **进度追踪** - 完成关卡后自动解锁下一关卡
6. **章节切换** - 可随时返回章节选择页面

## 兼容性说明

- 保持了原有的`cet4`字段，确保向后兼容
- 现有用户数据会自动迁移到新的章节系统
- 原有的API接口保持可用，同时支持新的章节参数

## 配置文件

### 章节配置 (`server/config/chapters.js`)
```javascript
const CHAPTERS = {
  A: {
    name: '酒店场景',
    scenario: 'hotel',
    color: '#4A90E2',
    aiPrompt: '酒店前台工作人员提示词...'
  },
  B: {
    name: '餐厅场景', 
    scenario: 'restaurant',
    color: '#F5A623',
    aiPrompt: '餐厅服务员提示词...'
  }
}
```

## 注意事项

1. **数据备份**: 升级前请备份数据库
2. **渐进式部署**: 建议先在测试环境验证
3. **用户通知**: 提前通知用户系统升级内容
4. **监控日志**: 升级后密切关注错误日志

## 技术实现要点

### 滚动定位逻辑
```javascript
// 自动滚动到当前可玩关卡
const scrollToCurrentLevel = () => {
  const currentLevelElement = document.querySelector('.level-current');
  if (currentLevelElement) {
    currentLevelElement.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center' 
    });
  }
};
```

### 关卡状态计算
```javascript
const getLevelStatus = (levelIndex, chapterIndex, userProgress) => {
  const currentChapter = userProgress.currentChapter;
  const chapterProgress = userProgress.chapters[currentChapter];
  
  if (chapterIndex < currentChapter) return 'completed';
  if (chapterIndex > currentChapter) {
    // 未解锁章节只显示第一关（单词学习），其他关卡隐藏
    return levelIndex === 0 ? 'preview' : 'hidden';
  }
  if (levelIndex <= chapterProgress.currentLevel) return 'available';
  return 'locked';
};

const shouldShowLevel = (levelIndex, chapterIndex, userProgress) => {
  const status = getLevelStatus(levelIndex, chapterIndex, userProgress);
  // 隐藏状态的关卡不显示在地图上
  return status !== 'hidden';
};
```

### 无限滚动优化
- 使用虚拟滚动技术处理大量关卡节点
- 懒加载历史关卡数据
- 预加载下一章节的预览信息

## 后续扩展

- 可轻松添加更多章节（C、D等）
- 支持更多场景类型（机场、购物等）
- 章节间的依赖关系配置
- 成就系统和徽章奖励
- 关卡地图主题切换（不同场景的视觉风格）
- 社交功能（好友进度对比）