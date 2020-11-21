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