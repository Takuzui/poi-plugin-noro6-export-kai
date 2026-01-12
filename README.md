# poi-plugin-noro6-export-kai

poi舰队导出插件，支持导出舰队配置到noro6制空权模拟器。

## 功能特性

- 一键导出当前所有舰队配置（包含舰娘装备、熟练度、打孔）
- 自动导出基地航空队信息
- 支持在poi内部浏览器打开noro6并自动导入数据
- 复制带舰队数据的URL链接
- 单独导出舰娘或装备数据到剪贴板（支持锁定筛选）

## 安装

在POI浏览器中选择**设置 → 扩展程序**，输入 `poi-plugin-noro6-export-kai` 并选择安装。

## 使用说明

### 舰队导出

1. **打开制空权模拟器** - 点击按钮，在外部浏览器打开noro6并自动导入当前舰队配置
2. **复制导出链接** - 复制带有舰队数据的URL，可发送给他人或稍后使用
3. **基地航空队选项** - 勾选"仅导出活动海域基地航空队"可过滤普通海域的陆航

## 致谢

本插件基于原作者 [oooo1111880](https://github.com/oooo1111880) 的 poi-plugin-noro6-export 修改而来，主要参考了 [KyoMiko](https://github.com/KyoMiko) 大佬的 poi-plugin-fleet-export 插件。