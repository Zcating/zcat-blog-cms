---
status: accepted
---

# 组件库表单组件只保留值级变更通道

`ZInput` 等六个组件（`ZInput` `ZTextarea` `ZCheckbox` `ZSelect` `ZDatePicker` `ZCascader`）暴露值级通道 `onValueChange`，同时又从 `React.ComponentProps<'input'>` 继承了 DOM 事件级的 `onChange` 与 `onInput`，于是同一组件有了两条语义重叠的变更通道。`onInput` 每次按键触发、参数是原始 DOM 事件，与 `onChange` 是同一类缺陷。而 `{...rest}` 展开在 `onChange={handleChange}` **之后**，调用方传入的 `onChange` 会静默覆盖组件自己的处理器，`onValueChange` 从此永不触发。

`ZFormItem` 为支持**原生**子元素必须注入 `onChange`，这恰好击穿了值级通道——**表单容器的必要性正好否定了值级组件存在的唯一理由**。库自己的文档 `z-input.md` 建议读者「按 shadcn Input 习惯用 `onChange`」，即推荐的正是会击穿可用通道的那条写法。影响面包含 CMS 的登录表单与用户资料编辑。组件自带的测试断言 `onValueChange` 会触发，但那只在孤立渲染时成立。

## 决策

- 组件库的表单组件的**变更通道**只有值级的 `onValueChange`，一律不接受 DOM 事件级的变更通道 `onChange` 与 `onInput`。
- `ZInput` 的 props 收窄为 `Omit<React.ComponentProps<'input'>, 'onChange' | 'onInput'>`，其余五个组件同理处理各自的 DOM 事件级变更通道。
- `onBlur` **保留**：它不是变更通道，规则不覆盖它（理由见下）。
- 收窄必须同时作用于**类型与运行时**。`Omit` 只在编译期生效，运行时传入的 `onChange`/`onInput` 仍会落进 `{...rest}` 并被转发到原生元素，因此组件需要显式把它们从展开对象中剔除。
- `ZFormItem` 保持现状：它继续向子元素注入 `value` / `onChange` / `onBlur` / `ref` / `onValueChange`。原生子元素照常工作，组件库子元素不接收 `onChange`，因此注入不会覆盖其值级通道。

## 理由

这是唯一自洽的解：`ZInput` 存在的理由就是提供 DOM input 无法直接给出的值级通知，若同时保留 `onChange`，错误的通道会静默胜出，而这种失效没有任何测试能捕获（组件的孤立测试会通过）。曾考虑两条通道都保留并显式同时调用——无类型破坏，但两个含义重叠的通道与"何时用哪个"的持续解释成本被保留下来。也考虑过仅调整展开顺序并修文档，成本最低，但调用方传入的 `onChange` 会被静默丢弃，是另一种形式的意外。

**`onInput` 属于同一条通道，因此一并移除。** 它每次按键触发、参数是原始 DOM 事件，与 `onValueChange` 的语义完全重叠；保留它等于把已诊断出的缺陷以第二条通道的形式重新引入。它与 `onChange` 的区别只是触发时机（每次按键 vs 失焦），而这恰恰说明它更接近值级通道的职责，不是豁免的理由。

**`onBlur` 不在规则范围内，这是刻意划界而非遗漏。** 本 ADR 约束的是**变更**通道，即随用户编辑触发、报告值发生变化的那一类。`onBlur` 不上报值，只报告焦点离开；`ZFormItem` 注入它是为了让 react-hook-form 记录 touched 态并驱动校验展示。若组件库一并拒绝 `onBlur`，touched 态会失效，校验行为随之改变——那是一个独立的回归，而不是本决策的收益。

## 后果

这是 `packages/ui` 的**破坏性变更**，与该包 AGENTS.md 的"公共 API 稳定优先"存在张力，理由是旧行为本身即是缺陷。收窄类型后，任何显式传 `onChange` 的调用点会在编译期暴露，便于逐一确认。`z-input.md` 及其余 11 份与实现不符的文档一并修正。