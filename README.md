# webpack4配置 代码拆分详解

- 默认的入口为'./src/'
- 默认出口'./dist'
~~~
"scripts": {
  "dev": "webpack --mode development",
  "build": "webpack --mode production"
}
~~~

development模式特性:
~~~
a.浏览器调试工具
b.注释、开发阶段的详细错误日志和提示
c.快速和优化的增量构建机制
~~~

production模式特性:
~~~
a.开启所有的优化代码
b.更小的bundle大小
c.去除掉只在开发阶段运行的代码
d.Scope hoisting和Tree-shaking
~~~
---
插件变化 webpack4删除了CommonsChunkPlugin插件，它使用内置API optimization.splitChunks 和 optimization.runtimeChunk，即webpack会默认为你生成共享的代码块。

## Use

### 配置项
1. Entry：入口，Webpack 执行构建的第一步将从 Entry 开始，可抽象成输入。
2. Module：模块，在 Webpack 里一切皆模块，一个模块对应着一个文件。Webpack 会从配置的 Entry 开始递归找出所有依赖的模块。
3. Chunk：代码块，一个 Chunk 由多个模块组合而成，用于代码合并与分割。
4. Loader：模块转换器，用于把模块原内容按照需求转换成新内容。
5. Plugin：扩展插件，在 Webpack 构建流程中的特定时机注入扩展逻辑来改变构建结果或做你想要的事情。
6. Output：输出结果，在 Webpack 经过一系列处理并得出最终想要的代码后输出结果。

### 启动命令
- 执行webpack --mode development 会去全局找webpack包，如果没有安装的话会告诉你 bash: webapck: command not found。解决方案：安装webpack-cli
- 使用npx 即 npx webpack development（ npm 5.2.0版本支持的一个工具）
了webpack-dev-server，它是开发时的一个服务器，把打包的文件全部放入内存中，可以热更新，热替换等方便我们开发。

### 多入口对应的html加载模块用chunk区分
~~~
 new HtmlWebpackPlugin({
    template: path.resolve(__dirname,'src','index.html'),
    filename:'index.html',
    chunks:['index'],
    hash:true,//防止缓存
    minify:{
        removeAttributeQuotes:true//压缩 去掉引号
    }
}),
new HtmlWebpackPlugin({
    template: path.resolve(__dirname,'src','index.html'),
    filename:'base.html',
    chunks:['base'],
    hash:true,//防止缓存
    minify:{
        removeAttributeQuotes:true//压缩 去掉引号
    }
}),
~~~

### watch监听文件打包变化，当文件变化时自动打包
~~~
watch: true,
watchOptions: {
    ignored: /node_modules/, //忽略不用监听变更的目录
    aggregateTimeout: 500, //防止重复保存频繁重新编译,500毫米内重复保存不打包
    poll:1000 //每秒询问的文件变更的次数
},
~~~

### resolve解析(比较常用，可以不写文件后缀名)
~~~
resolve:{
    extensions: ["",".js",".css",".json"]
},
~~~

### 压缩js，让输出的JS文件体积更小、加载更快、流量更省，还有混淆代码的加密功能 new UglifyjsWebpackPlugin()

## 注意点
1. 提取css文件为单独文件，不是像上面直接打包进入js中,注意extract-text-webpack-plugin 必须下载next版本 不然不支持webpack4
2. commonchunk配置项被彻底去掉，之前需要通过配置两次new webpack.optimize.CommonsChunkPlugin来分别获取vendor和manifest的通用chunk方式已经做了整合，直接在optimization中配置runtimeChunk和splitChunks即可 ，提取功能也更为强大，具体配置见：splitChunks
3. runtimeChunk可以配置成true，single或者对象，用自动计算当前构建的一些基础chunk信息，类似之前版本中的manifest信息获取方式。
4. webpack.optimize.UglifyJsPlugin现在也不需要了，只需要使用optimization.minimize为true就行，production mode下面自动为true，当然如果想使用第三方的压缩插件也可以在optimization.minimizer的数组列表中进行配置
## 配置优化
### 动态链接库DLL
即把基础模块的代码打包进入动态链接库里，比如常用的react，vue等，当需要导入的模块在动态连接库里的时候，模块不能再次被打包，而是去动态连接库里获取
1. 创建一个webpack.dll.config.js文件打包常用类库到dll中
~~~
module.exports = {
    entry: {
        react: ['vue'] //vue模块打包到一个动态连接库
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].dll.js', //输出动态连接库的文件名称
        library: '_dll_[name]' //全局变量名称
    },
    plugins: [
        new webpack.DllPlugin({
            path: path.join(__dirname, 'dist', '[name].manifest.json')
            name: '_dll_[name]', //和output.library中一致，也就是输出的manifest.json中的 name值
        })
    ]
}
webpack --config webpack.dll.config.js --mode production
~~~
2.配置文件 webpack.config.js中加入以下代码，这样会从dll中获取vue，而且不用再次打包vue了。
~~~
plugins: [
 new webpack.DllReferencePlugin({
       manifest: require(path.join(__dirname, 'dist', 'vendor.manifest.json')),
   })
]
webpack --config webpack.config.js --mode development
~~~

## Webpack热替换之HMR
Hot Module Replacement（以下简称 HMR）是 webpack 中超级有用的特性之一 ，当你对代码进行修改并保存后，webpack 将对代码重新打包，并将新的模块发送到浏览器端，浏览器通过新的模块替换老的模块，这样在不刷新浏览器的前提下就能够对应用进行更新。从而减少很多时间。比如，页面中有一个modal框，需要点击button触发modal显示，在开发过程中，如果修改了modal 的样式，触发浏览器刷新，你还需要再次点击button才能看到修改后的modal样式，但是热替换是不需要刷新浏览器的，可以直接观察到修改后的变化。
是watch是针对打包时文件发生变化进行重新打包，而HMR是针对webpack-dev-server的。
1. devserver配置如下
~~~
devServer: {//配置此静态文件服务器，可以用来预览打包后项目
    inline:true,//打包后加入一个websocket客户端
    hot:true,//热加载
    contentBase: path.resolve(__dirname, 'dist'),//开发服务运行时的文件根目录
    host: 'localhost',//主机地址
    port: 9090,//端口号
    compress: true//开发服务器是否启动gzip等压缩
}
~~~
2. plugins配置项加入以下两行
~~~
 new webpack.HotModuleReplacementPlugin(),
 new webpack.NamedModulesPlugin()//用户名替代id
~~~
3. 业务代码中的修改
if(module.hot) {
    module.hot.accept('./hello.js', function() {
        div.innerHTML = hello()
    })
}
4. 原理及流程解析大致流程：
webpack-dev-server可以和浏览器之间建立一个web socket进行通信，一旦新文件被打包出来，webpack-dev-server就告诉浏览器这个消息，这时浏览器就可以自动刷新页面或者进行热替换操作。当一个模块b发生改变，而模块内又没有HMR代码（类似于上述3中的代码）来处理这一消息时，那这一消息就会被传递到依赖模块b的其他模块上；如果消息在新模块上没有被捕获的话就会再次进行传递；如果所有的消息都被捕获了的话，那我们的应用就应该已经按照代码进行了更新；反之如果有消息冒泡到了入口(entry)文件还没有被捕获的话，那就说明我们的代码中没有处理这类变更方法，那webpack就会刷新浏览器页面，即从HMR回退到LiveReload。

## 提取公共代码
这个变化还是很大的，之前的webpack版本用的都是commonchunkplugin，但是webpack4开始使用common-chunk-and-vendor-chunk
配置如下:
~~~
optimization {
    splitChunks: {
        cacheGroups: {                  // 这里开始设置缓存的 chunks
            commons: {
                chunks: 'async',      // 必须三选一： "initial" | "all" | "async"(默认就是异步)
                minSize: 0,             // 最小尺寸，默认0,
                minChunks: 2,           // 最小 chunk ，默认1
                maxInitialRequests: 5   // 最大初始化请求书，默认1
            },
            vendor: {
                test: /node_modules/,   // 正则规则验证，如果符合就提取 chunk
                chunks: 'async',      // 必须三选一： "initial" | "all" | "async"(默认就是异步)
                name: 'vendor',         // 要缓存的 分隔出来的 chunk 名称
                priority: 10,           // 缓存组优先级
                enforce: true
            }
        }
    },
    runtimeChunk: true
}
~~~
