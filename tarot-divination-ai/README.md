# AI 塔罗牌占卜站

## 启动前准备

1. 进入项目目录。
2. 复制 `.env.example` 为 `.env`。
3. 把你的中转站密钥填进 `ANYTOKENS_API_KEY`。

```bash
cd '/Users/tatetang/Documents/800 owner/vibeCoding/tarot-divination-ai'
cp .env.example .env
```

`.env` 示例：

```env
ANYTOKENS_BASE_URL=https://anytokens.cc
ANYTOKENS_API_KEY=sk-你的真实key
```

## 启动项目

```bash
cd '/Users/tatetang/Documents/800 owner/vibeCoding/tarot-divination-ai'
npm start
```

启动成功后访问：

```text
http://localhost:3000
```

## 停止项目

在启动服务的终端里按 `Control + C`。

## 现在包含的功能

- 三张塔罗牌翻牌动画
- 通过本地代理调用 AI 占卜接口
- 逐段显现的 AI 解读区
- 本地占卜历史记录
- `.env` 读取 API Key

## 常见问题

### 页面能打开，但占卜失败

先看页面上的错误提示。

- 如果提示 `缺少 API Key`：检查 `.env` 是否存在，变量名是否写成 `ANYTOKENS_API_KEY`
- 如果提示 `No available accounts`：说明中转站当前没有可用账号池，不是前端代码问题
- 如果提示端口占用：换一个端口启动，例如 `PORT=3001 npm start`
