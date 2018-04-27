const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const webpack = require('webpack')

const api_host = "http://cloud.mydearest.cn"

module.exports = {
    entry: './src/index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'js/[name].js'
    },
    resolve: {
        modules: [path.resolve(__dirname, "node_modules")],
        extensions: [".js", ".json", ".jsx"],
        mainFiles: ["index"],
        alias: {
            // 替换别名
        }
    },
    module: {
        rules: [
            {
                // 转译js、jsx文件
                test: /\.(js|jsx)$/,// 匹配特定文件的正则表达式或正则表达式数组
                include: path.resolve(__dirname, 'src'),// 指定需要转译的文件夹
                exclude: path.resolve(__dirname, 'node_modules'),// 指定转译时忽略的文件夹  
                // loader:'' loaders:'' use:{loader} use:[{}]      
                // use: {
                //     loader: 'babel-loader',
                //     options: {
                //         presets: ['react']
                //     }
                // }
                loader: 'babel-loader',// use:'babel-loader'
                options: {
                    presets: ['env', 'es2015', 'react', 'stage-0'],
                    plugins: ['transform-decorators-legacy']
                }
            },
            {
                test: /\.css$/,
                use: ExtractTextPlugin.extract({
                    fallback: "style-loader",
                    use: [{
                        loader: 'css-loader',
                        options: {
                            minimize: true //css压缩
                        }
                    }, {
                        loader: 'less-loader'
                    }],
                })
            },
            {
                test: /\.(png|jpg|gif)$/,
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            limit: 8192,
                            name: 'static/img/[name].[ext]'
                        }
                    }
                ]
            }
        ]
    },
    optimization: {
        splitChunks: {
            chunks: 'all'
        },
        runtimeChunk: true
        // runtime和vendor
    },
    plugins: [
        // 全局变量
        new webpack.DefinePlugin({
            api_host: JSON.stringify(api_host) // 需要转成JSON字符串
        }),
        new webpack.HotModuleReplacementPlugin(),// 模块热替换
        new HtmlWebpackPlugin({
            template: './src/index.html'
        }),
        new ExtractTextPlugin("css/[name].css")
    ],
    devServer: {
        contentBase: path.join(__dirname, "dist"),
        compress: true,
        port: 1122,
        historyApiFallback: true,
        hot: true,
        proxy: {
            '/user/': {
                target: 'http://localhost:4000'
            },
            '/article/': {
                target: 'http://localhost:4000'
            },
            '/option/': {
                target: 'http://localhost:4000'
            }
        }
    }
}