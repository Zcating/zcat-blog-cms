---
status: accepted
---

# 组件库表单组件只保留值级变更通道

`ZInput` 等六个组件（`ZInput` `ZTextarea` `ZCheckbox` `ZSelect` `ZDatePicker` `ZCascader`）暴露值级通道 `onValueChange`，同时又从 `React.ComponentProps<'input'>` 继承了 DOM 事件级的 `onChange`，于是同一组件有了两条语义重叠的变更通道。而 `{...rest}` 展开在 `onChange={handleChange}` **之后**，调用方传入的 `onChange` 会静默覆盖组件自己的处理器，`onValueChange` 从此永不触发。

`ZFormItem` 为支持**原生**子元素必须注入 `onChange`，这恰好击穿了值级通道——**表单容器的必要性正好否定了值级组件存在的唯一理由**。库自己的文档 `z-input.md` 建议读者「按 shadcn Input 习惯用 `onChange`」，即推荐的正是会击穿可用通道的那条写法。影响面包含 CMS 的登录表单与用户资料编辑。组件自带的测试断言 `onValueChange` 会触发，但那只在孤立渲染时成立。

## 决策

- 组件库的表单组件**只提供值级通道** `onValueChange`，一律不接受 DOM 事件级通道。
- `ZInput` 的 props 收窄为 `Omit<React.ComponentProps<'input'>, 'onChange'>`，其余五个组件同理处理各自的 DOM 事件通道。
- `ZFormItem` 保持现状：它继续向子元素注入 `value` / `onChange` / `onBlur` / `ref` / `onValueChange`。原生子元素照常工作，组件库子元素不接收 `onChange`，因此注入不会覆盖其值级通道。

## 理由

这是唯一自洽的解：`ZInput` 存在的理由就是提供 DOM input 无法直接给出的值级通知，若同时保留 `onChange`，错误的通道会静默胜出，而这种失效没有任何测试能捕获（组件的孤立测试会通过）。曾考虑两条通道都保留并显式同时调用——无类型破坏，但两个含义重叠的通道与"何时用哪个"的持续解释成本被保留下来。也考虑过仅调整展开顺序并修文档，成本最低，但调用方传入的 `onChange` 会被静默丢弃，是另一种形式的意外。

## 后果

这是 `packages/ui` 的**破坏性变更**，与该包 AGENTS.md 的"公共 API 稳定优先"存在张力，理由是旧行为本身即是缺陷。收窄类型后，任何显式传 `onChange` 的调用点会在编译期暴露，便于逐一确认。`z-input.md` 及其余 11 份与实现不符的文档一并修正。