# poi-plugin-noro6-export-kai

poi舰队导出插件，支持导出舰队配置到noro6制空权模拟器。

## 功能特性

- 一键导出当前所有舰队配置（包含舰娘装备、熟练度、打孔、缎带）
- 自动导出陆航信息
- 支持在poi内部浏览器打开noro6并自动导入数据
- 复制 Deck Builder 格式的舰队及陆航数据
- 分别复制可直接粘贴到noro6反映区域的舰娘、装备响应数据

## 安装

在POI浏览器中选择**设置 → 扩展程序**，输入 `poi-plugin-noro6-export-kai` 并选择安装。

## 使用说明

1. **打开制空权模拟器** - 点击按钮，在外部浏览器打开noro6并自动导入当前舰队配置
2. **复制舰队编成数据** - 默认复制 Deck Builder 格式数据，不包含网页链接
3. **复制舰娘/装备数据** - 点击右侧图标，在舰队编成、舰娘、装备三种复制模式间循环切换，并将舰娘或装备响应分别粘贴到noro6反映区域
4. **陆航选项** - 选择要导出的基地航空队信息

## 致谢

本插件基于原作者 [oooo1111880](https://github.com/oooo1111880) 的 `poi-plugin-noro6-export` 修改而来，主要参考了 [KyoMiko](https://github.com/KyoMiko) 大佬的 `poi-plugin-fleet-export` 插件。
