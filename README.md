# 安装依赖
`npm install`

# 启动项目
`npm run build`, `npm run dev`

# 修改端口,默认浏览器
```js
// /webpack.config.js
[...]
"scripts": {
    "dev": "webpack-dev-server --open THE_SPECIFIC_EXPLORER --port THE_SPECIFIC_PORT --hot"
  }
```

-----------12.01更新日志----------

1. 增加全局模式和本地模式，通过cluster_node进行选择;
2. 本地模式的node全部显示节点id，全局模式部分显示;
3. 全局模式和本地模式下，通过"单击node"展开node detail，通过"双击node"关闭node detail;
4. 因为grapg的布局是forceDirected，所以有些元素在视觉上的隐藏难以避免，但可以通过拖拽等交互来观察;
5. 颜色深浅来表示index大小不可行，因为颜色编码已经部署在了显示是否diff为0以是否渲染成红色edge上，alternatively,已将index映射到edge的width上;
6. 无法实现固定⽅向功能，因为基础布局是force型，无法计算哪个node是最上面的节点并从上到下排列