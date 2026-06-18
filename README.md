This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


项目名：AI  ChatBot
定位：一个帮助新手学习 的聊天助手
核心能力：
- 聊天问答
- 学习模式切换
- Prompt 模板
- 历史会话
- Markdown 回复
- 代码块展示
- 模拟流式输出
- 后续接真实大模型


## V1：纯前端假聊天机器人

第一版先不接真实 AI，具备骨架即可。

功能：

```txt
1. 左侧会话列表
2. 右侧聊天窗口
3. 用户输入消息
4. 机器人返回模拟回复
5. loading 动画
6. 支持清空聊天
7. 支持本地保存历史记录，浏览器localstorge
```

模拟回复可以写死：

```ts
function mockReply(input: string) {
  if (input.includes("React")) {
    return "React 的核心是组件、状态和 props。建议你先从组件拆分开始练习。"
  }

  if (input.includes("useEffect")) {
    return "useEffect 适合处理副作用，比如请求数据、监听事件、定时器等。"
  }

  return "我现在还是一个模拟 AI，后续可以接入真实大模型接口。"
}
```


---

## V2：做成真正的聊天产品 UI

功能升级：

```txt
1. 消息气泡区分用户和助手
2. 支持 Markdown 渲染
3. 支持代码块样式
4. 支持复制消息
5. 支持重新生成
6. 支持停止生成按钮
7. 支持空状态欢迎页
8. 支持快捷问题卡片
```

欢迎页可以这样：

```txt
你好，我是你的 React 学习助手

你可以问我：
[React 组件怎么拆分？]
[useState 和 useEffect 有什么区别？]
[帮我制定 7 天 React 学习计划]
[帮我检查这段代码]
```

---

## V3：加入“学习模式”

这是让项目区别于普通聊天机器人的关键。

模式可以有：

```txt
1. 解释模式：用通俗语言解释概念
2. 面试模式：像面试官一样提问
3. 纠错模式：帮我检查代码问题
4. 计划模式：帮我生成学习计划
5. 总结模式：帮我总结知识点
```

页面上做一个模式选择器，类似面具选择，切换system prompt：

```txt
当前模式：React 面试官
当前模式：代码审查助手
当前模式：学习计划助手
```

不同模式下，模拟回复也不一样。

比如：

```ts
const modes = {
  explain: "解释模式",
  interview: "面试模式",
  codeReview: "代码审查模式",
  plan: "学习计划模式",
}
```

状态管理、条件渲染、组件设计，而且项目会更像产品。

---

## V4：接真实大模型接口

等前面 UI 做稳定后，再接真实接口。

技术栈建议：

```txt
Next.js
React
TypeScript
Tailwind CSS
Next.js Route Handler
ZHIPU AI SDK / 普通 fetch SSE
```

Next.js App Router 里可以用 `app/api/chat/route.ts` 写后端接口，Route Handler 支持 GET、POST 等方法，适合放聊天接口，避免把大模型 API Key 暴露在前端。([Next.js][1])

如果想少写一些流式聊天状态管理，可以看 Vercel AI SDK 的 `useChat`，它本身就是为聊天 UI 设计的，支持流式消息并管理聊天状态。([AI SDK][2])


---

## V5：做成“复杂聊天机器人”

最后再加复杂功能。

可以加：

```txt
1. 多会话管理
2. 会话标题自动生成
3. Prompt 模板市场
4. 本地历史搜索
5. 上传代码片段
6. AI 代码解释
7. AI 学习计划生成
8. 收藏优秀回答
9. 导出聊天记录
10. 暗黑模式
```

再进阶一点，可以做：

```txt
1. 工具调用展示
2. AI 思考步骤卡片
3. 代码检查结果卡片
4. 待办事项生成
5. 学习进度记录
```